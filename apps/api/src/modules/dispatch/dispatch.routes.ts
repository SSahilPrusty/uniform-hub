import { Router } from "express";
import {
  completeOrderByTailor,
  verifyOrderByAdmin,
  returnForCorrectionByAdmin,
  getEligibleFranchisesList,
  assignOrderToFranchiseByAdmin,
  prepareFranchisePackage,
  dispatchOrderByFranchise,
  updateTrackingDetailsByFranchise,
  confirmOrderDeliveryByAdmin,
  getAdminDispatchOrdersList,
  getFranchiseOrdersList,
  getDetailedOrderTracking,
} from "./dispatch.controller.js";
import { authenticate, optionalAuthenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";

const router = Router();

// ==========================================
// Step 3: Tailor Completion
// ==========================================
router.post(
  "/tailor/complete-order/:orderId",
  authenticate,
  requireRole("TAILOR", "ADMIN", "SUPER_ADMIN"),
  completeOrderByTailor
);

// ==========================================
// Step 4 & 5: Operational Admin Verification & Franchise Assignment
// ==========================================
router.get(
  "/admin/orders",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  getAdminDispatchOrdersList
);

router.get(
  "/admin/eligible-franchises",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  getEligibleFranchisesList
);

router.post(
  "/admin/verify-order/:orderId",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  verifyOrderByAdmin
);

router.post(
  "/admin/return-correction/:orderId",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  returnForCorrectionByAdmin
);

router.post(
  "/admin/assign-franchise",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  assignOrderToFranchiseByAdmin
);

router.post(
  "/admin/confirm-delivery/:orderId",
  authenticate,
  requireRole("ADMIN", "SUPER_ADMIN"),
  confirmOrderDeliveryByAdmin
);

// ==========================================
// Step 6: Franchise Portal Dispatch Processing
// ==========================================
router.get(
  "/franchise/orders",
  authenticate,
  requireRole("FRANCHISE_ADMIN", "ADMIN", "SUPER_ADMIN"),
  getFranchiseOrdersList
);

router.post(
  "/franchise/prepare-package/:orderId",
  authenticate,
  requireRole("FRANCHISE_ADMIN", "ADMIN", "SUPER_ADMIN"),
  prepareFranchisePackage
);

router.post(
  "/franchise/dispatch-order/:orderId",
  authenticate,
  requireRole("FRANCHISE_ADMIN", "ADMIN", "SUPER_ADMIN"),
  dispatchOrderByFranchise
);

router.put(
  "/franchise/update-tracking/:orderId",
  authenticate,
  requireRole("FRANCHISE_ADMIN", "ADMIN", "SUPER_ADMIN"),
  updateTrackingDetailsByFranchise
);

// ==========================================
// Step 7: Customer & Live Order Tracking (9 Stages)
// ==========================================
router.get(
  "/track/:identifier",
  optionalAuthenticate,
  getDetailedOrderTracking
);

export default router;
