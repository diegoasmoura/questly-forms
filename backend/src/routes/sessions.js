import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Listar logs de sessão para um período
router.get("/", async (req, res) => {
  const { startDate, endDate, patientId } = req.query;
  try {
    const sessions = await prisma.sessionLog.findMany({
      where: {
        psychologistId: req.user.id,
        ...(patientId && { patientId }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      include: {
        patient: { select: { name: true } }
      }
    });
    res.json(sessions);
  } catch (error) {
    console.error("Erro ao carregar sessions:", error);
    res.status(500).json({ error: "Erro ao carregar logs de sessão" });
  }
});

// Criar ou atualizar um log de sessão
router.post("/", async (req, res) => {
  const { patientId, date, status, notes, time, appointmentId } = req.body;

  try {
    if (!patientId || !date || !status) {
      return res.status(400).json({ error: "Dados obrigatórios faltando" });
    }

    const sessionDate = new Date(date);
    sessionDate.setUTCHours(0, 0, 0, 0);

    // Tenta encontrar se já existe log para este paciente, data e profissional
    const existing = await prisma.sessionLog.findFirst({
      where: {
        patientId,
        date: sessionDate,
        psychologistId: req.user.id
      }
    });

    if (existing) {
      const updated = await prisma.sessionLog.update({
        where: { id: existing.id },
        data: { 
          status, 
          notes: notes !== undefined ? notes : existing.notes,
          time: time !== undefined ? time : existing.time,
          appointmentId: appointmentId !== undefined ? appointmentId : existing.appointmentId
        }
      });
      return res.json(updated);
    }

    const created = await prisma.sessionLog.create({
      data: {
        patientId,
        date: sessionDate,
        status,
        notes,
        time,
        appointmentId,
        psychologistId: req.user.id
      }
    });
    res.status(201).json(created);
  } catch (error) {
    console.error("Erro ao salvar session log:", error);
    res.status(500).json({ error: "Erro ao salvar log de sessão" });
  }
});

// Remover um log (voltar ao status padrão da agenda)
router.delete("/:id", async (req, res) => {
  try {
    await prisma.sessionLog.delete({
      where: { 
        id: req.params.id,
        psychologistId: req.user.id
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar session log:", error);
    res.status(500).json({ error: "Erro ao excluir log" });
  }
});

export default router;
