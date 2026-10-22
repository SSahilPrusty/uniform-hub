import { Request, Response } from "express";
import { prisma } from "../../config/db.js";
import { logAudit } from "../../utils/audit.js";

export const getTailorDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const tailor = await prisma.tailorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tailor) {
      res.status(403).json({ success: false, error: "Tailor profile not found." });
      return;
    }

    const [activeJobs, completedJobs, unassignedJobs] = await Promise.all([
      prisma.tailoringJob.findMany({
        where: {
          tailorId: tailor.id,
          status: { in: ["ASSIGNED", "ACCEPTED", "MEASUREMENTS_REQUIRED", "IN_PROGRESS", "QUALITY_CHECK"] },
        },
        include: {
          order: { select: { orderNumber: true, customerName: true } },
          orderItem: true,
          measurement: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.tailoringJob.count({
        where: { tailorId: tailor.id, status: "COMPLETED" },
      }),
      prisma.tailoringJob.findMany({
        where: { tailorId: null, status: "NEW" },
        include: {
          order: { select: { orderNumber: true } },
          orderItem: true,
        },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      data: {
        tailor,
        metrics: {
          activeJobsCount: activeJobs.length,
          completedJobsCount: completedJobs,
          availablePoolCount: unassignedJobs.length,
        },
        activeJobs,
        availablePool: unassignedJobs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const claimJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const tailor = await prisma.tailorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tailor) {
      res.status(403).json({ success: false, error: "Tailor profile not found." });
      return;
    }

    const { jobId } = req.params;

    const job = await prisma.tailoringJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      res.status(404).json({ success: false, error: "Job not found." });
      return;
    }

    if (job.tailorId && job.tailorId !== tailor.id) {
      res.status(400).json({ success: false, error: "This job has already been claimed by another tailor." });
      return;
    }

    const updatedJob = await prisma.tailoringJob.update({
      where: { id: jobId },
      data: {
        tailorId: tailor.id,
        status: "ACCEPTED",
      },
      include: {
        measurement: true,
        orderItem: true,
      },
    });

    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name,
      action: "TAILOR_JOB_CLAIMED",
      entityType: "TailoringJob",
      entityId: jobId,
    });

    res.json({
      success: true,
      message: "Job claimed and assigned to your workbench.",
      data: updatedJob,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const tailor = await prisma.tailorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!tailor) {
      res.status(403).json({ success: false, error: "Tailor profile not found." });
      return;
    }

    const { jobId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = [
      "ACCEPTED",
      "MEASUREMENTS_REQUIRED",
      "IN_PROGRESS",
      "QUALITY_CHECK",
      "READY",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: "Invalid tailor job status." });
      return;
    }

    const job = await prisma.tailoringJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.tailorId !== tailor.id) {
      res.status(403).json({ success: false, error: "Access denied. You can only update jobs assigned to you." });
      return;
    }

    const updatedJob = await prisma.tailoringJob.update({
      where: { id: jobId },
      data: {
        status,
        tailorNotes: notes || job.tailorNotes,
        ...(status === "COMPLETED" && { completedDate: new Date() }),
      },
    });

    res.json({
      success: true,
      message: `Tailoring job updated to ${status}.`,
      data: updatedJob,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
