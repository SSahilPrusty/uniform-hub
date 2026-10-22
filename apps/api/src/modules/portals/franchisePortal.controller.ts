import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const getFranchiseDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const franchise = await prisma.franchiseProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!franchise) {
      res.status(403).json({ success: false, error: "Franchise profile not found." });
      return;
    }

    const [totalProducts, lowStockVariants, assignedOrders] = await Promise.all([
      prisma.product.count({
        where: { franchiseId: franchise.id },
      }),
      prisma.productVariant.findMany({
        where: {
          product: { franchiseId: franchise.id },
          stock: { lte: 10 },
        },
        include: { product: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: true },
      }),
    ]);

    const totalRevenue = assignedOrders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    res.json({
      success: true,
      data: {
        franchise,
        metrics: {
          totalProducts,
          lowStockCount: lowStockVariants.length,
          totalAssignedOrders: assignedOrders.length,
          totalRevenue,
        },
        lowStockVariants,
        recentOrders: assignedOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFranchiseProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const franchise = await prisma.franchiseProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!franchise) {
      res.status(403).json({ success: false, error: "Franchise profile not found." });
      return;
    }

    const products = await prisma.product.findMany({
      where: { franchiseId: franchise.id },
      include: {
        category: true,
        school: true,
        variants: true,
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createFranchiseProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const franchise = await prisma.franchiseProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!franchise) {
      res.status(403).json({ success: false, error: "Franchise profile not found." });
      return;
    }

    const {
      name,
      description,
      categoryId,
      schoolId,
      gender = "UNISEX",
      fabricDetails,
      careInstructions,
      allowTailoring = false,
      variants,
      imageUrl,
    } = req.body;

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        schoolId: schoolId || null,
        franchiseId: franchise.id,
        gender,
        fabricDetails: fabricDetails || null,
        careInstructions: careInstructions || null,
        allowTailoring: !!allowTailoring,
        status: "PENDING_APPROVAL", // requires Admin review
        variants: {
          create: (variants || []).map((v: any, index: number) => ({
            sku: `${slug.toUpperCase()}-SZ${v.size}-${index}`,
            size: v.size,
            color: v.color || null,
            mrp: parseFloat(v.mrp),
            sellingPrice: parseFloat(v.sellingPrice),
            stock: parseInt(v.stock, 10) || 0,
            isAvailable: true,
          })),
        },
      },
    });

    if (imageUrl) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrl,
          altText: `${name} Front View`,
          isPrimary: true,
          schoolId: product.schoolId,
        },
      });
    }

    await prisma.productApprovalRequest.create({
      data: {
        productId: product.id,
        submittedBy: franchise.businessName,
        status: "PENDING",
        notes: "New franchise product listing submission.",
      },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "FRANCHISE_PRODUCT_SUBMITTED",
      entityType: "Product",
      entityId: product.id,
      details: { name, slug, franchiseId: franchise.id },
    });

    res.status(201).json({
      success: true,
      message: "Product submitted successfully. It will be live once approved by Uniform Hub Admin.",
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateVariantStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;
    const { stock, sellingPrice, isAvailable } = req.body;

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(sellingPrice !== undefined && { sellingPrice: parseFloat(sellingPrice) }),
        ...(isAvailable !== undefined && { isAvailable: !!isAvailable }),
      },
    });

    res.json({ success: true, message: "Inventory updated.", data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateFranchiseOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, courierPartner } = req.body;

    const validTransitions = ["CONFIRMED", "PROCESSING", "READY_FOR_DISPATCH", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
    if (!validTransitions.includes(status)) {
      res.status(400).json({ success: false, error: "Invalid status transition." });
      return;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(trackingNumber && { trackingNumber }),
        ...(courierPartner && { courierPartner }),
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: `Order Update: ${status}`,
        message: `Your uniform order #${order.orderNumber} status is now ${status}.`,
        type: "ORDER",
        linkUrl: `/orders/${order.id}/track`,
      },
    });

    res.json({ success: true, message: "Order fulfillment status updated.", data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
