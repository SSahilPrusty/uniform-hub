import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const getSchools = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, state, city, verified } = req.query;

    const where: any = { isActive: true };

    if (verified === "true") {
      where.isVerified = true;
    }

    if (state && typeof state === "string") {
      where.state = { contains: state };
    }

    if (city && typeof city === "string") {
      where.city = { contains: city };
    }

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { state: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const schools = await prisma.school.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    res.json({ success: true, data: schools });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSchoolBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const school = await prisma.school.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: "APPROVED" },
          include: {
            variants: { where: { isAvailable: true } },
            images: { orderBy: { sortOrder: "asc" } },
            category: true,
          },
        },
      },
    });

    if (!school) {
      res.status(404).json({ success: false, error: "School not found." });
      return;
    }

    res.json({ success: true, data: school });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const requestSchoolCatalog = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      schoolName,
      city,
      state,
      requesterName,
      requesterRole,
      requesterEmail,
      requesterPhone,
      uniformDescription,
      referenceImageUrl,
    } = req.body;

    const request = await prisma.schoolCatalogRequest.create({
      data: {
        schoolName,
        city,
        state,
        requesterName,
        requesterRole,
        requesterEmail,
        requesterPhone,
        uniformDescription,
        referenceImageUrl: referenceImageUrl || null,
        status: "PENDING",
      },
    });

    await logAudit({
      action: "SCHOOL_CATALOG_REQUESTED",
      entityType: "SchoolCatalogRequest",
      entityId: request.id,
      details: { schoolName, city, state, requesterEmail },
    });

    res.status(201).json({
      success: true,
      message: "Your school uniform request has been submitted successfully. Our team will verify and onboard it.",
      data: request,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
