import { Router } from "express";
import {
  getAdminDashboard,
  listAdminCustomers,
  toggleUserStatus,
  listAdminSchools,
  verifySchool,
  listApprovals,
  approveProduct,
  approveCatalogRequest,
  listAdminOrders,
  exportReportCsv,
} from "./admin.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", getAdminDashboard);
router.get("/customers", listAdminCustomers);
router.put("/customers/:userId/status", toggleUserStatus);
router.get("/schools", listAdminSchools);
router.put("/schools/:schoolId/verify", verifySchool);
router.get("/approvals", listApprovals);
router.put("/approvals/products/:requestId", approveProduct);
router.put("/approvals/catalogs/:requestId", approveCatalogRequest);
router.get("/orders", listAdminOrders);
router.get("/reports/export", exportReportCsv);

export default router;
