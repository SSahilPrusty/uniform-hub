// @ts-nocheck
import { Router } from "express";
import { register, login, getMe, getAddresses, createAddress, deleteAddress } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { RegisterSchema, LoginSchema, AddressSchema } from "@uniform-hub/shared";

const router = Router();

router.post("/register", validateBody(RegisterSchema), register);
router.post("/login", validateBody(LoginSchema), login);
router.get("/me", authenticate, getMe);
router.get("/addresses", authenticate, getAddresses);
router.post("/addresses", authenticate, validateBody(AddressSchema), createAddress);
router.delete("/addresses/:id", authenticate, deleteAddress);

export default router;
