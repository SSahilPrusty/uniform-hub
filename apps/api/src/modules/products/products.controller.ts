import { Request, Response } from "express";
import { prisma } from "../../config/db.js";

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      school,
      gender,
      size,
      minPrice,
      maxPrice,
      sort = "newest",
      page = "1",
      limit = "12",
      featured,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * take;

    const where: any = {
      status: "APPROVED",
    };

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (gender && typeof gender === "string") {
      where.gender = gender.toUpperCase();
    }

    if (category && typeof category === "string") {
      where.category = {
        slug: category,
      };
    }

    if (school && typeof school === "string") {
      if (school === "general") {
        where.schoolId = null;
      } else {
        where.school = {
          slug: school,
        };
      }
    }

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (size && typeof size === "string") {
      where.variants = {
        some: {
          size: size,
          isAvailable: true,
        },
      };
    }

    if (minPrice || maxPrice) {
      where.variants = {
        ...where.variants,
        some: {
          ...(where.variants?.some || {}),
          sellingPrice: {
            ...(minPrice ? { gte: parseFloat(minPrice as string) } : {}),
            ...(maxPrice ? { lte: parseFloat(maxPrice as string) } : {}),
          },
        },
      };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-asc") {
      orderBy = { variants: { _count: "asc" } }; // or custom sort in memory/view
    } else if (sort === "price-desc") {
      orderBy = { variants: { _count: "desc" } };
    } else if (sort === "name-asc") {
      orderBy = { name: "asc" };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          school: true,
          variants: {
            where: { isAvailable: true },
            orderBy: { sellingPrice: "asc" },
          },
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      meta: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        school: true,
        franchise: true,
        variants: {
          where: { isAvailable: true },
          orderBy: { sellingPrice: "asc" },
        },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, error: "Product not found." });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
