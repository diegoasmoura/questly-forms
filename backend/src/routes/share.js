import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Create share link
router.post("/create", async (req, res) => {
  try {
    const { formId, patientName, patientEmail, expiresAt } = req.body;
    if (!formId) return res.status(400).json({ error: "Form ID required" });

    // Verify form ownership
    const form = await prisma.form.findFirst({
      where: { id: formId, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });

    const token = uuidv4().replace(/-/g, "");
    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        formId,
        patientName,
        patientEmail,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.status(201).json({
      ...shareLink,
      shareUrl: `${req.protocol}://${req.get("host")}/share/${token}`,
    });
  } catch (error) {
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
      orderBy: { createdAt: "desc" },
    });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Revoke share link
router.patch("/:id/revoke", async (req, res) => {
  try {
    const link = await prisma.shareLink.findFirst({
      where: {
        id: req.params.id,
        form: { createdBy: req.user.id },
      },
    });
    if (!link) return res.status(404).json({ error: "Link not found" });
    const updated = await prisma.shareLink.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
