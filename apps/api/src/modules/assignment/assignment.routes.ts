import { Router } from "express";
import {
  getAdminOrders,
  getEligibleTailors,
  assignOrder,
  reassignOrder,
  cancelOrderAssignment,
  getMyAssignedOrders,
  acceptOrder,
  rejectOrder,
  changeProductionStatus,
  getOrderHistory,
  updateOrderPriorityAndDeadline,
  updateTailorSettings,
  getTailorApplications,
  approveTailorApplication,
  rejectTailorApplication,
  toggleTailorStatus,
} from "./assignment.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";

const router = Router();

// Tailor Workbench routes
router.get("/tailor/my-orders", authenticate, requireRole("TAILOR"), getMyAssignedOrders);
router.post("/tailor/:orderId/accept", authenticate, requireRole("TAILOR"), acceptOrder);
router.post("/tailor/:orderId/reject", authenticate, requireRole("TAILOR"), rejectOrder);
router.put("/tailor/:tailorId/availability", authenticate, requireRole("TAILOR", "ADMIN", "SUPER_ADMIN"), updateTailorSettings);

// Production status (Tailor or Admin)
router.put("/orders/:orderId/production-status", authenticate, changeProductionStatus);
router.get("/orders/:orderId/history", authenticate, getOrderHistory);

// Admin Order Assignment routes
router.get("/admin/orders", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), getAdminOrders);
router.get("/admin/eligible-tailors", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), getEligibleTailors);
router.get("/admin/eligible-tailors/:orderId", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), getEligibleTailors);
router.post("/admin/assign", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), assignOrder);
router.post("/admin/reassign", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), reassignOrder);
router.post("/admin/cancel/:orderId", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), cancelOrderAssignment);
router.put("/admin/orders/:orderId/priority", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), updateOrderPriorityAndDeadline);

// Admin Tailor Applications routes
router.get("/admin/tailor-applications", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), getTailorApplications);
router.post("/admin/tailor-applications/:tailorId/approve", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), approveTailorApplication);
router.post("/admin/tailor-applications/:tailorId/reject", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), rejectTailorApplication);
router.put("/admin/tailor-applications/:tailorId/status", authenticate, requireRole("ADMIN", "SUPER_ADMIN"), toggleTailorStatus);

export default router;
