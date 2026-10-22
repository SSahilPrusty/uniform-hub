import { Router } from "express";
import { getTailorDashboard, claimJob, updateJobStatus } from "./tailorPortal.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";

const router = Router();

router.use(authenticate, requireRole("TAILOR", "ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", getTailorDashboard);
router.post("/jobs/:jobId/claim", claimJob);
router.put("/jobs/:jobId/status", updateJobStatus);

export default router;
