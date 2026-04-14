import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================

// Get form data by share token (public)
router.get("/:token", async (req, res) => {
  try {
    const link = await prisma.shareLink.findFirst({
      where: { token: req.params.token, active: true },
      include: { form: true },
    });
    
    if (!link) return res.status(404).json({ error: "Link not found or inactive" });
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(404).json({ error: "Link has expired" });
    }

    res.json({
      id: link.form.id,
      title: link.form.title,
      schema: link.form.schema,
    });
  } catch (error) {
    console.error("Error fetching shared form:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit response via share link (public)
router.post("/:token/submit", async (req, res) => {
  try {
    const link = await prisma.shareLink.findFirst({
      where: { token: req.params.token, active: true },
    });
    
    if (!link) return res.status(404).json({ error: "Link not found or inactive" });
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return res.status(404).json({ error: "Link has expired" });
    }

    const response = await prisma.response.create({
      data: {
        formId: link.formId,
        patientId: link.patientId || null,
        data: req.body,
      },
    });

    res.status(201).json({ success: true, responseId: response.id });
  } catch (error) {
    console.error("Error submitting response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// AUTHENTICATED ROUTES
// ==========================================
router.use(authMiddleware);

// Create share link
router.post("/create", async (req, res) => {
  try {
    const { formId, patientId, patientName, patientEmail, expiresAt } = req.body;
    if (!formId) return res.status(400).json({ error: "Form ID required" });

    // Verify form ownership
    const form = await prisma.form.findFirst({
      where: { id: formId, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });

    // Verify patient ownership if patientId is provided
    if (patientId) {
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, psychologistId: req.user.id },
      });
      if (!patient) return res.status(404).json({ error: "Patient not found" });
    }

    // Check if there's already an active link for this form/patient combo
    if (patientId && formId) {
      const existingActiveLink = await prisma.shareLink.findFirst({
        where: {
          formId,
          patientId,
          active: true,
        },
      });

      if (existingActiveLink) {
        console.log("✅ Link já existe para este formulário/paciente. Retornando existente.");
        return res.status(200).json({
          ...existingActiveLink,
          shareUrl: `${req.protocol}://${req.get("host")}/form/${existingActiveLink.token}`,
          reused: true,
          message: "Link já existe para este formulário. Reutilizando.",
        });
      }
    }

    const token = uuidv4().replace(/-/g, "");
    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        formId,
        patientId,
        patientName,
        patientEmail,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.status(201).json({
      ...shareLink,
      shareUrl: `${req.protocol}://${req.get("host")}/form/${token}`,
      reused: false,
    });
  } catch (error) {
    console.error("❌ Error creating share link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List share links for a form
router.get("/form/:formId", async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });
    const links = await prisma.shareLink.findMany({
      where: { formId: req.params.formId },
      include: {
        patient: {
          select: { name: true }
        },
        form: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// List share links for a patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.patientId, psychologistId: req.user.id },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    
    const links = await prisma.shareLink.findMany({
      where: { patientId: req.params.patientId },
      include: {
        form: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    
    // For each link, get response data and calculate status
    const linksWithMetadata = await Promise.all(
      links.map(async (link) => {
        // Get all responses for this form/patient combo
        const responses = await prisma.response.findMany({
          where: {
            formId: link.formId,
            patientId: req.params.patientId,
          },
          orderBy: { createdAt: "desc" },
        });

        // Get the most recent response
        const lastResponse = responses[0] || null;
        const responseCount = responses.length;

        // Calculate status
        const now = new Date();
        const isExpired = link.expiresAt && new Date(link.expiresAt) < now;
        const isActive = link.active && !isExpired;

        let status = "EXPIRADO";
        if (isActive && !lastResponse) status = "PENDENTE";
        if (isActive && lastResponse) status = "RESPONDIDO";
        if (!isActive && !lastResponse) status = "EXPIRADO";
        if (!isActive && lastResponse) status = "RESPONDIDO"; // respondido mas expirado

        return {
          ...link,
          response: lastResponse, // keep for backwards compatibility
          responses, // all responses for this link
          responseCount,
          lastResponseAt: lastResponse?.createdAt || null,
          status,
        };
      })
    );
    
    res.json(linksWithMetadata);
  } catch (error) {
    console.error("❌ Error fetching patient share links:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Extend share link (+30 days by default)
router.patch("/:id/extend", async (req, res) => {
  try {
    const { days, type } = req.body;
    const extendDays = days ? parseInt(days) : 30;

    console.log("🔗 Extend request for link ID:", req.params.id, "Days:", extendDays, "Type:", type);

    const link = await prisma.shareLink.findUnique({
      where: { id: req.params.id },
      include: { form: true },
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    if (link.form.createdBy !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const now = new Date();
    let newExpiresAt;

    // "newResponse" = sempre calcula a partir de agora (para links respondidos)
    // "renewal" = adiciona aos dias restantes ou a partir de agora se expirado
    if (type === "newResponse") {
      newExpiresAt = new Date(now.getTime() + extendDays * 24 * 60 * 60 * 1000);
    } else {
      if (link.expiresAt && new Date(link.expiresAt) > now) {
        newExpiresAt = new Date(new Date(link.expiresAt).getTime() + extendDays * 24 * 60 * 60 * 1000);
      } else {
        newExpiresAt = new Date(now.getTime() + extendDays * 24 * 60 * 60 * 1000);
      }
    }

    const updated = await prisma.shareLink.update({
      where: { id: req.params.id },
      data: {
        expiresAt: newExpiresAt,
        active: true,
      },
    });

    console.log("✅ Link extended successfully:", updated);
    res.json({
      success: true,
      message: type === "newResponse" ? `Novo link válido por ${extendDays} dias` : `Link renovado por ${extendDays} dias`,
      expiresAt: updated.expiresAt,
    });
  } catch (error) {
    console.error("❌ Error extending share link:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Revoke share link
router.patch("/:id/revoke", async (req, res) => {
  try {
    console.log("🔗 Revoke request for link ID:", req.params.id);
    console.log("👤 Current user ID:", req.user.id);
    
    const link = await prisma.shareLink.findUnique({
      where: { id: req.params.id },
      include: { form: true },
    });
    
    console.log("🔍 Found link:", link);
    
    if (!link) {
      console.log("❌ Link not found");
      return res.status(404).json({ error: "Link not found" });
    }
    
    console.log("🔐 Form owner ID:", link.form.createdBy, "Current user ID:", req.user.id);
    if (link.form.createdBy !== req.user.id) {
      console.log("❌ Unauthorized - user does not own the form");
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    console.log("🗑️ Deleting link completely");
    const deleted = await prisma.shareLink.delete({
      where: { id: req.params.id },
    });
    
    console.log("✅ Link deleted successfully:", deleted);
    res.json({ success: true, message: "Link deletado com sucesso" });
  } catch (error) {
    console.error("❌ Error revoking share link:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
