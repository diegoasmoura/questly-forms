import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Listar attendances do profissional
router.get("/", async (req, res) => {
  try {
    const attendances = await prisma.attendance.findMany({
      where: { psychologistId: req.user.id },
      include: {
        patient: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar attendances" });
  }
});

// Listar attendances por data ou paciente
router.get("/filter", async (req, res) => {
  const { date, patientId } = req.query;
  try {
    const where = { psychologistId: req.user.id };
    if (date) where.date = new Date(date);
    if (patientId) where.patientId = patientId;
    
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Erro ao filtrar attendances" });
  }
});

// Registrar presença/falta
router.post("/", async (req, res) => {
  const { patientId, date, status, notes, sessionTime, parentId } = req.body;
  
  try {
    const existing = await prisma.attendance.findFirst({
      where: {
        patientId,
        date: new Date(date),
        psychologistId: req.user.id
      }
    });
    
    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: { 
          status, 
          notes, 
          sessionTime,
          ...(parentId && { parentId })
        }
      });
      return res.json(updated);
    }
    
    const attendance = await prisma.attendance.create({
      data: {
        patientId,
        date: new Date(date),
        status,
        notes,
        sessionTime,
        psychologistId: req.user.id,
        ...(parentId && { parentId })
      }
    });
    
    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao registrar attendance" });
  }
});

// Deletar attendance
router.delete("/:id", async (req, res) => {
  try {
    await prisma.attendance.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar attendance" });
  }
});

// estatisticas
router.get("/stats", async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const where = {
      psychologistId: req.user.id,
      date: { gte: start, lte: end }
    };
    
    const [present, absent, justified] = await Promise.all([
      prisma.attendance.count({ where: { ...where, status: 'presente' } }),
      prisma.attendance.count({ where: { ...where, status: 'falta' } }),
      prisma.attendance.count({ where: { ...where, status: 'justificada' } })
    ]);
    
    res.json({ presente: present, falta: absent, justificada: justified });
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar estatísticas" });
  }
});

export default router;