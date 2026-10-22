import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const getPlatformOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [usersCount, rolesCount, orders, commissionSetting, auditLogsCount] = await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.role.count(),
      prisma.order.findMany({
        where: { paymentStatus: "PAID" },
        select: {
          subtotal: true,
          discount: true,
          deliveryFee: true,
          taxAmount: true,
          totalAmount: true,
        },
      }),
      prisma.platformSetting.findUnique({
        where: { key: "platform_commission_percent" },
      }),
      prisma.auditLog.count(),
    ]);

    const grossOrderValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalDiscounts = orders.reduce((sum, o) => sum + o.discount, 0);
    const totalDeliveryFees = orders.reduce((sum, o) => sum + o.deliveryFee, 0);

    const commissionPercent = commissionSetting ? parseFloat(commissionSetting.value) : 10.0;
    const platformCommissionEarned = Math.round((grossOrderValue * commissionPercent) / 100);
    const vendorPayoutsPayable = Math.max(0, grossOrderValue - platformCommissionEarned);

    res.json({
      success: true,
      data: {
        usersByRole: usersCount.map((u) => ({ role: u.role, count: u._count.id })),
        rolesCount,
        financials: {
          currency: "INR",
          grossOrderValue,
          totalDiscounts,
          totalDeliveryFees,
          commissionPercent,
          platformCommissionEarned,
          vendorPayoutsPayable,
        },
        auditLogsCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;
    const where: any = {};

    if (role && typeof role === "string") {
      where.role = role;
    }

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["SUPER_ADMIN", "ADMIN", "SCHOOL_ADMIN", "FRANCHISE_ADMIN", "TAILOR", "CUSTOMER"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, error: "Invalid role specified." });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: userId,
      details: { newRole: role },
    });

    res.json({ success: true, message: `User role updated to ${role}.`, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFinancialSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.platformSetting.findMany();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePlatformSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      update: {
        value,
        ...(description && { description }),
      },
      create: {
        key,
        value,
        description: description || null,
      },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "PLATFORM_SETTING_UPDATED",
      entityType: "PlatformSetting",
      entityId: key,
      details: { key, value },
    });

    res.json({ success: true, message: "Setting updated.", data: setting });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, limit = "50" } = req.query;
    const take = Math.min(100, parseInt(limit as string, 10) || 50);

    const where: any = {};
    if (search && typeof search === "string") {
      where.OR = [
        { action: { contains: search } },
        { entityType: { contains: search } },
        { userName: { contains: search } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
