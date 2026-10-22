import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

// Valid production workflow transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["AWAITING_TAILOR_ASSIGNMENT", "ASSIGNED", "CANCELLED"],
  AWAITING_TAILOR_ASSIGNMENT: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "AWAITING_TAILOR_ASSIGNMENT", "CANCELLED"], // Rejection goes back to AWAITING_TAILOR_ASSIGNMENT
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["QUALITY_CHECK", "READY_FOR_DISPATCH", "CANCELLED"],
  QUALITY_CHECK: ["READY_FOR_DISPATCH", "IN_PROGRESS", "CANCELLED"], // Failed QC can go back to IN_PROGRESS
  READY_FOR_DISPATCH: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Recalculates and synchronizes the active order count for a given tailor.
 */
export async function syncTailorActiveOrderCount(tailorId: string): Promise<number> {
  const count = await prisma.orderAssignment.count({
    where: {
      tailorId,
      status: { in: ["ASSIGNED", "ACCEPTED"] },
      order: {
        productionStatus: {
          notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
        },
      },
    },
  });

  await prisma.tailorProfile.update({
    where: { id: tailorId },
    data: { activeOrderCount: count },
  });

  return count;
}

/**
 * Checks if an order requires tailoring or custom stitching.
 */
export async function orderRequiresTailoring(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      tailoringJobs: true,
    },
  });

  if (!order) return false;

  // Has custom measurements or tailoring jobs
  const hasCustomMeasurements = order.items.some((item) => !!item.customMeasurementId);
  if (hasCustomMeasurements || order.tailoringJobs.length > 0) {
    return true;
  }

  // Check product records to see if any allow tailoring
  const productIds = order.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      allowTailoring: true,
    },
  });

  return products.length > 0;
}

/**
 * Automatically assigns an order to the best eligible tailor.
 * Enforces atomic transaction and workload balance.
 */
export async function autoAssignOrder(orderId: string): Promise<{
  assigned: boolean;
  tailorId?: string;
  tailorName?: string;
  reason?: string;
}> {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch order with items
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        assignments: {
          where: { status: { in: ["ASSIGNED", "ACCEPTED"] } },
        },
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Check if already assigned actively
    if (order.assignments.length > 0) {
      return {
        assigned: true,
        tailorId: order.assignments[0].tailorId,
        reason: "Order already has an active assignment.",
      };
    }

    // 2. Check if tailoring is required
    const hasMeasurements = order.items.some((i) => !!i.customMeasurementId);
    let requiresTailoring = hasMeasurements;

    if (!requiresTailoring) {
      const productIds = order.items.map((i) => i.productId);
      const tailoredProducts = await tx.product.findMany({
        where: { id: { in: productIds }, allowTailoring: true },
      });
      if (tailoredProducts.length > 0) {
        requiresTailoring = true;
      }
    }

    if (!requiresTailoring) {
      // Order doesn't require tailoring; advance to ready for dispatch
      await tx.order.update({
        where: { id: orderId },
        data: { productionStatus: "READY_FOR_DISPATCH" },
      });

      await tx.productionStatusHistory.create({
        data: {
          orderId,
          previousStatus: order.productionStatus,
          newStatus: "READY_FOR_DISPATCH",
          notes: "No custom tailoring required for this order; prepared for direct warehouse dispatch.",
        },
      });

      return {
        assigned: false,
        reason: "Order does not require tailoring.",
      };
    }

    // 3. Find candidate tailors:
    // - User isActive = true
    // - Tailor isAvailable = true
    // - Tailor approvalStatus = "APPROVED"
    // - activeOrderCount < maxActiveOrders
    const candidateTailors = await tx.tailorProfile.findMany({
      where: {
        isAvailable: true,
        approvalStatus: "APPROVED",
        user: { isActive: true },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Compute live active workload for each candidate
    const eligibleWithLiveWorkload = [];
    for (const tailor of candidateTailors) {
      const activeCount = await tx.orderAssignment.count({
        where: {
          tailorId: tailor.id,
          status: { in: ["ASSIGNED", "ACCEPTED"] },
          order: {
            productionStatus: {
              notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
            },
          },
        },
      });

      if (activeCount < tailor.maxActiveOrders) {
        eligibleWithLiveWorkload.push({
          tailor,
          activeCount,
          capacityMargin: tailor.maxActiveOrders - activeCount,
        });
      }
    }

    // 4. If no eligible tailor is available:
    if (eligibleWithLiveWorkload.length === 0) {
      await tx.order.update({
        where: { id: orderId },
        data: { productionStatus: "AWAITING_TAILOR_ASSIGNMENT" },
      });

      await tx.productionStatusHistory.create({
        data: {
          orderId,
          previousStatus: order.productionStatus,
          newStatus: "AWAITING_TAILOR_ASSIGNMENT",
          notes: "No eligible tailors with available capacity found. Placed in Admin reassignment queue.",
        },
      });

      // Find operations admins to notify
      const admins = await tx.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
        select: { id: true },
      });

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            title: "Order Awaiting Tailor Assignment",
            message: `Order #${order.orderNumber} requires custom tailoring, but all eligible tailors are currently at capacity. Please manually assign a tailor.`,
            type: "ALERT",
            linkUrl: `/admin?tab=tailor-management&orderId=${order.id}`,
          },
        });
      }

      return {
        assigned: false,
        reason: "No eligible tailors currently available with capacity. Order placed in Awaiting Assignment queue.",
      };
    }

    // 5. Sort candidates:
    // Primary: lowest activeCount
    // Secondary: highest capacityMargin
    // Fair tie-breaking: deterministic sort by tailor id
    eligibleWithLiveWorkload.sort((a, b) => {
      if (a.activeCount !== b.activeCount) {
        return a.activeCount - b.activeCount;
      }
      if (b.capacityMargin !== a.capacityMargin) {
        return b.capacityMargin - a.capacityMargin;
      }
      return a.tailor.id.localeCompare(b.tailor.id);
    });

    const chosen = eligibleWithLiveWorkload[0];
    const defaultDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

    // 6. Create Assignment Record
    const assignment = await tx.orderAssignment.create({
      data: {
        orderId,
        tailorId: chosen.tailor.id,
        assignmentMethod: "AUTOMATIC",
        status: "ASSIGNED",
        expectedCompletionDate: defaultDeadline,
        notes: `Automatically assigned based on workload optimization (${chosen.activeCount}/${chosen.tailor.maxActiveOrders} active orders).`,
      },
    });

    // 7. Update Order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        productionStatus: "ASSIGNED",
        expectedCompletionDate: defaultDeadline,
      },
    });

    // 8. Update tailor active order count cache
    await tx.tailorProfile.update({
      where: { id: chosen.tailor.id },
      data: { activeOrderCount: chosen.activeCount + 1 },
    });

    // 9. Sync any TailoringJobs
    await tx.tailoringJob.updateMany({
      where: { orderId },
      data: {
        tailorId: chosen.tailor.id,
        status: "ASSIGNED",
      },
    });

    // 10. Record in Audit & History
    await tx.assignmentHistory.create({
      data: {
        orderId,
        newTailorId: chosen.tailor.id,
        action: "AUTO_ASSIGNED",
        reason: `Auto-assigned to ${chosen.tailor.tailorName} with lowest active workload (${chosen.activeCount} active).`,
      },
    });

    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "ASSIGNED",
        notes: `Order assigned to tailor ${chosen.tailor.tailorName} (${chosen.tailor.shopName}).`,
      },
    });

    // 11. Notify Tailor
    await tx.notification.create({
      data: {
        userId: chosen.tailor.userId,
        title: "New Uniform Order Assigned",
        message: `Order #${order.orderNumber} has been automatically assigned to your shop. Please review customer measurements and accept the order.`,
        type: "ORDER",
        linkUrl: `/tailor?tab=assigned-orders&orderId=${order.id}`,
      },
    });

    // 12. Notify Customer
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Tailor Assigned to Your Order",
        message: `Your custom uniform order #${order.orderNumber} has been assigned to our master tailoring partner for precision stitching.`,
        type: "ORDER",
        linkUrl: `/orders/${order.id}/track`,
      },
    });

    return {
      assigned: true,
      tailorId: chosen.tailor.id,
      tailorName: chosen.tailor.tailorName,
    };
  });
}

/**
 * Manually assigns an order to a specified tailor by Admin.
 */
export async function manualAssignOrder(params: {
  orderId: string;
  tailorId: string;
  adminUserId: string;
  expectedCompletionDate?: string | null;
  priority?: string;
  notes?: string | null;
}) {
  const { orderId, tailorId, adminUserId, expectedCompletionDate, priority, notes } = params;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        assignments: { where: { status: { in: ["ASSIGNED", "ACCEPTED"] } } },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const tailor = await tx.tailorProfile.findUnique({
      where: { id: tailorId },
      include: { user: true },
    });

    if (!tailor) {
      throw new Error("Tailor profile not found");
    }

    if (!tailor.user.isActive) {
      throw new Error("Cannot assign order to an inactive tailor account");
    }

    if (tailor.approvalStatus !== "APPROVED") {
      throw new Error("Cannot assign order to an unapproved tailor");
    }

    const previousAssignment = order.assignments[0];
    const previousTailorId = previousAssignment?.tailorId;

    // If already actively assigned to this exact tailor, return early
    if (previousTailorId === tailorId) {
      // Just update priority / deadline if changed
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          priority: priority || order.priority,
          expectedCompletionDate: expectedCompletionDate
            ? new Date(expectedCompletionDate)
            : order.expectedCompletionDate,
        },
      });
      return { order: updatedOrder, assignment: previousAssignment };
    }

    // Cancel previous active assignment if exists
    if (previousAssignment) {
      await tx.orderAssignment.update({
        where: { id: previousAssignment.id },
        data: {
          status: "CANCELLED",
          reassignmentReason: notes || "Reassigned by Operations Admin",
        },
      });

      // Recalculate previous tailor's workload
      const prevCount = await tx.orderAssignment.count({
        where: {
          tailorId: previousTailorId,
          status: { in: ["ASSIGNED", "ACCEPTED"] },
          order: {
            productionStatus: {
              notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
            },
          },
        },
      });
      await tx.tailorProfile.update({
        where: { id: previousTailorId },
        data: { activeOrderCount: prevCount },
      });
    }

    const completionDate = expectedCompletionDate
      ? new Date(expectedCompletionDate)
      : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    // Create new assignment
    const assignment = await tx.orderAssignment.create({
      data: {
        orderId,
        tailorId,
        assignedById: adminUserId,
        assignmentMethod: "MANUAL",
        status: "ASSIGNED",
        expectedCompletionDate: completionDate,
        notes: notes || "Manually assigned by Operations Admin.",
      },
    });

    // Update order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        productionStatus: "ASSIGNED",
        priority: priority || "NORMAL",
        expectedCompletionDate: completionDate,
      },
    });

    // Update tailor's active count
    const newCount = await tx.orderAssignment.count({
      where: {
        tailorId,
        status: { in: ["ASSIGNED", "ACCEPTED"] },
        order: {
          productionStatus: {
            notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
          },
        },
      },
    });
    await tx.tailorProfile.update({
      where: { id: tailorId },
      data: { activeOrderCount: newCount },
    });

    // Update tailoring jobs
    await tx.tailoringJob.updateMany({
      where: { orderId },
      data: {
        tailorId,
        status: "ASSIGNED",
      },
    });

    // Record history
    await tx.assignmentHistory.create({
      data: {
        orderId,
        previousTailorId: previousTailorId || null,
        newTailorId: tailorId,
        changedById: adminUserId,
        action: previousAssignment ? "REASSIGNED" : "MANUALLY_ASSIGNED",
        reason: notes || "Admin assignment override",
      },
    });

    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "ASSIGNED",
        changedById: adminUserId,
        notes: `Order manually assigned to ${tailor.tailorName} by Operations Admin.`,
      },
    });

    // Notify new tailor
    await tx.notification.create({
      data: {
        userId: tailor.userId,
        title: "Order Assigned by Admin",
        message: `Order #${order.orderNumber} has been assigned to your shop by Uniform Hub Operations.`,
        type: "ORDER",
        linkUrl: `/tailor?tab=assigned-orders&orderId=${order.id}`,
      },
    });

    // If previous tailor existed, notify them of reassignment
    if (previousAssignment && previousTailorId) {
      const prevTailor = await tx.tailorProfile.findUnique({
        where: { id: previousTailorId },
      });
      if (prevTailor) {
        await tx.notification.create({
          data: {
            userId: prevTailor.userId,
            title: "Order Reassigned",
            message: `Order #${order.orderNumber} has been reassigned to another partner by Admin.`,
            type: "INFO",
          },
        });
      }
    }

    return { order: updatedOrder, assignment };
  });
}

/**
 * Tailor accepts an assigned order.
 */
export async function acceptAssignment(orderId: string, tailorUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const tailor = await tx.tailorProfile.findUnique({
      where: { userId: tailorUserId },
    });

    if (!tailor) {
      throw new Error("Tailor profile not found");
    }

    const assignment = await tx.orderAssignment.findFirst({
      where: {
        orderId,
        tailorId: tailor.id,
        status: "ASSIGNED",
      },
      include: { order: true },
    });

    if (!assignment) {
      throw new Error("No active assignment awaiting acceptance for this tailor and order");
    }

    // Update assignment to ACCEPTED
    const updatedAssignment = await tx.orderAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // Update order productionStatus
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { productionStatus: "ACCEPTED" },
    });

    // Update tailoring jobs
    await tx.tailoringJob.updateMany({
      where: { orderId, tailorId: tailor.id },
      data: { status: "ACCEPTED" },
    });

    // Record in history
    await tx.assignmentHistory.create({
      data: {
        orderId,
        newTailorId: tailor.id,
        changedById: tailorUserId,
        action: "ACCEPTED",
        reason: "Tailor reviewed measurements and accepted the order assignment.",
      },
    });

    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: "ASSIGNED",
        newStatus: "ACCEPTED",
        changedById: tailorUserId,
        notes: `Tailor ${tailor.tailorName} accepted order #${assignment.order.orderNumber}.`,
      },
    });

    // Notify Customer
    await tx.notification.create({
      data: {
        userId: assignment.order.userId,
        title: "Tailoring Accepted",
        message: `Your uniform order #${assignment.order.orderNumber} has been accepted by the tailor and scheduled for crafting.`,
        type: "ORDER",
        linkUrl: `/orders/${orderId}/track`,
      },
    });

    return { order: updatedOrder, assignment: updatedAssignment };
  });
}

/**
 * Tailor rejects an assigned order.
 * Rejection reason is required. Order is returned to Admin queue.
 */
export async function rejectAssignment(orderId: string, tailorUserId: string, reason: string) {
  if (!reason || reason.trim().length < 3) {
    throw new Error("A valid rejection reason (at least 3 characters) is required.");
  }

  return await prisma.$transaction(async (tx) => {
    const tailor = await tx.tailorProfile.findUnique({
      where: { userId: tailorUserId },
    });

    if (!tailor) {
      throw new Error("Tailor profile not found");
    }

    const assignment = await tx.orderAssignment.findFirst({
      where: {
        orderId,
        tailorId: tailor.id,
        status: "ASSIGNED",
      },
      include: { order: true },
    });

    if (!assignment) {
      throw new Error("Active assignment not found for this order");
    }

    // Update assignment to REJECTED
    await tx.orderAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
      },
    });

    // Update tailor active count
    const updatedCount = await tx.orderAssignment.count({
      where: {
        tailorId: tailor.id,
        status: { in: ["ASSIGNED", "ACCEPTED"] },
        order: {
          productionStatus: {
            notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
          },
        },
      },
    });
    await tx.tailorProfile.update({
      where: { id: tailor.id },
      data: { activeOrderCount: updatedCount },
    });

    // Return order to AWAITING_TAILOR_ASSIGNMENT queue
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { productionStatus: "AWAITING_TAILOR_ASSIGNMENT" },
    });

    // Unassign tailoring jobs
    await tx.tailoringJob.updateMany({
      where: { orderId, tailorId: tailor.id },
      data: { tailorId: null, status: "NEW" },
    });

    // Record in history
    await tx.assignmentHistory.create({
      data: {
        orderId,
        previousTailorId: tailor.id,
        changedById: tailorUserId,
        action: "REJECTED",
        reason: reason.trim(),
      },
    });

    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: "ASSIGNED",
        newStatus: "AWAITING_TAILOR_ASSIGNMENT",
        changedById: tailorUserId,
        notes: `Tailor rejected assignment: ${reason.trim()}. Returned to Admin reassignment queue.`,
      },
    });

    // Notify operations admins
    const admins = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          title: "Tailor Rejected Assignment",
          message: `Tailor ${tailor.tailorName} rejected order #${assignment.order.orderNumber}. Reason: "${reason.trim()}". Order is awaiting reassignment.`,
          type: "ALERT",
          linkUrl: `/admin?tab=tailor-management&orderId=${orderId}`,
        },
      });
    }

    return { order: updatedOrder };
  });
}

/**
 * Updates production status following strict workflow transition rules.
 */
export async function updateProductionStatus(params: {
  orderId: string;
  newStatus: string;
  userId: string;
  userRole: string;
  notes?: string | null;
}) {
  const { orderId, newStatus, userId, userRole, notes } = params;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        assignments: {
          where: { status: { in: ["ASSIGNED", "ACCEPTED"] } },
          include: { tailor: true },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const currentStatus = order.productionStatus;

    // Check tailor authorization: if caller is a tailor, they must be the assigned tailor
    if (userRole === "TAILOR") {
      const tailor = await tx.tailorProfile.findUnique({
        where: { userId },
      });
      if (!tailor) {
        throw new Error("Tailor profile not found");
      }

      const activeAssignment = order.assignments.find((a) => a.tailorId === tailor.id);
      if (!activeAssignment) {
        throw new Error("Access denied: You are not assigned to this order.");
      }

      // Tailors cannot set status to DISPATCHED or DELIVERED (handled by logistics/admin)
      const allowedTailorStatuses = [
        "ACCEPTED",
        "IN_PROGRESS",
        "QUALITY_CHECK",
        "READY_FOR_DISPATCH",
      ];
      if (!allowedTailorStatuses.includes(newStatus)) {
        throw new Error(`Tailors are not permitted to set status to ${newStatus}`);
      }
    }

    // Validate workflow transition
    const validNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!validNextStatuses.includes(newStatus) && userRole !== "SUPER_ADMIN") {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed: ${
          validNextStatuses.length ? validNextStatuses.join(", ") : "None"
        }`
      );
    }

    // Update order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { productionStatus: newStatus },
    });

    // If order reaches READY_FOR_DISPATCH, DISPATCHED, or DELIVERED, mark active assignment completed
    if (["READY_FOR_DISPATCH", "DELIVERED", "COMPLETED"].includes(newStatus)) {
      for (const assignment of order.assignments) {
        await tx.orderAssignment.update({
          where: { id: assignment.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        // Decrement tailor active count
        const newCount = await tx.orderAssignment.count({
          where: {
            tailorId: assignment.tailorId,
            status: { in: ["ASSIGNED", "ACCEPTED"] },
            order: {
              productionStatus: {
                notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
              },
            },
          },
        });
        await tx.tailorProfile.update({
          where: { id: assignment.tailorId },
          data: { activeOrderCount: newCount },
        });
      }
    }

    // If order is CANCELLED, cancel active assignments
    if (newStatus === "CANCELLED") {
      for (const assignment of order.assignments) {
        await tx.orderAssignment.update({
          where: { id: assignment.id },
          data: { status: "CANCELLED" },
        });
        const newCount = await tx.orderAssignment.count({
          where: {
            tailorId: assignment.tailorId,
            status: { in: ["ASSIGNED", "ACCEPTED"] },
            order: {
              productionStatus: {
                notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
              },
            },
          },
        });
        await tx.tailorProfile.update({
          where: { id: assignment.tailorId },
          data: { activeOrderCount: newCount },
        });
      }
    }

    // Update tailoringJobs status accordingly
    const jobStatusMap: Record<string, string> = {
      IN_PROGRESS: "IN_PROGRESS",
      QUALITY_CHECK: "QUALITY_CHECK",
      READY_FOR_DISPATCH: "READY",
      DELIVERED: "COMPLETED",
      CANCELLED: "CANCELLED",
    };
    if (jobStatusMap[newStatus]) {
      await tx.tailoringJob.updateMany({
        where: { orderId },
        data: { status: jobStatusMap[newStatus] },
      });
    }

    // Record in history
    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: currentStatus,
        newStatus,
        changedById: userId,
        notes: notes || `Production status updated to ${newStatus}`,
      },
    });

    // Customer friendly status notifications
    const customerStatusMessages: Record<string, string> = {
      IN_PROGRESS: "Your uniform is currently being hand-tailored by our master tailoring partner.",
      QUALITY_CHECK: "Your tailored uniforms have reached our Quality Inspection checkpoint.",
      READY_FOR_DISPATCH: "Your uniforms have passed inspection and are packed and ready for dispatch.",
      DISPATCHED: `Your order has been handed over to the courier partner. Tracking Number: ${order.trackingNumber || "Available soon"}.`,
      DELIVERED: "Your uniform package has been delivered successfully. Thank you for choosing Uniform Hub!",
    };

    if (customerStatusMessages[newStatus]) {
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: `Order Update: ${newStatus.replace(/_/g, " ")}`,
          message: customerStatusMessages[newStatus],
          type: "ORDER",
          linkUrl: `/orders/${order.id}/track`,
        },
      });
    }

    return { order: updatedOrder };
  });
}

/**
 * Get full assignment & production status history for an order.
 */
export async function getOrderAssignmentHistory(orderId: string) {
  const [assignments, assignmentHistories, productionHistory] = await Promise.all([
    prisma.orderAssignment.findMany({
      where: { orderId },
      include: {
        tailor: {
          select: {
            id: true,
            tailorName: true,
            shopName: true,
            phone: true,
            city: true,
            specializations: true,
          },
        },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assignmentHistory.findMany({
      where: { orderId },
      include: {
        changedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productionStatusHistory.findMany({
      where: { orderId },
      include: {
        changedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    assignments,
    assignmentHistories,
    productionHistory,
  };
}

/**
 * Lists eligible tailors for an order, including live workload and capacity metrics.
 */
export async function getEligibleTailorsForOrder(orderId?: string) {
  let productNames: string[] = [];

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (order && order.items) {
      productNames = order.items.map((i) => (i.productName || "").toLowerCase());
    }
  }

  // Retrieve real approved tailor profiles with active user accounts from existing database
  const tailors = await prisma.tailorProfile.findMany({
    where: {
      approvalStatus: {
        in: ["APPROVED", "approved"],
      },
      user: {
        isActive: true,
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
    },
    orderBy: { tailorName: "asc" },
  });

  const results = await Promise.all(
    tailors.map(async (tailor) => {
      // Live active orders count
      const activeCount = await prisma.orderAssignment.count({
        where: {
          tailorId: tailor.id,
          status: { in: ["ASSIGNED", "ACCEPTED"] },
          order: {
            productionStatus: {
              notIn: ["READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
            },
          },
        },
      });

      const maxOrders = tailor.maxActiveOrders || 10;
      const capacityAvailable = Math.max(0, maxOrders - activeCount);
      const isAvailable = tailor.isAvailable ?? true;
      const isEligible =
        (tailor.user?.isActive ?? true) &&
        (tailor.approvalStatus?.toUpperCase() === "APPROVED") &&
        isAvailable &&
        capacityAvailable > 0;

      // Specialization match scoring
      let specializationMatch = false;
      const specString = tailor.specializations || tailor.skills || "";
      if (specString && productNames.length > 0) {
        const specs = specString.toLowerCase();
        specializationMatch = productNames.some((name) => {
          return (
            (specs.includes("shirt") && name.includes("shirt")) ||
            (specs.includes("trouser") && (name.includes("trouser") || name.includes("pant"))) ||
            (specs.includes("blazer") && (name.includes("blazer") || name.includes("coat"))) ||
            (specs.includes("skirt") && name.includes("skirt")) ||
            (specs.includes("uniform") && name.includes("uniform"))
          );
        });
      }

      return {
        id: tailor.id,
        tailorId: tailor.id,
        userId: tailor.userId,
        name: tailor.tailorName,
        shopName: tailor.shopName,
        email: tailor.user.email,
        phone: tailor.phone || tailor.user.phone || "Not Provided",
        city: tailor.city,
        state: tailor.state,
        skills: tailor.skills || "Custom Stitching & Alterations",
        specializations: tailor.specializations || tailor.skills || "School Uniforms & Custom Stitching",
        specialization: tailor.specializations || tailor.skills || "School Uniforms & Custom Stitching",
        serviceArea: tailor.serviceArea,
        approvalStatus: tailor.approvalStatus,
        accountStatus: tailor.user.isActive ? "ACTIVE" : "INACTIVE",
        availabilityStatus: isAvailable ? "AVAILABLE" : "UNAVAILABLE",
        isAvailable,
        isActive: tailor.user.isActive,
        maxActiveOrders: maxOrders,
        activeOrderCount: activeCount,
        capacityAvailable,
        isEligible,
        specializationMatch,
        estimatedWorkload: `${activeCount}/${maxOrders} (${Math.round(
          (activeCount / Math.max(1, maxOrders)) * 100
        )}%)`,
      };
    })
  );

  return results;
}
