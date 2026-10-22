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
                include: {
                  measurement: true,
                },
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
      // Global stats calculations
      Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { productionStatus: "AWAITING_TAILOR_ASSIGNMENT" } }),
        prisma.order.count({ where: { productionStatus: "ASSIGNED" } }),
        prisma.order.count({
          where: {
            productionStatus: { in: ["ACCEPTED", "IN_PROGRESS", "QUALITY_CHECK"] },
          },
        }),
        prisma.order.count({
          where: {
            productionStatus: { in: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED"] },
          },
        }),
        prisma.order.count({
          where: {
            expectedCompletionDate: { lt: new Date() },
            productionStatus: {
              notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
            },
          },
        }),
        prisma.tailorProfile.count({
          where: { isAvailable: true, approvalStatus: "APPROVED" },
        }),
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

/**
 * Admin: Get eligible tailors for an order.
 */
export const getEligibleTailors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const tailors = await getEligibleTailorsForOrder(orderId);
    res.json({ success: true, data: tailors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Manually assign an order to a tailor.
 */
export const assignOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = AssignTailorSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { orderId, tailorId, expectedCompletionDate, priority, notes } = validation.data;

    const result = await manualAssignOrder({
      orderId,
      tailorId,
      adminUserId: req.user!.id,
      expectedCompletionDate,
      priority,
      notes,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "MANUAL_TAILOR_ASSIGNED",
      entityType: "OrderAssignment",
      entityId: result.assignment.id,
      details: {
        orderId,
        tailorId,
        priority,
      },
    });

    res.json({
      success: true,
      message: "Tailor assigned successfully.",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Reassign an order to another tailor.
 */
export const reassignOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = ReassignTailorSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { orderId, newTailorId, reason, expectedCompletionDate } = validation.data;

    const result = await manualAssignOrder({
      orderId,
      tailorId: newTailorId,
      adminUserId: req.user!.id,
      expectedCompletionDate,
      notes: reason,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "TAILOR_REASSIGNED",
      entityType: "OrderAssignment",
      entityId: result.assignment.id,
      details: { orderId, newTailorId, reason },
    });

    res.json({
      success: true,
      message: "Order reassigned successfully.",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Cancel current tailor assignment and return order to unassigned queue.
 */
export const cancelOrderAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const activeAssignment = await prisma.orderAssignment.findFirst({
      where: {
        orderId,
        status: { in: ["ASSIGNED", "ACCEPTED"] },
      },
    });

    if (!activeAssignment) {
      res.status(404).json({ success: false, error: "No active assignment found for this order" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: "CANCELLED",
          reassignmentReason: reason || "Assignment cancelled by Admin.",
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { productionStatus: "AWAITING_TAILOR_ASSIGNMENT" },
      });

      await tx.tailoringJob.updateMany({
        where: { orderId },
        data: { tailorId: null, status: "NEW" },
      });

      await tx.assignmentHistory.create({
        data: {
          orderId,
          previousTailorId: activeAssignment.tailorId,
          changedById: req.user!.id,
          action: "CANCELLED",
          reason: reason || "Assignment cancelled by Admin",
        },
      });

      await tx.productionStatusHistory.create({
        data: {
          orderId,
          previousStatus: "ASSIGNED",
          newStatus: "AWAITING_TAILOR_ASSIGNMENT",
          changedById: req.user!.id,
          notes: `Assignment cancelled by Admin: ${reason || "No reason given"}`,
        },
      });
    });

    await syncTailorActiveOrderCount(activeAssignment.tailorId);

    res.json({
      success: true,
      message: "Order assignment cancelled and returned to queue.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Tailor: Retrieve orders assigned exclusively to the logged-in tailor.
 */
export const getMyAssignedOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const tailor = await prisma.tailorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tailor) {
      res.status(403).json({ success: false, error: "Tailor profile not found." });
      return;
    }

    const { status, search } = req.query;

    const assignmentWhere: any = {
      tailorId: tailor.id,
      status: { in: ["ASSIGNED", "ACCEPTED", "COMPLETED"] },
    };

    if (status && typeof status === "string" && status !== "ALL") {
      assignmentWhere.order = { productionStatus: status };
    }

    const assignments = await prisma.orderAssignment.findMany({
      where: assignmentWhere,
      include: {
        order: {
          include: {
            items: {
              include: {
                tailoringJobs: {
                  include: {
                    measurement: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by search query if present
    let filtered = assignments;
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = assignments.filter(
        (a) =>
          a.order.orderNumber.toLowerCase().includes(q) ||
          a.order.customerName.toLowerCase().includes(q)
      );
    }

    // Workload metrics
    const [activeCount, completedCount, awaitingAcceptance] = await Promise.all([
      prisma.orderAssignment.count({
        where: {
          tailorId: tailor.id,
          status: { in: ["ASSIGNED", "ACCEPTED"] },
          order: {
            productionStatus: {
              notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
            },
          },
        },
      }),
      prisma.orderAssignment.count({
        where: {
          tailorId: tailor.id,
          status: "COMPLETED",
        },
      }),
      prisma.orderAssignment.count({
        where: {
          tailorId: tailor.id,
          status: "ASSIGNED",
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        tailor,
        metrics: {
          activeCount,
          completedCount,
          awaitingAcceptance,
          capacity: tailor.maxActiveOrders,
          availableSlots: Math.max(0, tailor.maxActiveOrders - activeCount),
        },
        orders: filtered.map((a) => ({
          assignmentId: a.id,
          tailorId: a.tailorId,
          assignmentStatus: a.status,
          assignmentMethod: a.assignmentMethod,
          assignedAt: a.assignedAt,
          acceptedAt: a.acceptedAt,
          expectedCompletionDate: a.expectedCompletionDate || a.order.expectedCompletionDate,
          orderId: a.order.id,
          orderNumber: a.order.orderNumber,
          orderReceivedDate: a.order.createdAt,
          customerName: a.order.customerName,
          customerPhone: a.order.customerPhone,
          items: a.order.items,
          totalAmount: a.order.totalAmount,
          paymentStatus: a.order.paymentStatus,
          paymentMethod: a.order.paymentMethod,
          productionStatus: a.order.productionStatus,
          priority: a.order.priority,
          notes: a.order.notes,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Tailor: Accept an assigned order.
 */
export const acceptOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const result = await acceptAssignment(orderId, req.user!.id);

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "TAILOR_ORDER_ACCEPTED",
      entityType: "OrderAssignment",
      entityId: result.assignment.id,
      details: { orderId },
    });

    res.json({
      success: true,
      message: "Order assignment accepted. Scheduled in your active tailoring queue.",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Tailor: Reject an assigned order with mandatory reason.
 */
export const rejectOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = RejectAssignmentSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { reason } = validation.data;
    const result = await rejectAssignment(orderId, req.user!.id, reason);

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "TAILOR_ORDER_REJECTED",
      entityType: "Order",
      entityId: orderId,
      details: { orderId, reason },
    });

    res.json({
      success: true,
      message: "Order assignment rejected. Order returned to Admin queue for reassignment.",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Update production status (Tailor or Admin).
 */
export const changeProductionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = UpdateProductionStatusSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { newStatus, notes } = validation.data;
    const result = await updateProductionStatus({
      orderId,
      newStatus,
      userId: req.user!.id,
      userRole: req.user!.role,
      notes,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "PRODUCTION_STATUS_UPDATED",
      entityType: "Order",
      entityId: orderId,
      details: { newStatus, notes },
    });

    res.json({
      success: true,
      message: `Production status successfully updated to ${newStatus}.`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get comprehensive assignment and production history for an order.
 */
export const getOrderHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    // Authorization check: Customer can only view their own order; Tailor can only view their assigned order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        assignments: {
          where: { status: { in: ["ASSIGNED", "ACCEPTED"] } },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" });
      return;
    }

    if (role === "CUSTOMER" && order.userId !== userId) {
      res.status(403).json({ success: false, error: "Access denied." });
      return;
    }

    if (role === "TAILOR") {
      const tailor = await prisma.tailorProfile.findUnique({ where: { userId } });
      const hasAssignment = order.assignments.some((a) => a.tailorId === tailor?.id);
      if (!hasAssignment) {
        res.status(403).json({ success: false, error: "Access denied to unassigned order." });
        return;
      }
    }

    const history = await getOrderAssignmentHistory(orderId);

    // If caller is a customer, sanitize private tailor details and internal audit notes
    if (role === "CUSTOMER") {
      const sanitizedHistory = {
        productionHistory: history.productionHistory.map((ph) => ({
          status: ph.newStatus,
          timestamp: ph.createdAt,
          notes: ph.notes,
        })),
        isTailorAssigned: history.assignments.length > 0,
      };
      res.json({ success: true, data: sanitizedHistory });
      return;
    }

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Update priority and expected completion date for an order.
 */
export const updateOrderPriorityAndDeadline = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = UpdateOrderPrioritySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { priority, expectedCompletionDate } = validation.data;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        priority,
        expectedCompletionDate: expectedCompletionDate
          ? new Date(expectedCompletionDate)
          : undefined,
      },
    });

    // Sync deadline on active assignment
    if (expectedCompletionDate) {
      await prisma.orderAssignment.updateMany({
        where: {
          orderId,
          status: { in: ["ASSIGNED", "ACCEPTED"] },
        },
        data: { expectedCompletionDate: new Date(expectedCompletionDate) },
      });
    }

    res.json({
      success: true,
      message: "Order priority and deadline updated.",
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Tailor / Admin: Update tailor availability and capacity.
 */
export const updateTailorSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tailorId } = req.params;
    const validation = UpdateTailorAvailabilitySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { isAvailable, maxActiveOrders } = validation.data;
    const userRole = req.user!.role;

    // If caller is tailor, verify they own this profile
    if (userRole === "TAILOR") {
      const myProfile = await prisma.tailorProfile.findUnique({
        where: { userId: req.user!.id },
      });
      if (!myProfile || myProfile.id !== tailorId) {
        res.status(403).json({ success: false, error: "Access denied." });
        return;
      }
    }

    const updateData: any = { isAvailable };
    if (maxActiveOrders !== undefined && ["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
      updateData.maxActiveOrders = maxActiveOrders;
    }

    const updated = await prisma.tailorProfile.update({
      where: { id: tailorId },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Tailor availability and capacity updated.",
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Get all tailor applicants categorized by Pending, Approved, and Rejected.
 */
export const getTailorApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && typeof status === "string" && status !== "ALL") {
      where.approvalStatus = status;
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      where.OR = [
        { tailorName: { contains: q } },
        { shopName: { contains: q } },
        { phone: { contains: q } },
        { user: { email: { contains: q } } },
      ];
    }

    const tailors = await prisma.tailorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Counts for tabs
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.tailorProfile.count({ where: { approvalStatus: "PENDING" } }),
      prisma.tailorProfile.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.tailorProfile.count({ where: { approvalStatus: "REJECTED" } }),
    ]);

    const formatted = await Promise.all(
      tailors.map(async (t) => {
        const activeCount = await prisma.orderAssignment.count({
          where: {
            tailorId: t.id,
            status: { in: ["ASSIGNED", "ACCEPTED"] },
            order: {
              productionStatus: {
                notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
              },
            },
          },
        });

        const completedCount = await prisma.orderAssignment.count({
          where: {
            tailorId: t.id,
            status: "COMPLETED",
          },
        });

        return {
          id: t.id,
          userId: t.userId,
          name: t.tailorName,
          shopName: t.shopName,
          email: t.user.email,
          phone: t.phone || t.user.phone || "Not Provided",
          registrationDate: t.createdAt,
          specialization: t.specializations || "Not Provided",
          skills: t.skills || "Not Provided",
          experience: t.experience || "Not Provided",
          address: t.address || "Not Provided",
          city: t.city || "Not Provided",
          state: t.state || "Not Provided",
          documentsUrl: t.documentsUrl || "Not Provided",
          approvalStatus: t.approvalStatus,
          rejectionReason: t.rejectionReason || null,
          approvedAt: t.approvedAt,
          rejectedAt: t.rejectedAt,
          isVerified: t.isVerified,
          isAvailable: t.isAvailable,
          isActive: t.user.isActive,
          maxActiveOrders: t.maxActiveOrders,
          activeOrderCount: activeCount,
          completedOrdersCount: completedCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        summary: {
          pendingCount,
          approvedCount,
          rejectedCount,
          total: pendingCount + approvedCount + rejectedCount,
        },
        applications: formatted,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Approve a pending tailor application.
 */
export const approveTailorApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tailorId } = req.params;
    const adminId = req.user!.id;
    const adminName = req.user!.name;

    const tailor = await prisma.tailorProfile.findUnique({
      where: { id: tailorId },
      include: { user: true },
    });

    if (!tailor) {
      res.status(404).json({ success: false, error: "Tailor application not found" });
      return;
    }

    const updated = await prisma.tailorProfile.update({
      where: { id: tailorId },
      data: {
        approvalStatus: "APPROVED",
        isVerified: true,
        isAvailable: true,
        rejectionReason: null,
        approvedAt: new Date(),
        approvedById: adminId,
      },
      include: { user: true },
    });

    // Make sure user account is active
    await prisma.user.update({
      where: { id: tailor.userId },
      data: { isActive: true },
    });

    await logAudit({
      userId: adminId,
      userName: adminName,
      action: "TAILOR_APPLICATION_APPROVED",
      entityType: "TailorProfile",
      entityId: tailorId,
      details: { tailorName: tailor.tailorName, shopName: tailor.shopName },
    });

    // Notify the tailor
    await prisma.notification.create({
      data: {
        userId: tailor.userId,
        title: "Tailor Application Approved! 🎉",
        message: "Congratulations! Your Uniform Hub tailor partnership application has been approved by Operations. You can now access your workbench and receive customer order assignments.",
        type: "APPROVAL",
        linkUrl: "/tailor",
      },
    });

    res.json({
      success: true,
      message: `Tailor "${tailor.tailorName}" approved successfully and is now eligible for order assignments.`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Reject a tailor application with mandatory reason.
 */
export const rejectTailorApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tailorId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;
    const adminName = req.user!.name;

    if (!reason || reason.trim().length < 3) {
      res.status(400).json({
        success: false,
        error: "A valid rejection reason (at least 3 characters) is required.",
      });
      return;
    }

    const tailor = await prisma.tailorProfile.findUnique({
      where: { id: tailorId },
      include: { user: true },
    });

    if (!tailor) {
      res.status(404).json({ success: false, error: "Tailor application not found" });
      return;
    }

    const updated = await prisma.tailorProfile.update({
      where: { id: tailorId },
      data: {
        approvalStatus: "REJECTED",
        rejectionReason: reason.trim(),
        rejectedAt: new Date(),
        rejectedById: adminId,
        isAvailable: false,
      },
    });

    await logAudit({
      userId: adminId,
      userName: adminName,
      action: "TAILOR_APPLICATION_REJECTED",
      entityType: "TailorProfile",
      entityId: tailorId,
      details: { tailorName: tailor.tailorName, reason: reason.trim() },
    });

    // Notify the tailor
    await prisma.notification.create({
      data: {
        userId: tailor.userId,
        title: "Tailor Application Status Update",
        message: `Your Uniform Hub tailoring application was not approved. Reason: "${reason.trim()}". You may contact Operations Support for more information.`,
        type: "ALERT",
      },
    });

    res.json({
      success: true,
      message: `Application for "${tailor.tailorName}" rejected.`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin: Activate or Deactivate Tailor Availability / Suspension.
 */
export const toggleTailorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tailorId } = req.params;
    const { isAvailable, isActive } = req.body;
    const adminId = req.user!.id;

    const tailor = await prisma.tailorProfile.findUnique({
      where: { id: tailorId },
      include: { user: true },
    });

    if (!tailor) {
      res.status(404).json({ success: false, error: "Tailor profile not found" });
      return;
    }

    if (isAvailable !== undefined) {
      await prisma.tailorProfile.update({
        where: { id: tailorId },
        data: { isAvailable: !!isAvailable },
      });
    }

    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id: tailor.userId },
        data: { isActive: !!isActive },
      });
    }

    await logAudit({
      userId: adminId,
      userName: req.user!.name,
      action: "TAILOR_STATUS_TOGGLED",
      entityType: "TailorProfile",
      entityId: tailorId,
      details: { isAvailable, isActive },
    });

    res.json({
      success: true,
      message: "Tailor operational status updated.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
