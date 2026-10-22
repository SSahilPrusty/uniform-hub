import { Router } from "express";
import { getProducts, getProductBySlug, getCategories } from "./products.controller.js";

const router = Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:slug", getProductBySlug);

export default router;
