import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";
import path from "path";
import fs from "fs";

export const uploadProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "No image file provided." });
      return;
    }

    const { productId, altText, isPrimary, sortOrder, schoolId } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, error: "Product ID is required to assign image." });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ success: false, error: "Product not found." });
      return;
    }

    // Relative web URL for uploaded asset
    const fileUrl = `/uploads/${req.file.filename}`;
    const primaryStatus = isPrimary === "true" || isPrimary === true;

    // If marked primary, unset existing primaries for this product
    if (primaryStatus) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    const newImage = await prisma.productImage.create({
      data: {
        productId,
        url: fileUrl,
        altText: altText || `${product.name} Image`,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        isPrimary: primaryStatus,
        schoolId: schoolId || product.schoolId || null,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        school: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      action: "PRODUCT_IMAGE_UPLOADED",
      entityType: "ProductImage",
      entityId: newImage.id,
      details: { productId, filename: req.file.filename, isPrimary: primaryStatus },
    });

    res.status(201).json({
      success: true,
      message: "Product image uploaded and assigned successfully.",
      data: newImage,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listProductImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, schoolId, categoryId, search } = req.query;

    const where: any = {};

    if (productId && typeof productId === "string") {
      where.productId = productId;
    }

    if (schoolId && typeof schoolId === "string") {
      where.schoolId = schoolId;
    }

    if (categoryId && typeof categoryId === "string") {
      where.product = {
        categoryId,
      };
    }

    if (search && typeof search === "string") {
      where.OR = [
        { altText: { contains: search } },
        { product: { name: { contains: search } } },
        { school: { name: { contains: search } } },
      ];
    }

    const images = await prisma.productImage.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: { select: { id: true, name: true } },
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ success: true, data: images });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { altText, sortOrder, isPrimary, productId, schoolId } = req.body;

    const existing = await prisma.productImage.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: "Image record not found." });
      return;
    }

    const targetProductId = productId || existing.productId;

    if (isPrimary === true || isPrimary === "true") {
      await prisma.productImage.updateMany({
        where: { productId: targetProductId },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.productImage.update({
      where: { id },
      data: {
        altText: altText !== undefined ? altText : existing.altText,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : existing.sortOrder,
        isPrimary: isPrimary !== undefined ? isPrimary === true || isPrimary === "true" : existing.isPrimary,
        productId: targetProductId,
        schoolId: schoolId !== undefined ? (schoolId ? schoolId : null) : existing.schoolId,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        school: { select: { id: true, name: true } },
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      action: "PRODUCT_IMAGE_UPDATED",
      entityType: "ProductImage",
      entityId: id,
      details: { productId: targetProductId, isPrimary: updated.isPrimary, sortOrder: updated.sortOrder },
    });

    res.json({
      success: true,
      message: "Image details updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const image = await prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) {
      res.status(404).json({ success: false, error: "Image not found." });
      return;
    }

    // Delete file from disk if local upload
    if (image.url.startsWith("/uploads/")) {
      const filename = path.basename(image.url);
      const filePath = path.resolve(process.cwd(), "uploads", filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("Could not delete physical file:", filePath);
        }
      }
    }

    await prisma.productImage.delete({
      where: { id },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.name,
      action: "PRODUCT_IMAGE_DELETED",
      entityType: "ProductImage",
      entityId: id,
      details: { url: image.url, productId: image.productId },
    });

    res.json({
      success: true,
      message: "Product image deleted successfully.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reorderProductImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orders } = req.body; // Array of { id: string, sortOrder: number }

    if (!Array.isArray(orders)) {
      res.status(400).json({ success: false, error: "Invalid reorder payload. Array expected." });
      return;
    }

    await prisma.$transaction(
      orders.map((item) =>
        prisma.productImage.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    res.json({
      success: true,
      message: "Image order updated successfully.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
