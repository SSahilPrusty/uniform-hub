import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

/**
 * Step 3: Tailor completes stitching/alteration work.
 * Status -> COMPLETED_BY_TAILOR. Transferred to Operational Admin dispatch queue.
 */
export async function tailorCompleteOrder(params: {
  orderId: string;
  tailorUserId: string;
  completionNotes?: string | null;
}) {
  const { orderId, tailorUserId, completionNotes } = params;

  return await prisma.$transaction(async (tx) => {
    const tailor = await tx.tailorProfile.findUnique({
      where: { userId: tailorUserId },
    });

    if (!tailor) {
      throw new Error("Tailor profile not found.");
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        assignments: {
          where: { tailorId: tailor.id, status: { in: ["ASSIGNED", "ACCEPTED"] } },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.assignments.length === 0) {
      throw new Error("Order is not currently actively assigned to your tailor account.");
    }

    const assignment = order.assignments[0];
    const completionDate = new Date();

    // 1. Mark OrderAssignment as COMPLETED
    await tx.orderAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "COMPLETED",
        completedAt: completionDate,
        notes: completionNotes || assignment.notes,
      },
    });

    // 2. Decrement tailor active count
    const activeCount = await tx.orderAssignment.count({
      where: {
        tailorId: tailor.id,
        status: { in: ["ASSIGNED", "ACCEPTED"] },
        order: {
          productionStatus: {
            notIn: ["COMPLETED_BY_TAILOR", "READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
          },
        },
      },
    });

    await tx.tailorProfile.update({
      where: { id: tailor.id },
      data: { activeOrderCount: activeCount },
    });

    // 3. Update Order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        productionStatus: "COMPLETED_BY_TAILOR",
        tailorCompletedAt: completionDate,
        tailorCompletionNotes: completionNotes || null,
        correctionReason: null, // Clear any previous correction notice
      },
      include: { items: true },
    });

    // 4. Update tailoring jobs if any
    await tx.tailoringJob.updateMany({
      where: { orderId, tailorId: tailor.id },
      data: {
        status: "COMPLETED",
        completedDate: completionDate,
        tailorNotes: completionNotes || undefined,
      },
    });

    // 5. Record production history
    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "COMPLETED_BY_TAILOR",
        changedById: tailorUserId,
        notes: completionNotes
          ? `Completed by tailor ${tailor.tailorName}: ${completionNotes}`
          : `Stitching & fitting completed by tailor ${tailor.tailorName}. Awaiting Operational Admin verification.`,
      },
    });

    // 6. Notify Operational Admins
    const admins = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          title: "Order Completed by Tailor",
          message: `Order #${order.orderNumber} has been completed by ${tailor.tailorName} (${tailor.shopName}) and is waiting in the Ready for Dispatch queue for verification.`,
          type: "APPROVAL",
          linkUrl: `/admin?tab=dispatch-management&subtab=ready-for-dispatch&orderId=${order.id}`,
        },
      });
    }

    // 7. Notify Customer
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Uniform Tailoring Completed",
        message: `Your uniform order #${order.orderNumber} has been tailored and passed to our operations team for quality inspection and dispatch preparation.`,
        type: "ORDER",
        linkUrl: `/orders/${order.id}/track`,
      },
    });

    return updatedOrder;
  });
}

/**
 * Step 4A: Operational Admin verifies the completed order.
 * Status -> AWAITING_FRANCHISE_ASSIGNMENT.
 */
export async function adminVerifyCompletedOrder(params: {
  orderId: string;
  adminUserId: string;
  notes?: string | null;
}) {
  const { orderId, adminUserId, notes } = params;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    const permittedStatuses = ["COMPLETED_BY_TAILOR", "QUALITY_CHECK", "READY_FOR_DISPATCH"];
    if (!permittedStatuses.includes(order.productionStatus)) {
      throw new Error(
        `Order must be completed by tailor before operational verification. Current status: ${order.productionStatus}`
      );
    }

    const verifyDate = new Date();

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        isVerifiedByAdmin: true,
        verifiedAt: verifyDate,
        verifiedById: adminUserId,
        productionStatus: "AWAITING_FRANCHISE_ASSIGNMENT",
        correctionReason: null,
      },
    });

    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "AWAITING_FRANCHISE_ASSIGNMENT",
        changedById: adminUserId,
        notes: notes || "Operational Admin verified completed stitching and sizing. Placed in franchise assignment queue.",
      },
    });

    // Notify Customer
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Order Quality Verified",
        message: `Your order #${order.orderNumber} has passed operational quality inspection and is now being assigned to our fulfillment franchise for dispatch.`,
        type: "ORDER",
        linkUrl: `/orders/${order.id}/track`,
      },
    });

    return updatedOrder;
  });
}

/**
 * Step 4B: Operational Admin returns completed order to tailor for correction.
 * Status -> RETURNED_FOR_CORRECTION.
 */
export async function adminReturnForCorrection(params: {
  orderId: string;
  adminUserId: string;
  reason: string;
}) {
  const { orderId, adminUserId, reason } = params;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        assignments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { tailor: true },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    const lastAssignment = order.assignments[0];
    if (!lastAssignment) {
      throw new Error("No tailor assignment record found for this order.");
    }

    // 1. Update Order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        productionStatus: "RETURNED_FOR_CORRECTION",
        isVerifiedByAdmin: false,
        correctionReason: reason,
      },
    });

    // 2. Reactivate assignment status so it reappears in active queue
    await tx.orderAssignment.update({
      where: { id: lastAssignment.id },
      data: {
        status: "ACCEPTED",
        notes: `Returned for correction: ${reason}`,
      },
    });

    // 3. Recalculate tailor active workload
    const activeCount = await tx.orderAssignment.count({
      where: {
        tailorId: lastAssignment.tailorId,
        status: { in: ["ASSIGNED", "ACCEPTED"] },
        order: {
          productionStatus: {
            notIn: ["COMPLETED_BY_TAILOR", "READY_FOR_DISPATCH", "DISPATCHED", "DELIVERED", "CANCELLED"],
          },
        },
      },
    });

    await tx.tailorProfile.update({
      where: { id: lastAssignment.tailorId },
      data: { activeOrderCount: activeCount },
    });

    // 4. Record history
    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "RETURNED_FOR_CORRECTION",
        changedById: adminUserId,
        notes: `Returned to tailor ${lastAssignment.tailor.tailorName} for correction. Reason: ${reason}`,
      },
    });

    // 5. Notify Tailor with mandatory reason
    await tx.notification.create({
      data: {
        userId: lastAssignment.tailor.userId,
        title: "Order Returned for Correction",
        message: `Order #${order.orderNumber} requires correction: "${reason}". Please review customer sizes/instructions and make adjustments.`,
        type: "ALERT",
        linkUrl: `/tailor?orderId=${order.id}`,
      },
    });

    return updatedOrder;
  });
}

/**
 * Lists eligible registered & verified franchises.
 */
export async function getEligibleFranchises() {
  const franchises = await prisma.franchiseProfile.findMany({
    where: {
      isVerified: true,
      user: { isActive: true },
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
      _count: {
        select: {
          orderAssignments: {
            where: { status: { in: ["ASSIGNED", "PACKAGE_PREPARED"] } },
          },
        },
      },
    },
    orderBy: { businessName: "asc" },
  });

  return franchises.map((f) => ({
    id: f.id,
    franchiseId: f.id,
    userId: f.userId,
    businessName: f.businessName,
    ownerName: f.ownerName,
    contactPhone: f.contactPhone || f.user.phone || "Not Provided",
    email: f.user.email,
    address: f.address,
    city: f.city,
    state: f.state,
    gstNumber: f.gstNumber || "Registered",
    serviceArea: f.serviceArea || `${f.city}, ${f.state}`,
    accountStatus: f.user.isActive ? "ACTIVE" : "INACTIVE",
    isVerified: f.isVerified,
    activeAssignedOrdersCount: f._count.orderAssignments,
  }));
}

/**
 * Step 5: Operational Admin assigns the verified order to a Franchise.
 * Status -> ASSIGNED_TO_FRANCHISE.
 */
export async function adminAssignOrderToFranchise(params: {
  orderId: string;
  franchiseId: string;
  adminUserId: string;
  notes?: string | null;
}) {
  const { orderId, franchiseId, adminUserId, notes } = params;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        franchiseAssignments: {
          where: { status: { in: ["ASSIGNED", "PACKAGE_PREPARED"] } },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    const franchise = await tx.franchiseProfile.findUnique({
      where: { id: franchiseId },
      include: { user: true },
    });

    if (!franchise) {
      throw new Error("Franchise not found.");
    }

    if (!franchise.isVerified || !franchise.user.isActive) {
      throw new Error("Cannot assign orders to an unverified or inactive franchise partner.");
    }

    // Cancel prior active franchise assignments if reassigning
    for (const priorAssignment of order.franchiseAssignments) {
      await tx.franchiseOrderAssignment.update({
        where: { id: priorAssignment.id },
        data: {
          status: "CANCELLED",
          notes: "Reassigned to another franchise by Operational Admin.",
        },
      });
    }

    const assignmentTimestamp = new Date();

    // 1. Create FranchiseOrderAssignment
    const assignment = await tx.franchiseOrderAssignment.create({
      data: {
        orderId,
        franchiseId,
        assignedById: adminUserId,
        status: "ASSIGNED",
        notes: notes || "Assigned by Operational Admin for packaging & dispatch fulfillment.",
        assignedAt: assignmentTimestamp,
      },
    });

    // 2. Update Order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        franchiseId,
        franchiseAssignedAt: assignmentTimestamp,
        franchiseAssignedById: adminUserId,
        productionStatus: "ASSIGNED_TO_FRANCHISE",
        isVerifiedByAdmin: true,
      },
      include: {
        items: true,
        franchise: true,
      },
    });

    // 3. Record status history
    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "ASSIGNED_TO_FRANCHISE",
        changedById: adminUserId,
        notes: `Assigned to regional franchise ${franchise.businessName} (${franchise.city}) for express packaging and courier dispatch.`,
      },
    });

    // 4. Notify Franchise
    await tx.notification.create({
      data: {
        userId: franchise.userId,
        title: "New Order Ready for Dispatch",
        message: `Order #${order.orderNumber} has been verified and assigned to your franchise. Please prepare the package and dispatch via courier.`,
        type: "ORDER",
        linkUrl: `/franchise?tab=ready-for-dispatch&orderId=${order.id}`,
      },
    });

    // 5. Notify Customer
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Order Assigned to Dispatch Hub",
        message: `Your uniform package #${order.orderNumber} has arrived at our regional hub (${franchise.businessName}) and is being packed for express courier shipment.`,
        type: "ORDER",
        linkUrl: `/orders/${order.id}/track`,
      },
    });

    return { order: updatedOrder, assignment };
  });
}

/**
 * Step 6: Franchise prepares package.
 * Status -> PACKAGE_PREPARED.
 */
export async function franchisePreparePackage(params: {
  orderId: string;
  franchiseUserId: string;
}) {
  const { orderId, franchiseUserId } = params;

  return await prisma.$transaction(async (tx) => {
    const franchise = await tx.franchiseProfile.findUnique({
      where: { userId: franchiseUserId },
    });

    if (!franchise) {
      throw new Error("Franchise profile not found.");
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.franchiseId !== franchise.id) {
      throw new Error("Access denied: This order is not assigned to your franchise.");
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { productionStatus: "PACKAGE_PREPARED" },
    });

    await tx.franchiseOrderAssignment.updateMany({
      where: { orderId, franchiseId: franchise.id, status: "ASSIGNED" },
      data: { status: "PACKAGE_PREPARED" },
    });

    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "PACKAGE_PREPARED",
        changedById: franchiseUserId,
        notes: `Package assembled and packed by franchise ${franchise.businessName}. Ready for courier pickup.`,
      },
    });

    return updatedOrder;
  });
}

/**
 * Step 7: Franchise dispatches order with Courier, Tracking ID, Dispatch Date, and Tracking URL.
 * Status -> DISPATCHED.
 */
export async function franchiseDispatchOrder(params: {
  orderId: string;
  franchiseUserId: string;
  courierPartner: string;
  trackingNumber: string;
  dispatchDate: string;
  trackingUrl?: string | null;
  shippingNotes?: string | null;
  packageReference?: string | null;
}) {
  const {
    orderId,
    franchiseUserId,
    courierPartner,
    trackingNumber,
    dispatchDate,
    trackingUrl,
    shippingNotes,
    packageReference,
  } = params;

  return await prisma.$transaction(async (tx) => {
    const franchise = await tx.franchiseProfile.findUnique({
      where: { userId: franchiseUserId },
    });

    if (!franchise) {
      throw new Error("Franchise profile not found.");
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.franchiseId !== franchise.id) {
      throw new Error("Access denied: You are not authorized to dispatch orders assigned to another franchise.");
    }

    if (!order.isVerifiedByAdmin) {
      throw new Error("Order has not been verified by Operational Admin. Unverified orders cannot enter dispatch.");
    }

    const parsedDispatchDate = new Date(dispatchDate);

    // 1. Update Order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED",
        productionStatus: "DISPATCHED",
        courierPartner,
        trackingNumber,
        trackingUrl: trackingUrl || null,
        shippingNotes: shippingNotes || null,
        packageReference: packageReference || null,
        dispatchedAt: parsedDispatchDate,
        dispatchedById: franchiseUserId,
      },
      include: { items: true },
    });

    // 2. Update FranchiseOrderAssignment
    await tx.franchiseOrderAssignment.updateMany({
      where: { orderId, franchiseId: franchise.id },
      data: {
        status: "DISPATCHED",
        dispatchedAt: parsedDispatchDate,
      },
    });

    // 3. Create or update Shipment record
    await tx.shipment.create({
      data: {
        orderId,
        courierName: courierPartner,
        trackingNumber,
        status: "IN_TRANSIT",
        shippedAt: parsedDispatchDate,
      },
    });

    // 4. Record production status history
    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "DISPATCHED",
        changedById: franchiseUserId,
        notes: `Dispatched by ${franchise.businessName} via ${courierPartner}. Waybill/Tracking ID: ${trackingNumber}. Dispatch Date: ${parsedDispatchDate.toISOString().slice(0, 10)}.`,
      },
    });

    // 5. Notify Customer
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Your Uniform Order Has Been Dispatched!",
        message: `Package #${order.orderNumber} has been dispatched via ${courierPartner}. Tracking ID: ${trackingNumber}. Click to track live delivery.`,
        type: "ORDER",
        linkUrl: `/orders/${order.id}/track`,
      },
    });

    // 6. Notify Operational Admin
    const admins = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          title: "Order Dispatched by Franchise",
          message: `Order #${order.orderNumber} dispatched by ${franchise.businessName} via ${courierPartner} (#${trackingNumber}).`,
          type: "INFO",
          linkUrl: `/admin?tab=dispatch-management&subtab=dispatched&orderId=${order.id}`,
        },
      });
    }

    return updatedOrder;
  });
}

/**
 * Operational Admin or Courier confirms final delivery.
 * Status -> DELIVERED.
 */
export async function confirmOrderDelivery(params: {
  orderId: string;
  confirmedByUserId: string;
  deliveryNotes?: string | null;
}) {
  const { orderId, confirmedByUserId, deliveryNotes } = params;

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    const deliveryTime = new Date();

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED",
        productionStatus: "DELIVERED",
        deliveredAt: deliveryTime,
        deliveredConfirmedById: confirmedByUserId,
      },
    });

    await tx.shipment.updateMany({
      where: { orderId },
      data: {
        status: "DELIVERED",
        deliveredAt: deliveryTime,
      },
    });

    await tx.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: "DELIVERED",
        changedById: confirmedByUserId,
        notes: deliveryNotes || `Order confirmed delivered on ${deliveryTime.toLocaleDateString()}. Package received by customer.`,
      },
    });

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Order Delivered!",
        message: `Your uniform package #${order.orderNumber} has been delivered. Thank you for choosing Uniform Hub!`,
        type: "ORDER",
        linkUrl: `/orders/${order.id}/track`,
      },
    });

    return updatedOrder;
  });
}
