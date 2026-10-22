// @ts-nocheck
 { Router } from "express";
// @ts-nocheck
 { register, login, getMe, getAddresses, createAddress, deleteAddress } from "./auth.controller.js";
// @ts-nocheck
 { authenticate } from "../../middleware/auth.js";
// @ts-nocheck
 { validateBody } from "../../middleware/validate.js";
// @ts-nocheck
 { RegisterSchema, LoginSchema, AddressSchema } from "@uniform-hub/shared";

const router = Router();

router.post("/register", validateBody(RegisterSchema), register);
router.post("/login", validateBody(LoginSchema), login);
router.get("/me", authenticate, getMe);
router.get("/addresses", authenticate, getAddresses);
router.post("/addresses", authenticate, validateBody(AddressSchema), createAddress);
router.delete("/addresses/:id", authenticate, deleteAddress);

export default router;
