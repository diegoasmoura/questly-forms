import prisma from "../db.js";

export async function logAudit(req, action, entity, entityId, details = null) {
  const userId = req.user?.id;
  if (!userId) return;

  const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? details : null,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error("Error writing audit log:", error.message);
  }
}
