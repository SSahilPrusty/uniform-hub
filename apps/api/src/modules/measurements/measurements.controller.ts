import { Request, Response } from "express";
import { prisma } from "../../config/db.js";

export const getMyMeasurements = async (req: Request, res: Response): Promise<void> => {
  try {
    const measurements = await prisma.customMeasurement.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: measurements });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createMeasurement = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      studentName,
      gender,
      chest,
      waist,
      shoulder,
      sleeveLength,
      shirtLength,
      trouserLength,
      hip,
      skirtLength,
      notes,
    } = req.body;

    const measurement = await prisma.customMeasurement.create({
      data: {
        userId: req.user!.id,
        studentName,
        gender: gender || "BOYS",
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        shoulder: shoulder ? parseFloat(shoulder) : null,
        sleeveLength: sleeveLength ? parseFloat(sleeveLength) : null,
        shirtLength: shirtLength ? parseFloat(shirtLength) : null,
        trouserLength: trouserLength ? parseFloat(trouserLength) : null,
        hip: hip ? parseFloat(hip) : null,
        skirtLength: skirtLength ? parseFloat(skirtLength) : null,
        notes: notes || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Custom student measurements saved successfully.",
      data: measurement,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteMeasurement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.customMeasurement.deleteMany({
      where: { id, userId: req.user!.id },
    });
    res.json({ success: true, message: "Measurement removed." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
