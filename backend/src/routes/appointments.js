import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Listar todos os agendamentos do profissional (para a página Agenda do Sidebar)
router.get("/", async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { psychologistId: req.user.id },
      include: {
        patient: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { time: 'asc' }
      ]
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar agenda" });
  }
});

// Listar agendamentos de um paciente específico
router.get("/patient/:patientId", async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { 
        patientId: req.params.patientId,
        psychologistId: req.user.id 
      }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar horários do paciente" });
  }
});

// Salvar/Atualizar horários de um paciente (Lógica para 1x, 2x por semana etc)
router.post("/batch", async (req, res) => {
  const { patientId, slots, startDate } = req.body; // slots: [{ dayOfWeek, time, duration }]

  try {
    // Validar data de início
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    // 1. Remover horários antigos do paciente para este profissional
    await prisma.appointment.deleteMany({
      where: { patientId, psychologistId: req.user.id }
    });

    // 2. Criar novos horários
    const newAppointments = await Promise.all(
      slots.map(slot => 
        prisma.appointment.create({
          data: {
            dayOfWeek: slot.dayOfWeek,
            time: slot.time,
            duration: slot.duration,
            startDate: start,
            patientId,
            psychologistId: req.user.id
          }
        })
      )
    );

    res.status(201).json(newAppointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar horários" });
  }
});

// Verificar conflitos (para feedback em tempo real no frontend)
router.post("/check-conflict", async (req, res) => {
  const { dayOfWeek, time, duration, excludePatientId } = req.body;

  try {
    const conflicts = await prisma.appointment.findMany({
      where: {
        psychologistId: req.user.id,
        dayOfWeek: parseInt(dayOfWeek),
        patientId: { not: excludePatientId },
        // Lógica simples de sobreposição: (Início < FimExistente) && (Fim > InícioExistente)
        // Como o tempo é string "HH:mm", a comparação de strings funciona para horários
        time: {
           // Simplificado para este exemplo: mesmo horário exato
           equals: time 
        }
      },
      include: { patient: { select: { name: true } } }
    });

    res.json({ hasConflict: conflicts.length > 0, conflicts });
  } catch (error) {
    res.status(500).json({ error: "Erro ao verificar conflito" });
  }
});

export default router;
