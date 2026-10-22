import { Router } from "express";
import {
  getFranchiseDashboard,
  getFranchiseProducts,
  createFranchiseProduct,
  updateVariantStock,
  updateFranchiseOrderStatus,
} from "./franchisePortal.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";

const router = Router();

router.use(authenticate, requireRole("FRANCHISE_ADMIN", "ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", getFranchiseDashboard);
router.get("/products", getFranchiseProducts);
router.post("/products", createFranchiseProduct);
router.put("/variants/:variantId", updateVariantStock);
router.put("/orders/:orderId/status", updateFranchiseOrderStatus);

export default router;
