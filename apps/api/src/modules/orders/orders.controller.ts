import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        payments: true,
      },
    });

    res.json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            tailoringJobs: true,
          },
        },
        payments: true,
        refunds: true,
        shipments: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: "Order not found." });
      return;
    }

    // Role and ownership check: Admin/SuperAdmin or owning customer
    const isOwner = req.user && req.user.id === order.userId;
    const isAdmin = req.user && ["ADMIN", "SUPER_ADMIN", "FRANCHISE_ADMIN"].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, error: "Unauthorized to access this order." });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const trackOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderIdentifier } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: orderIdentifier }, { trackingNumber: orderIdentifier }, { id: orderIdentifier }],
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        trackingNumber: true,
        courierPartner: true,
        totalAmount: true,
        customerName: true,
        items: {
          select: {
            id: true,
            productName: true,
            size: true,
            quantity: true,
            productImageUrl: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: "No order found matching tracking reference." });
      return;
    }

    // Generate customer-friendly timeline steps synchronized with production
    const productionPipeline = [
      { key: "ORDER_PLACED", label: "Order Placed", desc: "Your uniform order was received and verified." },
      { key: "ASSIGNED", label: "Tailor Assigned", desc: "A certified uniform tailor has been assigned to your order." },
      { key: "ACCEPTED", label: "Tailoring Accepted", desc: "Customer sizes and measurements verified and scheduled." },
      { key: "IN_PROGRESS", label: "Work in Progress", desc: "Precision cutting, tailoring, and stitching underway." },
      { key: "QUALITY_CHECK", label: "Quality Check", desc: "Uniform passed strict quality and sizing inspection." },
      { key: "READY_FOR_DISPATCH", label: "Ready for Dispatch", desc: "Uniform ironed, packed, and prepared for dispatch." },
      { key: "DISPATCHED", label: "Dispatched", desc: `Handed over to ${order.courierPartner || "express courier partner"}.` },
      { key: "DELIVERED", label: "Delivered", desc: "Uniform package safely delivered." },
    ];

    // Determine current pipeline step index
    const statusMapping: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      AWAITING_TAILOR_ASSIGNMENT: 0,
      ASSIGNED: 1,
      ACCEPTED: 2,
      IN_PROGRESS: 3,
      QUALITY_CHECK: 4,
      READY_FOR_DISPATCH: 5,
      SHIPPED: 6,
      DISPATCHED: 6,
      OUT_FOR_DELIVERY: 6,
      DELIVERED: 7,
    };

    const currentStepIndex = statusMapping[order.productionStatus] ?? statusMapping[order.status] ?? 0;

    const timeline = productionPipeline.map((step, idx) => ({
      ...step,
      isCompleted: idx <= currentStepIndex,
      isCurrent: idx === currentStepIndex,
    }));

    res.json({
      success: true,
      data: {
        order,
        timeline,
        isCancelled: order.status === "CANCELLED",
        isReturnRequested: order.status === "RETURN_REQUESTED",
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ success: false, error: "Order not found." });
      return;
    }

    if (order.userId !== req.user!.id && !["ADMIN", "SUPER_ADMIN"].includes(req.user!.role)) {
      res.status(403).json({ success: false, error: "Unauthorized." });
      return;
    }

    if (!["PENDING", "CONFIRMED", "PAYMENT_PENDING"].includes(order.status)) {
      res.status(400).json({
        success: false,
        error: `Order cannot be cancelled at '${order.status}' stage as processing or shipping has begun.`,
      });
      return;
    }

    // Cancel order & restore stock in transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: "CANCELLED", notes: reason ? `Cancelled: ${reason}` : "Cancelled by customer" },
      });

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "ORDER_CANCELLED",
      entityType: "Order",
      entityId: id,
      details: { orderNumber: order.orderNumber, reason },
    });

    res.json({ success: true, message: "Order cancelled successfully and stock restored." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const requestReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order || order.userId !== req.user!.id) {
      res.status(404).json({ success: false, error: "Order not found or access denied." });
      return;
    }

    if (order.status !== "DELIVERED") {
      res.status(400).json({ success: false, error: "Returns can only be requested after delivery." });
      return;
    }

    await prisma.order.update({
      where: { id },
      data: { status: "RETURN_REQUESTED" },
    });

    await prisma.refund.create({
      data: {
        orderId: id,
        amount: order.totalAmount,
        reason: reason || "Size or fit mismatch replacement/return",
        status: "PENDING",
      },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "ORDER_RETURN_REQUESTED",
      entityType: "Order",
      entityId: id,
      details: { reason },
    });

    res.json({
      success: true,
      message: "Return request submitted. Our franchise support team will coordinate inspection & pickup.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
