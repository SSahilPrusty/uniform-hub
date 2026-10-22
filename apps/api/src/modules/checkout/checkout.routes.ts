// @ts-nocheck
import { Router } from "express";
import { processCheckout, verifyPayment } from "./checkout.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { CheckoutSchema } from "@uniform-hub/shared";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(CheckoutSchema), processCheckout);
router.post("/verify-payment", verifyPayment);

export default router;
