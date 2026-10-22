// @ts-nocheck
 { Router } from "express";
// @ts-nocheck
 { getMyMeasurements, createMeasurement, deleteMeasurement } from "./measurements.controller.js";
// @ts-nocheck
 { authenticate } from "../../middleware/auth.js";
// @ts-nocheck
 { validateBody } from "../../middleware/validate.js";
// @ts-nocheck
 { CustomMeasurementSchema } from "@uniform-hub/shared";

const router = Router();

router.use(authenticate);

router.get("/", getMyMeasurements);
router.post("/", validateBody(CustomMeasurementSchema), createMeasurement);
router.delete("/:id", deleteMeasurement);

export default router;
