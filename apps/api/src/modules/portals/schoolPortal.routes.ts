import { Router } from "express";
import { getSchoolDashboard, submitUniformDesign } from "./schoolPortal.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";

const router = Router();

router.use(authenticate, requireRole("SCHOOL_ADMIN", "ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", getSchoolDashboard);
router.post("/designs", submitUniformDesign);

export default router;
