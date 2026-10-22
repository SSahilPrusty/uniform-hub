import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const getAdminDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalCustomers,
      totalSchools,
      totalFranchises,
      totalTailors,
      totalProducts,
      pendingProductApprovals,
      pendingCatalogRequests,
      totalOrders,
      pendingOrders,
      completedOrders,
      ordersRevenue,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.school.count(),
      prisma.franchiseProfile.count(),
      prisma.tailorProfile.count(),
      prisma.product.count(),
      prisma.productApprovalRequest.count({ where: { status: "PENDING" } }),
      prisma.schoolCatalogRequest.count({ where: { status: "PENDING" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalAmount: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalSchools,
          totalFranchises,
          totalTailors,
          totalProducts,
          pendingApprovals: pendingProductApprovals + pendingCatalogRequests,
          totalOrders,
          pendingOrders,
          completedOrders,
          grossRevenue: ordersRevenue._sum.totalAmount || 0,
        },
        recentActivities,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listAdminCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const where: any = { role: "CUSTOMER" };

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !!isActive },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: isActive ? "USER_ACTIVATED" : "USER_SUSPENDED",
      entityType: "User",
      entityId: userId,
    });

    res.json({ success: true, message: `User status changed to ${isActive ? "active" : "suspended"}.`, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listAdminSchools = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true, catalogRequests: true } },
      },
    });
    res.json({ success: true, data: schools });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifySchool = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.params;
    const { isVerified } = req.body;

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: { isVerified: !!isVerified },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: isVerified ? "SCHOOL_VERIFIED" : "SCHOOL_UNVERIFIED",
      entityType: "School",
      entityId: schoolId,
    });

    res.json({ success: true, message: "School verification status updated.", data: school });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listApprovals = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [productRequests, catalogRequests] = await Promise.all([
      prisma.productApprovalRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            include: { category: true, school: true, variants: true, images: true },
          },
        },
      }),
      prisma.schoolCatalogRequest.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      success: true,
      data: {
        productRequests,
        catalogRequests,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const approveProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "APPROVED" or "REJECTED"

    const reqRecord = await prisma.productApprovalRequest.findUnique({
      where: { id: requestId },
    });

    if (!reqRecord) {
      res.status(404).json({ success: false, error: "Approval request not found." });
      return;
    }

    const updatedRequest = await prisma.productApprovalRequest.update({
      where: { id: requestId },
      data: { status: action },
    });

    await prisma.product.update({
      where: { id: reqRecord.productId },
      data: { status: action === "APPROVED" ? "APPROVED" : "REJECTED" },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: `PRODUCT_${action}`,
      entityType: "Product",
      entityId: reqRecord.productId,
    });

    res.json({ success: true, message: `Product ${action.toLowerCase()} successfully.`, data: updatedRequest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const approveCatalogRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { action, notes } = req.body; // "APPROVED" or "REJECTED"

    const request = await prisma.schoolCatalogRequest.update({
      where: { id: requestId },
      data: {
        status: action,
        adminNotes: notes || null,
      },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: `SCHOOL_CATALOG_REQUEST_${action}`,
      entityType: "SchoolCatalogRequest",
      entityId: requestId,
    });

    res.json({ success: true, message: `School catalog request marked as ${action}.`, data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const where: any = {};

    if (status && typeof status === "string") {
      where.status = status;
    }

    if (search && typeof search === "string") {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
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

export const exportReportCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = "orders" } = req.query;

    if (type === "orders") {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
      });

      let csv = "Order Number,Customer,Email,Phone,Subtotal,Discount,Delivery Fee,Total Amount,Status,Payment Status,Date\n";
      for (const o of orders) {
        csv += `"${o.orderNumber}","${o.customerName}","${o.customerEmail}","${o.customerPhone}",${o.subtotal},${o.discount},${o.deliveryFee},${o.totalAmount},"${o.status}","${o.paymentStatus}","${o.createdAt.toISOString()}"\n`;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=uniform_hub_orders.csv");
      res.send(csv);
      return;
    }

    res.status(400).json({ success: false, error: "Unsupported report export type." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
