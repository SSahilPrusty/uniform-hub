// @ts-nocheck
import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import {
  autoAssignOrder,
  manualAssignOrder,
  acceptAssignment,
  rejectAssignment,
  updateProductionStatus,
  getOrderAssignmentHistory,
  getEligibleTailorsForOrder,
  syncTailorActiveOrderCount,
} from "./assignment.service.js";
import {
  AssignTailorSchema,
  ReassignTailorSchema,
  RejectAssignmentSchema,
  UpdateProductionStatusSchema,
  UpdateTailorAvailabilitySchema,
  UpdateOrderPrioritySchema,
} from "@uniform-hub/shared";
import { logAudit } from "../../utils/audit.js";

/**
 * Admin: Get dashboard orders with filtering, pagination, and statistical summary.
 */
export const getAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      search,
      tailorId,
      priority,
      page = "1",
      limit = "15",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 15));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    // Production status filter
    if (status && typeof status === "string" && status !== "ALL") {
      if (status === "OVERDUE") {
        where.expectedCompletionDate = { lt: new Date() };
        where.productionStatus = {
          notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
        };
      } else {
        where.productionStatus = status;
      }
    }

    if (priority && typeof priority === "string" && priority !== "ALL") {
      where.priority = priority;
    }

    if (tailorId && typeof tailorId === "string" && tailorId !== "ALL") {
      where.assignments = {
        some: {
          tailorId,
          status: { in: ["ASSIGNED", "ACCEPTED"] },
        },
      };
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q } },
        { orderNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerEmail: { contains: q } },
        { customerPhone: { contains: q } },
        { items: { some: { productName: { contains: q } } } },
      ];
    }

    const [orders, totalCount, statsData] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              tailoringJobs: {
                include: { measurement: true },
              },
            },
          },
          assignments: {
            where: { status: { in: ["ASSIGNED", "ACCEPTED"] } },
            include: {
              tailor: {
                select: {
                  id: true,
                  tailorName: true,
                  shopName: true,
                  phone: true,
                  city: true,
                  specializations: true,
                  maxActiveOrders: true,
                  activeOrderCount: true,
                },
              },
            },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.order.count({ where }),
      Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { productionStatus: "AWAITING_TAILOR_ASSIGNMENT" } }),
        prisma.order.count({ where: { productionStatus: "ASSIGNED" } }),
        prisma.order.count({
          where: { productionStatus: { in: ["ACCEPTED", "IN_PROGRESS", "QUALITY_CHECK"] } },
        }),
        prisma.order.count({
          where: { productionStatus: { in: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED"] } },
        }),
        prisma.order.count({
          where: {
            expectedCompletionDate: { lt: new Date() },
            productionStatus: {
              notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
            },
          },
        }),
        prisma.tailorProfile.count({ where: { isAvailable: true, approvalStatus: "APPROVED" } }),
      ]),
    ]);

    const [
      totalOrders,
      ordersAwaitingAssignment,
      ordersAssigned,
      ordersInProgress,
      ordersCompleted,
      overdueOrders,
      availableTailors,
    ] = statsData;

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          ordersAwaitingAssignment,
          ordersAssigned,
          ordersInProgress,
          ordersCompleted,
          overdueOrders,
          availableTailors,
        },
        orders: orders.map((o) => ({
          ...o,
          currentAssignment: o.assignments[0] || null,
          assignedTailor: o.assignments[0]?.tailor || null,
        })),
        pagination: {
          page: pageNum,
          limit: take,
          total: totalCount,
          totalPages: Math.ceil(totalCount / take),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// The rest of the file remains unchanged – existing exported handlers continue below.
