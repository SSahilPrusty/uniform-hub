// @ts-nocheck
 { Router } from "express";
// @ts-nocheck
 { getSchools, getSchoolBySlug, requestSchoolCatalog } from "./schools.controller.js";
// @ts-nocheck
 { validateBody } from "../../middleware/validate.js";
// @ts-nocheck
 { SchoolCatalogRequestSchema } from "@uniform-hub/shared";

const router = Router();

router.get("/", getSchools);
router.get("/:slug", getSchoolBySlug);
router.post("/requests", validateBody(SchoolCatalogRequestSchema), requestSchoolCatalog);

export default router;
