import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import { config } from "../../config/index.js";
import { logAudit } from "../../utils/audit.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role || "CUSTOMER";

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        passwordHash,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Create default customer profile if role is CUSTOMER
    if (assignedRole === "CUSTOMER") {
      await prisma.customerProfile.create({
        data: { userId: user.id },
      });
    }

    // Create tailor profile if role is TAILOR
    if (assignedRole === "TAILOR") {
      const tailorProfile = await prisma.tailorProfile.create({
        data: {
          userId: user.id,
          tailorName: user.name,
          shopName: req.body.shopName || `${user.name} Bespoke Tailors`,
          phone: user.phone || req.body.phone || "",
          address: req.body.address || "Workshop Studio",
          city: req.body.city || "Bengaluru",
          state: req.body.state || "Karnataka",
          specializations: req.body.specializations || "School Uniforms, Shirts, Trousers, Blazers",
          skills: req.body.skills || "Pattern Cutting, Hemming, Custom Sizing",
          experience: req.body.experience || "School uniform tailor & alteration specialist",
          documentsUrl: req.body.documentsUrl || null,
          approvalStatus: "PENDING",
          isVerified: false,
          isAvailable: false,
          maxActiveOrders: 10,
          activeOrderCount: 0,
        },
      });

      // Notify Operations Admins of new tailor application
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "New Tailor Application",
            message: `${user.name} (${tailorProfile.shopName}) has registered as a tailoring partner and is awaiting approval.`,
            type: "APPROVAL",
            linkUrl: `/admin?tab=tailor-applications`,
          },
        });
      }

      // Welcome notification to tailor
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Application Under Review",
          message: "Thank you for applying to Uniform Hub. Your tailoring partner application is currently under review by Operations Admin.",
          type: "INFO",
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      details: { role: user.role, approvalStatus: assignedRole === "TAILOR" ? "PENDING" : undefined },
    });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: { user, token },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Registration failed." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { tailorProfile: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          tailorProfile: user.tailorProfile || null,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Login failed." });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        customerProfile: true,
        schoolProfile: { include: { school: true } },
        franchiseProfile: true,
        tailorProfile: true,
        addresses: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found." });
      return;
    }

    const unreadNotificationsCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    res.json({
      success: true,
      data: {
        ...user,
        unreadNotificationsCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: { isDefault: "desc" },
    });
    res.json({ success: true, data: addresses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, addressLine1, addressLine2, city, district, state, pincode, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user!.id,
        name,
        phone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        district: district || null,
        state,
        pincode,
        isDefault: !!isDefault,
      },
    });

    res.status(201).json({ success: true, data: address });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.address.deleteMany({
      where: { id, userId: req.user!.id },
    });
    res.json({ success: true, message: "Address removed successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
