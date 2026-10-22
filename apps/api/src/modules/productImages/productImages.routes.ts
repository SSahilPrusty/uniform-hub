import { Router } from "express";
import {
  uploadProductImage,
  listProductImages,
  updateProductImage,
  deleteProductImage,
  reorderProductImages,
} from "./productImages.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/role.js";
import { upload } from "../../middleware/upload.js";

const router = Router();

// Restricted to ADMIN and SUPER_ADMIN
router.use(authenticate, requireRole("SUPER_ADMIN", "ADMIN"));

router.get("/", listProductImages);
router.post("/upload", upload.single("image"), uploadProductImage);
router.put("/reorder", reorderProductImages);
router.put("/:id", updateProductImage);
router.delete("/:id", deleteProductImage);

export default router;
