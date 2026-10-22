import { Router } from "express";
import {
  getMyOrders,
  getOrderById,
  trackOrder,
  cancelOrder,
  requestReturn,
} from "./orders.controller.js";
import { authenticate, optionalAuthenticate } from "../../middleware/auth.js";

const router = Router();

// Public / flexible tracking
router.get("/track/:orderIdentifier", trackOrder);

// Authenticated customer/admin order endpoints
router.get("/", authenticate, getMyOrders);
router.get("/:id", optionalAuthenticate, getOrderById);
router.post("/:id/cancel", authenticate, cancelOrder);
router.post("/:id/return", authenticate, requestReturn);

export default router;
