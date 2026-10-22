import { prisma } from "../config/db.js";

export const logAudit = async ({
  userId,
  userName,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: {
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}) => {
  try {
    const detailsStr = details ? (typeof details === "string" ? details : JSON.stringify(details)) : null;
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action,
        entityType,
        entityId,
        details: detailsStr,
        ipAddress,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};
