import { Router } from "express";
import { getSchools, getSchoolBySlug, requestSchoolCatalog } from "./schools.controller.js";
import { validateBody } from "../../middleware/validate.js";
import { SchoolCatalogRequestSchema } from "@uniform-hub/shared";

const router = Router();

router.get("/", getSchools);
router.get("/:slug", getSchoolBySlug);
router.post("/requests", validateBody(SchoolCatalogRequestSchema), requestSchoolCatalog);

export default router;
