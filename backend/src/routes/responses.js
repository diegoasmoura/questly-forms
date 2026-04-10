import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Get responses for a form
router.get("/form/:formId", async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });
    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      orderBy: { createdAt: "desc" },
    });
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single response
router.get("/:id", async (req, res) => {
  try {
    const response = await prisma.response.findUnique({
      where: { id: req.params.id },
      include: { form: { where: { createdBy: req.user.id } } },
    });
    if (!response || !response.form) return res.status(404).json({ error: "Response not found" });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete response
router.delete("/:id", async (req, res) => {
  try {
    const response = await prisma.response.findUnique({
      where: { id: req.params.id },
      include: { form: { where: { createdBy: req.user.id } } },
    });
    if (!response || !response.form) return res.status(404).json({ error: "Response not found" });
    await prisma.response.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get aggregate stats for a form
router.get("/form/:formId/aggregate", async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, createdBy: req.user.id },
    });
    if (!form) return res.status(404).json({ error: "Form not found" });

    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
    });

    // Basic aggregation
    const total = responses.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const todayCount = responses.filter((r) => new Date(r.createdAt) >= today).length;
    const weekCount = responses.filter((r) => new Date(r.createdAt) >= thisWeek).length;

    // Per-day counts for chart
    const dailyCounts = {};
    responses.forEach((r) => {
      const day = new Date(r.createdAt).toISOString().split("T")[0];
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    res.json({ total, todayCount, weekCount, dailyCounts });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
