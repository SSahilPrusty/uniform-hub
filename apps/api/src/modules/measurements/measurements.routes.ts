// @ts-nocheck
import { Router } from "express";
import { getMyMeasurements, createMeasurement, deleteMeasurement } from "./measurements.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { CustomMeasurementSchema } from "@uniform-hub/shared";

const router = Router();

router.use(authenticate);

router.get("/", getMyMeasurements);
router.post("/", validateBody(CustomMeasurementSchema), createMeasurement);
router.delete("/:id", deleteMeasurement);

export default router;
