import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const getSchoolDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolProfile = await prisma.schoolProfile.findUnique({
      where: { userId: req.user!.id },
      include: { school: true },
    });

    if (!schoolProfile) {
      res.status(404).json({ success: false, error: "School profile not associated with this account." });
      return;
    }

    const schoolId = schoolProfile.schoolId;

    const [approvedProductsCount, pendingRequestsCount, approvedProducts, recentRequests] = await Promise.all([
      prisma.product.count({
        where: { schoolId, status: "APPROVED" },
      }),
      prisma.schoolCatalogRequest.count({
        where: { schoolId, status: "PENDING" },
      }),
      prisma.product.findMany({
        where: { schoolId, status: "APPROVED" },
        include: {
          category: true,
          variants: true,
          images: { take: 1 },
        },
        take: 5,
      }),
      prisma.schoolCatalogRequest.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      data: {
        school: schoolProfile.school,
        principalName: schoolProfile.principalName,
        metrics: {
          approvedProductsCount,
          pendingRequestsCount,
        },
        approvedProducts,
        recentRequests,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitUniformDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const schoolProfile = await prisma.schoolProfile.findUnique({
      where: { userId: req.user!.id },
      include: { school: true },
    });

    if (!schoolProfile) {
      res.status(403).json({ success: false, error: "Unauthorized. School profile missing." });
      return;
    }

    const {
      uniformDescription,
      referenceImageUrl,
      notes,
    } = req.body;

    const request = await prisma.schoolCatalogRequest.create({
      data: {
        schoolId: schoolProfile.schoolId,
        userId: req.user!.id,
        schoolName: schoolProfile.school.name,
        city: schoolProfile.school.city,
        state: schoolProfile.school.state,
        requesterName: req.user!.name,
        requesterRole: schoolProfile.designation || "Principal/Administrator",
        requesterEmail: req.user!.email,
        requesterPhone: req.user!.phone || schoolProfile.school.contactPhone || "+910000000000",
        uniformDescription,
        referenceImageUrl: referenceImageUrl || null,
        adminNotes: notes || null,
        status: "PENDING",
      },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "UNIFORM_DESIGN_SUBMITTED",
      entityType: "SchoolCatalogRequest",
      entityId: request.id,
      details: { schoolId: schoolProfile.schoolId, description: uniformDescription },
    });

    res.status(201).json({
      success: true,
      message: "Uniform design submitted for Admin verification and franchise manufacturing allocation.",
      data: request,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
