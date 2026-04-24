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
      },
      orderBy: { startDate: 'asc' }
    });
    const formatted = appointments.map(a => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek,
      time: a.time,
      duration: a.duration,
      startDate: a.startDate ? a.startDate.toISOString().split('T')[0] : null
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Error loading appointments:", error);
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
  const { patientId, slots } = req.body; // slots: [{ dayOfWeek, time, duration, startDate }]
  
  console.log("batch slots received:", JSON.stringify(slots, null, 2));

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: "Nenhum slot fornecido" });
  }
  
  let missingDate = null;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot.startDate) {
      missingDate = i + 1;
      break;
    }
  }
  
  if (missingDate) {
    return res.status(400).json({ error: `Slot ${missingDate}: data de início não informada` });
  }

  try {
    console.log("Criando slots...");
    
    // 1. Remover horários antigos do paciente para este profissional
    const deleted = await prisma.appointment.deleteMany({
      where: { patientId, psychologistId: req.user.id }
    });
    console.log("Removed:", deleted.count, "old appointments");

    // 2. Criar novos horários (cada um com sua própria data de início)
    const newAppointments = [];
    for (const slot of slots) {
      const datePart = slot.startDate.split('T')[0];
      const start = new Date(datePart + 'T00:00:00Z');
      console.log("Creating slot:", { dayOfWeek: slot.dayOfWeek, time: slot.time, startDate: start });
      
      const created = await prisma.appointment.create({
        data: {
          dayOfWeek: slot.dayOfWeek,
          time: slot.time,
          duration: slot.duration,
          startDate: start,
          patientId,
          psychologistId: req.user.id
        }
      });
      newAppointments.push(created);
    }

    console.log("Created appointments:", newAppointments.length);
    res.status(201).json(newAppointments);
  } catch (error) {
    console.error("Error saving appointments:", error);
    res.status(500).json({ error: "Erro ao salvar horários: " + error.message });
  }
});

// Verificar conflitos (para feedback em tempo real no frontend)
router.post("/check-conflict", async (req, res) => {
  const { dayOfWeek, time, duration, excludePatientId } = req.body;

  if (!time || !duration) {
    return res.json({ hasConflict: false, conflicts: [] });
  }

  try {
    // 1. Buscar todos os agendamentos do mesmo dia da semana
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        psychologistId: req.user.id,
        dayOfWeek: parseInt(dayOfWeek),
        patientId: { not: excludePatientId },
      },
      include: { patient: { select: { name: true } } }
    });

    // 2. Converter horários para minutos para facilitar a comparação
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(time);
    const newEnd = newStart + parseInt(duration);

    // 3. Filtrar os que sobrepõem
    // Overlap: (start1 < end2) && (start2 < end1)
    const conflicts = existingAppointments.filter(app => {
      const appStart = toMinutes(app.time);
      const appEnd = appStart + app.duration;
      return newStart < appEnd && appStart < newEnd;
    });

    res.json({ hasConflict: conflicts.length > 0, conflicts });
  } catch (error) {
    console.error("Erro ao verificar conflitos:", error);
    res.status(500).json({ error: "Erro ao verificar conflito" });
  }
});

export default router;
