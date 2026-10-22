import { Router } from "express";
import {
  getOrCreateCart,
  addItemToCart,
  updateItemQuantity,
  removeItem,
  applyCoupon,
} from "./cart.controller.js";
import { optionalAuthenticate } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AddToCartSchema, UpdateCartItemSchema } from "@uniform-hub/shared";

const router = Router();

router.use(optionalAuthenticate);

router.get("/", getOrCreateCart);
router.post("/items", validateBody(AddToCartSchema), addItemToCart);
router.put("/items/:itemId", validateBody(UpdateCartItemSchema), updateItemQuantity);
router.delete("/items/:itemId", removeItem);
router.post("/coupon", applyCoupon);

export default router;
