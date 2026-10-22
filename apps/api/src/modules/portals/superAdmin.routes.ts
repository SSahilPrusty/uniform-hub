import { Router } from "express";
import {
  getPlatformOverview,
  listAllUsers,
  updateUserRole,
  getFinancialSettings,
  updatePlatformSetting,
  getAuditLogs,
} from "./superAdmin.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";

const router = Router();

router.use(authenticate, requireRole("SUPER_ADMIN"));

router.get("/overview", getPlatformOverview);
router.get("/users", listAllUsers);
router.put("/users/:userId/role", updateUserRole);
router.get("/financial-settings", getFinancialSettings);
router.put("/settings/:key", updatePlatformSetting);
router.get("/audit-logs", getAuditLogs);

export default router;
