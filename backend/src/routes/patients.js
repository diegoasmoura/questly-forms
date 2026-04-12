import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require auth
router.use(authMiddleware);

// List patients
router.get("/", async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { psychologistId: req.user.id },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { responses: true }
        }
      }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single patient with history
router.get("/:id", async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, psychologistId: req.user.id },
      include: {
        responses: {
          include: {
            form: {
              select: { 
                title: true,
                schema: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        shareLinks: {
          include: {
            form: {
              select: { 
                title: true,
                schema: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create patient
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, birthDate, notes } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
        notes,
        psychologistId: req.user.id
      }
    });
    res.status(201).json(patient);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "A patient with this email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update patient
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone, birthDate, notes } = req.body;
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, psychologistId: req.user.id },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const updated = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
        ...(notes !== undefined && { notes }),
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete patient
router.delete("/:id", async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, psychologistId: req.user.id },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
