import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require auth
router.use(authMiddleware);

// List forms
router.get("/", async (req, res) => {
  try {
    const forms = await prisma.form.findMany({
      where: { createdBy: req.user.id },
      orderBy: { updatedAt: "desc" },
    });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single form
router.get("/:id", async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create form
router.post("/", async (req, res) => {
  try {
    const { title, schema } = req.body;
    if (!title || !schema) {
      return res.status(400).json({ error: "Title and schema required" });
    }
    const form = await prisma.form.create({
      data: { title, schema, createdBy: req.user.id },
    });
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update form
router.put("/:id", async (req, res) => {
  try {
    const { title, schema } = req.body;
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });
    const updated = await prisma.form.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(schema && { schema }),
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete form
router.delete("/:id", async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });
    await prisma.form.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Duplicate form
router.post("/:id/duplicate", async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });
    const duplicate = await prisma.form.create({
      data: {
        title: `${form.title} (copy)`,
        schema: form.schema,
        createdBy: req.user.id,
      },
    });
    res.status(201).json(duplicate);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get form stats
router.get("/:id/stats", async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });
    const responseCount = await prisma.response.count({ where: { formId: req.params.id } });
    const shareLinkCount = await prisma.shareLink.count({ where: { formId: req.params.id } });
    const latestResponse = await prisma.response.findFirst({
      where: { formId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ responseCount, shareLinkCount, latestResponse });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
