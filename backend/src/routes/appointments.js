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

// Listar horários de um paciente específico
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
    res.status(500).json({ error: "Erro ao buscar agendamentos do paciente" });
  }
});

// Excluir agendamentos e registros de presença de um paciente (com filtro de data)
router.delete("/patient/:patientId", async (req, res) => {
  const { mode } = req.query; // 'all' ou 'future'
  const { patientId } = req.params;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    // 1. Remover registros de presença (Attendances)
    const attendanceWhere = { 
      patientId,
      psychologistId: req.user.id
    };

    // Se for 'future', só apaga o que for hoje ou depois
    if (mode === 'future') {
      attendanceWhere.date = { gte: today };
    }

    await prisma.attendance.deleteMany({ where: attendanceWhere });

    // 2. Remover agendamentos fixos (Appointments)
    // Note: Appointments são regras recorrentes. Se removermos, eles somem de todo o calendário.
    // Presumimos que ao limpar a agenda, o profissional quer parar a recorrência.
    await prisma.appointment.deleteMany({
      where: { 
        patientId,
        psychologistId: req.user.id
      }
    });

    res.json({ 
      success: true, 
      message: mode === 'future' ? "Agenda futura limpa. Histórico passado preservado." : "Agenda e histórico removidos completamente." 
    });
  } catch (error) {
    console.error("Erro ao excluir agenda:", error);
    res.status(500).json({ error: "Erro ao excluir agenda do paciente" });
  }
});

// Salvar/Atualizar horários de um paciente (Lógica para 1x, 2x por semana etc)
router.post("/batch", async (req, res) => {
  const { patientId, slots, startDate } = req.body; // slots: [{ dayOfWeek, time, duration }]

  try {
    // Validar data de início - extrair apenas YYYY-MM-DD para evitar problemas de fuso
    const datePart = startDate.split('T')[0];
    const start = new Date(datePart + 'T00:00:00Z');
    
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
