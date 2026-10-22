import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";
import {
  tailorCompleteOrder,
  adminVerifyCompletedOrder,
  adminReturnForCorrection,
  getEligibleFranchises,
  adminAssignOrderToFranchise,
  franchisePreparePackage,
  franchiseDispatchOrder,
  confirmOrderDelivery,
} from "./dispatch.service.js";
import {
  TailorCompleteOrderSchema,
  VerifyCompletedOrderSchema,
  ReturnForCorrectionSchema,
  AssignFranchiseSchema,
  FranchiseDispatchSchema,
  UpdateTrackingInfoSchema,
  ConfirmDeliverySchema,
} from "@uniform-hub/shared";

/**
 * Step 3: Tailor completes order.
 */
export const completeOrderByTailor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = TailorCompleteOrderSchema.safeParse(req.body);

    const completionNotes = validation.success ? validation.data.completionNotes : req.body.completionNotes;

    const updated = await tailorCompleteOrder({
      orderId,
      tailorUserId: req.user!.id,
      completionNotes,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "TAILOR_ORDER_COMPLETED",
      entityType: "Order",
      entityId: orderId,
      details: { orderNumber: updated.orderNumber },
    });

    res.json({
      success: true,
      message: "Order marked as completed by tailor. Transferred to Operational Admin dispatch queue.",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Step 4: Admin verifies completed order.
 */
export const verifyOrderByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = VerifyCompletedOrderSchema.safeParse(req.body);
    const notes = validation.success ? validation.data.notes : req.body.notes;

    const updated = await adminVerifyCompletedOrder({
      orderId,
      adminUserId: req.user!.id,
      notes,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "ADMIN_ORDER_VERIFIED",
      entityType: "Order",
      entityId: orderId,
      details: { orderNumber: updated.orderNumber },
    });

    res.json({
      success: true,
      message: "Order successfully verified by Operational Admin. Ready for franchise assignment.",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Step 4: Admin returns completed order for correction.
 */
export const returnForCorrectionByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = ReturnForCorrectionSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { reason } = validation.data;

    const updated = await adminReturnForCorrection({
      orderId,
      adminUserId: req.user!.id,
      reason,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "ADMIN_RETURNED_FOR_CORRECTION",
      entityType: "Order",
      entityId: orderId,
      details: { reason },
    });

    res.json({
      success: true,
      message: "Order returned to tailor for correction.",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Step 5: Admin retrieves eligible registered franchises.
 */
export const getEligibleFranchisesList = async (req: Request, res: Response): Promise<void> => {
  try {
    const franchises = await getEligibleFranchises();
    res.json({ success: true, data: franchises });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Step 5: Admin assigns order to a franchise.
 */
export const assignOrderToFranchiseByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = AssignFranchiseSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const { orderId, franchiseId, notes } = validation.data;

    const result = await adminAssignOrderToFranchise({
      orderId,
      franchiseId,
      adminUserId: req.user!.id,
      notes,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "ADMIN_ASSIGNED_TO_FRANCHISE",
      entityType: "Order",
      entityId: orderId,
      details: { franchiseId },
    });

    res.json({
      success: true,
      message: "Order successfully assigned to franchise partner.",
      data: result.order,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Step 6: Franchise prepares package.
 */
export const prepareFranchisePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const updated = await franchisePreparePackage({
      orderId,
      franchiseUserId: req.user!.id,
    });

    res.json({
      success: true,
      message: "Package marked as prepared.",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Step 7: Franchise dispatches order with Tracking information.
 */
export const dispatchOrderByFranchise = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = FranchiseDispatchSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const {
      courierPartner,
      trackingNumber,
      dispatchDate,
      trackingUrl,
      shippingNotes,
      packageReference,
    } = validation.data;

    const updated = await franchiseDispatchOrder({
      orderId,
      franchiseUserId: req.user!.id,
      courierPartner,
      trackingNumber,
      dispatchDate,
      trackingUrl,
      shippingNotes,
      packageReference,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "FRANCHISE_ORDER_DISPATCHED",
      entityType: "Order",
      entityId: orderId,
      details: { courierPartner, trackingNumber, dispatchDate },
    });

    res.json({
      success: true,
      message: "Order successfully dispatched! Tracking information recorded and customer notified.",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Franchise updates tracking details with audit.
 */
export const updateTrackingDetailsByFranchise = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = UpdateTrackingInfoSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    const franchise = await prisma.franchiseProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!franchise && !["ADMIN", "SUPER_ADMIN"].includes(req.user!.role)) {
      res.status(403).json({ success: false, error: "Access denied." });
      return;
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ success: false, error: "Order not found." });
      return;
    }

    if (franchise && order.franchiseId !== franchise.id) {
      res.status(403).json({ success: false, error: "Unauthorized for this order." });
      return;
    }

    const { courierPartner, trackingNumber, trackingUrl, shippingNotes, updateReason } = validation.data;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        courierPartner,
        trackingNumber,
        trackingUrl: trackingUrl || null,
        shippingNotes: shippingNotes || order.shippingNotes,
      },
    });

    await prisma.productionStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.productionStatus,
        newStatus: order.productionStatus,
        changedById: req.user!.id,
        notes: `Tracking updated: ${courierPartner} (#${trackingNumber}). Reason: ${updateReason}`,
      },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "TRACKING_INFO_UPDATED",
      entityType: "Order",
      entityId: orderId,
      details: { previousTracking: order.trackingNumber, newTracking: trackingNumber, reason: updateReason },
    });

    res.json({
      success: true,
      message: "Tracking information updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Admin confirms delivery.
 */
export const confirmOrderDeliveryByAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const validation = ConfirmDeliverySchema.safeParse(req.body);
    const notes = validation.success ? validation.data.deliveryNotes : req.body.deliveryNotes;

    const updated = await confirmOrderDelivery({
      orderId,
      confirmedByUserId: req.user!.id,
      deliveryNotes: notes,
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "ORDER_DELIVERY_CONFIRMED",
      entityType: "Order",
      entityId: orderId,
      details: { deliveredAt: updated.deliveredAt },
    });

    res.json({
      success: true,
      message: "Delivery confirmed successfully.",
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Operational Admin: Dispatch Monitoring Dashboard API.
 * 6 Queues: READY_FOR_DISPATCH, AWAITING_FRANCHISE_ASSIGNMENT, ASSIGNED_TO_FRANCHISE, DISPATCHED, DELIVERED, ISSUES.
 */
export const getAdminDispatchOrdersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { queue = "ALL", search, page = "1", limit = "12" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    switch (queue) {
      case "READY_FOR_DISPATCH":
        where.productionStatus = "COMPLETED_BY_TAILOR";
        break;
      case "AWAITING_FRANCHISE_ASSIGNMENT":
        where.OR = [
          { productionStatus: "AWAITING_FRANCHISE_ASSIGNMENT" },
          { isVerifiedByAdmin: true, franchiseId: null, productionStatus: { notIn: ["DISPATCHED", "DELIVERED", "CANCELLED"] } },
        ];
        break;
      case "ASSIGNED_TO_FRANCHISE":
        where.productionStatus = { in: ["ASSIGNED_TO_FRANCHISE", "PACKAGE_PREPARED"] };
        break;
      case "DISPATCHED":
        where.productionStatus = "DISPATCHED";
        break;
      case "DELIVERED":
        where.productionStatus = "DELIVERED";
        break;
      case "ISSUES":
        where.OR = [
          { productionStatus: "RETURNED_FOR_CORRECTION" },
          {
            expectedCompletionDate: { lt: new Date() },
            productionStatus: { notIn: ["DISPATCHED", "DELIVERED", "CANCELLED"] },
          },
        ];
        break;
      default:
        // Exclude pending/initial orders; show orders in the dispatch workflow
        where.productionStatus = {
          in: [
            "COMPLETED_BY_TAILOR",
            "RETURNED_FOR_CORRECTION",
            "AWAITING_FRANCHISE_ASSIGNMENT",
            "ASSIGNED_TO_FRANCHISE",
            "PACKAGE_PREPARED",
            "READY_FOR_DISPATCH",
            "DISPATCHED",
            "DELIVERED",
          ],
        };
        break;
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { id: { contains: q } },
            { orderNumber: { contains: q } },
            { customerName: { contains: q } },
            { trackingNumber: { contains: q } },
            { courierPartner: { contains: q } },
          ],
        },
      ];
    }

    const [orders, totalCount, statsData] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          franchise: {
            select: { id: true, businessName: true, ownerName: true, contactPhone: true, city: true },
          },
          assignments: {
            where: { status: { in: ["ASSIGNED", "ACCEPTED", "COMPLETED"] } },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              tailor: {
                select: { id: true, tailorName: true, shopName: true, phone: true, city: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.order.count({ where }),
      // Global metrics for the 6 tabs
      Promise.all([
        prisma.order.count({ where: { productionStatus: "COMPLETED_BY_TAILOR" } }),
        prisma.order.count({
          where: {
            OR: [
              { productionStatus: "AWAITING_FRANCHISE_ASSIGNMENT" },
              { isVerifiedByAdmin: true, franchiseId: null, productionStatus: { notIn: ["DISPATCHED", "DELIVERED", "CANCELLED"] } },
            ],
          },
        }),
        prisma.order.count({
          where: { productionStatus: { in: ["ASSIGNED_TO_FRANCHISE", "PACKAGE_PREPARED"] } },
        }),
        prisma.order.count({ where: { productionStatus: "DISPATCHED" } }),
        prisma.order.count({ where: { productionStatus: "DELIVERED" } }),
        prisma.order.count({
          where: {
            OR: [
              { productionStatus: "RETURNED_FOR_CORRECTION" },
              {
                expectedCompletionDate: { lt: new Date() },
                productionStatus: { notIn: ["DISPATCHED", "DELIVERED", "CANCELLED"] },
              },
            ],
          },
        }),
      ]),
    ]);

    const [
      readyForDispatchCount,
      awaitingFranchiseCount,
      assignedToFranchiseCount,
      dispatchedCount,
      deliveredCount,
      issuesCount,
    ] = statsData;

    res.json({
      success: true,
      data: {
        summary: {
          readyForDispatchCount,
          awaitingFranchiseCount,
          assignedToFranchiseCount,
          dispatchedCount,
          deliveredCount,
          issuesCount,
          total:
            readyForDispatchCount +
            awaitingFranchiseCount +
            assignedToFranchiseCount +
            dispatchedCount +
            deliveredCount +
            issuesCount,
        },
        orders: orders.map((o) => {
          let parsedAddress: any = null;
          try {
            parsedAddress = JSON.parse(o.shippingAddressJson);
          } catch {}

          return {
            ...o,
            deliveryAddress: parsedAddress,
            assignedTailor: o.assignments[0]?.tailor || null,
            assignedFranchise: o.franchise || null,
          };
        }),
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
 * Franchise Portal: Get orders assigned to the logged-in franchise.
 * Strictly isolates orders to caller's franchise.
 */
export const getFranchiseOrdersList = async (req: Request, res: Response): Promise<void> => {
  try {
    const franchise = await prisma.franchiseProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!franchise) {
      res.status(403).json({ success: false, error: "Franchise profile not found." });
      return;
    }

    const rawTab = String(req.query.subtab || req.query.tab || "ready-for-dispatch").toLowerCase();
    const isDispatchedTab = ["dispatched", "delivered"].includes(rawTab);
    const search = req.query.search as string | undefined;

    const where: any = {
      franchiseId: franchise.id,
    };

    if (isDispatchedTab) {
      where.productionStatus = { in: ["DISPATCHED", "DELIVERED"] };
    } else {
      where.productionStatus = { in: ["ASSIGNED_TO_FRANCHISE", "PACKAGE_PREPARED"] };
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q } },
        { orderNumber: { contains: q } },
        { customerName: { contains: q } },
        { trackingNumber: { contains: q } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        franchiseAssignments: {
          where: { franchiseId: franchise.id },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Counts for tabs
    const [readyCount, dispatchedCount, deliveredCount] = await Promise.all([
      prisma.order.count({
        where: {
          franchiseId: franchise.id,
          productionStatus: { in: ["ASSIGNED_TO_FRANCHISE", "PACKAGE_PREPARED"] },
        },
      }),
      prisma.order.count({
        where: {
          franchiseId: franchise.id,
          productionStatus: "DISPATCHED",
        },
      }),
      prisma.order.count({
        where: {
          franchiseId: franchise.id,
          productionStatus: "DELIVERED",
        },
      }),
    ]);

    const formatted = orders.map((o) => {
      let deliveryAddress: any = null;
      try {
        deliveryAddress = JSON.parse(o.shippingAddressJson);
      } catch {}

      return {
        id: o.id,
        orderId: o.id,
        orderNumber: o.orderNumber,
        orderDate: o.createdAt,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail,
        deliveryAddress, // Complete snapshot address
        shippingAddress: deliveryAddress,
        items: o.items,
        totalItemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        isVerifiedByAdmin: o.isVerifiedByAdmin,
        verifiedAt: o.verifiedAt,
        productionStatus: o.productionStatus,
        franchiseAssignedAt: o.franchiseAssignedAt || o.franchiseAssignments[0]?.assignedAt,
        courierPartner: o.courierPartner,
        trackingNumber: o.trackingNumber,
        trackingUrl: o.trackingUrl,
        dispatchedAt: o.dispatchedAt,
        shippingNotes: o.shippingNotes,
        packageReference: o.packageReference,
      };
    });

    res.json({
      success: true,
      data: {
        franchise,
        metrics: {
          readyForDispatch: readyCount,
          dispatchedCount,
          deliveredCount,
          total: readyCount + dispatchedCount + deliveredCount,
        },
        orders: formatted,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Customer / Public: Detailed Order Tracking with complete 9-stage timeline & real Tracking ID.
 */
export const getDetailedOrderTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }, { trackingNumber: identifier }],
      },
      include: {
        items: true,
        productionHistory: {
          orderBy: { createdAt: "asc" },
        },
        franchise: {
          select: { businessName: true, city: true },
        },
        assignments: {
          where: { status: "COMPLETED" },
          take: 1,
          include: {
            tailor: {
              select: { tailorName: true, shopName: true },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: "No order found matching this reference." });
      return;
    }

    // Role check if user logged in
    if (req.user && req.user.role === "CUSTOMER" && order.userId !== req.user.id) {
      res.status(403).json({ success: false, error: "Access denied." });
      return;
    }

    let parsedAddress: any = null;
    try {
      parsedAddress = JSON.parse(order.shippingAddressJson);
    } catch {}

    // Find milestone timestamps from productionHistory
    const getMilestoneTimestamp = (statuses: string[]) => {
      const match = order.productionHistory.find((h) => statuses.includes(h.newStatus));
      return match ? match.createdAt : null;
    };

    // Calculate completion flags according to standard workflow pipeline
    const pipelineSequence = [
      "PENDING",
      "ASSIGNED",
      "IN_PROGRESS",
      "COMPLETED_BY_TAILOR",
      "AWAITING_FRANCHISE_ASSIGNMENT",
      "ASSIGNED_TO_FRANCHISE",
      "PACKAGE_PREPARED",
      "DISPATCHED",
      "DELIVERED",
    ];

    const currentStageIndex = pipelineSequence.indexOf(order.productionStatus);

    const timeline = [
      {
        stage: 1,
        key: "ORDER_PLACED",
        label: "Order Placed",
        desc: "Order placed successfully and confirmed in system.",
        timestamp: order.createdAt,
        isCompleted: true,
      },
      {
        stage: 2,
        key: "TAILOR_ASSIGNED",
        label: "Tailor Assigned",
        desc: "Assigned to approved master tailoring partner for precision stitching.",
        timestamp: getMilestoneTimestamp(["ASSIGNED", "ACCEPTED"]),
        isCompleted: currentStageIndex >= 1,
      },
      {
        stage: 3,
        key: "IN_PRODUCTION",
        label: "In Production",
        desc: "Fabric pattern cutting, stitching, and custom sizing in progress.",
        timestamp: getMilestoneTimestamp(["IN_PROGRESS", "QUALITY_CHECK"]),
        isCompleted: currentStageIndex >= 2,
      },
      {
        stage: 4,
        key: "COMPLETED_BY_TAILOR",
        label: "Completed by Tailor",
        desc: "Tailor finished custom stitching. Transferred to operations quality inspection.",
        timestamp: order.tailorCompletedAt || getMilestoneTimestamp(["COMPLETED_BY_TAILOR"]),
        isCompleted: currentStageIndex >= 3,
      },
      {
        stage: 5,
        key: "QUALITY_CHECK",
        label: "Operational Quality Verification",
        desc: "Inspected and verified by Operational Admin for size accuracy and quality standards.",
        timestamp: order.verifiedAt || getMilestoneTimestamp(["AWAITING_FRANCHISE_ASSIGNMENT"]),
        isCompleted: currentStageIndex >= 4,
      },
      {
        stage: 6,
        key: "ASSIGNED_TO_FRANCHISE",
        label: "Assigned to Regional Hub",
        desc: order.franchise
          ? `Allocated to regional hub (${order.franchise.businessName}) for express packaging.`
          : "Allocated to regional fulfillment hub for packaging.",
        timestamp: order.franchiseAssignedAt || getMilestoneTimestamp(["ASSIGNED_TO_FRANCHISE"]),
        isCompleted: currentStageIndex >= 5,
      },
      {
        stage: 7,
        key: "READY_FOR_DISPATCH",
        label: "Package Prepared",
        desc: "Uniform package sealed, labeled, and staged for courier handover.",
        timestamp: getMilestoneTimestamp(["PACKAGE_PREPARED", "READY_FOR_DISPATCH"]),
        isCompleted: currentStageIndex >= 6,
      },
      {
        stage: 8,
        key: "DISPATCHED",
        label: "Dispatched",
        desc: order.courierPartner
          ? `Handed over to ${order.courierPartner}. Waybill / Tracking ID: ${order.trackingNumber || "Pending"}.`
          : "Dispatched via logistics partner.",
        timestamp: order.dispatchedAt || getMilestoneTimestamp(["DISPATCHED"]),
        isCompleted: currentStageIndex >= 7 || !!order.trackingNumber,
      },
      {
        stage: 9,
        key: "DELIVERED",
        label: "Delivered",
        desc: "Uniform package delivered to customer.",
        timestamp: order.deliveredAt || getMilestoneTimestamp(["DELIVERED"]),
        isCompleted: order.productionStatus === "DELIVERED" || order.status === "DELIVERED",
      },
    ];

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: order.totalAmount,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          status: order.status,
          productionStatus: order.productionStatus,
          courierPartner: order.courierPartner,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          dispatchedAt: order.dispatchedAt,
          deliveredAt: order.deliveredAt,
          items: order.items,
          shippingAddress: parsedAddress,
          isVerifiedByAdmin: order.isVerifiedByAdmin,
        },
        trackingInfo: {
          courierPartner: order.courierPartner,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          dispatchedAt: order.dispatchedAt,
          deliveredAt: order.deliveredAt,
          hasTracking: Boolean(order.trackingNumber),
        },
        timeline,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
