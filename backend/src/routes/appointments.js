import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Utilitário para data de hoje à meia-noite local (fuso Brasil UTC-3) normalizada para UTC
const getTodayUtcMidnight = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00Z`);
};

// Lógica de colisão centralizada para intervalo mínimo de 50 minutos (ou duração real)
const checkConflictInternal = async ({
  dayOfWeek,
  time,
  duration,
  startDate,
  scheduledDate,
  excludeId,
  psychologistId,
  excludePatientId
}) => {
  if (!time || !duration) return { hasConflict: false, conflicts: [] };

  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const startMinutes = toMinutes(time);
  const endMinutes = startMinutes + parseInt(duration);

  // Buscar todos os agendamentos do profissional, exceto o editado e (opcionalmente) os do próprio paciente
  const existing = await prisma.appointment.findMany({
    where: {
      psychologistId,
      id: excludeId ? { not: excludeId } : undefined,
      patientId: excludePatientId ? { not: excludePatientId } : undefined
    },
    include: { patient: { select: { name: true } } }
  });

  const isNewAvulso = !!scheduledDate;
  const dNewStart = startDate ? new Date(startDate.split('T')[0] + 'T00:00:00Z') : (scheduledDate ? new Date(scheduledDate.split('T')[0] + 'T00:00:00Z') : null);
  const newDayOfWeek = parseInt(dayOfWeek);

  const conflicts = existing.filter(app => {
    // A. Sobreposição de minutos (janela de 50 minutos ou tempo real de duração)
    const appStart = toMinutes(app.time);
    const appEnd = appStart + app.duration;
    
    const timeOverlap = startMinutes < appEnd && appStart < endMinutes;
    if (!timeOverlap) return false;

    const isExistAvulso = !!app.scheduledDate;
    const dExistStart = app.startDate ? new Date(app.startDate) : (app.scheduledDate ? new Date(app.scheduledDate) : null);
    const dExistEnd = app.endDate ? new Date(app.endDate) : null;

    // B. Ambos são avulsos
    if (isNewAvulso && isExistAvulso) {
      return scheduledDate.split('T')[0] === app.scheduledDate.toISOString().split('T')[0];
    }

    // C. Ambos são recorrentes
    if (!isNewAvulso && !isExistAvulso) {
      if (newDayOfWeek !== app.dayOfWeek) return false;
      
      const startColides = dNewStart <= (dExistEnd || new Date('9999-12-31'));
      const endColides = dExistStart <= (dNewStart || new Date('9999-12-31'));
      return startColides && endColides;
    }

    // D. Um recorrente e um avulso
    const rec = !isNewAvulso ? { startDate: dNewStart, endDate: null, dayOfWeek: newDayOfWeek, skipDates: null } : app;
    const av = isNewAvulso ? { scheduledDate: scheduledDate } : app;

    const avDatePart = av.scheduledDate instanceof Date ? av.scheduledDate.toISOString().split('T')[0] : av.scheduledDate.split('T')[0];
    const [y, mo, d] = avDatePart.split('-').map(Number);
    const localAvDate = new Date(y, mo - 1, d);
    const avDayOfWeek = localAvDate.getDay();

    if (rec.dayOfWeek !== avDayOfWeek) return false;

    const rStart = rec.startDate ? new Date(rec.startDate) : null;
    const rEnd = rec.endDate ? new Date(rec.endDate) : null;
    const avTime = new Date(avDatePart + 'T00:00:00Z');

    if (rStart && avTime < rStart) return false;
    if (rEnd && avTime > rEnd) return false;

    if (rec.skipDates) {
      const skips = Array.isArray(rec.skipDates) ? rec.skipDates : JSON.parse(JSON.stringify(rec.skipDates)) || [];
      if (skips.includes(avDatePart)) return false;
    }

    return true;
  });

  return { hasConflict: conflicts.length > 0, conflicts };
};

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
      startDate: a.startDate ? a.startDate.toISOString().split('T')[0] : null,
      maxSessions: a.maxSessions,
      scheduledDate: a.scheduledDate ? a.scheduledDate.toISOString().split('T')[0] : null,
      endDate: a.endDate ? a.endDate.toISOString().split('T')[0] : null,
      skipDates: a.skipDates
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Error loading appointments:", error);
    res.status(500).json({ error: "Erro ao buscar agendamentos do paciente" });
  }
});

// Excluir todos os agendamentos de um paciente
router.delete("/patient/:patientId", async (req, res) => {
  const { patientId } = req.params;

  try {
    await prisma.appointment.deleteMany({
      where: {
        patientId,
        psychologistId: req.user.id
      }
    });

    res.json({
      success: true,
      message: "Agenda removida completamente."
    });
  } catch (error) {
    console.error("Erro ao excluir agenda:", error);
    res.status(500).json({ error: "Erro ao excluir agenda do paciente" });
  }
});

// Excluir agendamentos em lote de um paciente por horário
router.delete("/patient/:patientId/time/:time", async (req, res) => {
  const { patientId, time } = req.params;
  try {
    await prisma.appointment.deleteMany({
      where: {
        patientId,
        time,
        psychologistId: req.user.id
      }
    });
    res.json({ success: true, message: `Todos os agendamentos das ${time} foram excluídos.` });
  } catch (error) {
    console.error("Error deleting appointments by time:", error);
    res.status(500).json({ error: "Erro ao excluir agendamentos do paciente neste horário" });
  }
});

// Salvar/Atualizar horários de um paciente (Lógica para 1x, 2x por semana etc) em lote
router.post("/batch", async (req, res) => {
  const { patientId, slots } = req.body;
  
  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: "Nenhum slot fornecido" });
  }
  
  // 1. Validar retroatividade e datas obrigatórias
  const todayMidnight = getTodayUtcMidnight();
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot.startDate && !slot.scheduledDate) {
      return res.status(400).json({ error: `Slot ${i + 1}: data de início não informada` });
    }

    const datePart = slot.startDate ? slot.startDate.split('T')[0] : null;
    const start = datePart ? new Date(datePart + 'T00:00:00Z') : null;
    const schedPart = slot.scheduledDate ? slot.scheduledDate.split('T')[0] : null;
    const schedDate = schedPart ? new Date(schedPart + 'T00:00:00Z') : null;

    if (start && start < todayMidnight) {
      return res.status(400).json({ error: `Slot ${i + 1}: A data de início não pode ser anterior à data atual.` });
    }
    if (schedDate && schedDate < todayMidnight) {
      return res.status(400).json({ error: `Slot ${i + 1}: A data do agendamento avulso não pode ser anterior à data atual.` });
    }
  }

  try {
    // 2. Verificar conflitos dos slots contra o banco (ignora o próprio paciente atual que está tendo sua agenda resetada)
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const conflictCheck = await checkConflictInternal({
        dayOfWeek: slot.dayOfWeek,
        time: slot.time,
        duration: slot.duration || 50,
        startDate: slot.startDate ? slot.startDate.split('T')[0] : null,
        scheduledDate: slot.scheduledDate ? slot.scheduledDate.split('T')[0] : null,
        excludeId: null,
        psychologistId: req.user.id,
        excludePatientId: patientId
      });

      if (conflictCheck.hasConflict) {
        const names = conflictCheck.conflicts.map(c => c.patient?.name).join(", ");
        return res.status(400).json({ error: `Slot ${i + 1}: Conflito de horário com o(s) paciente(s): ${names}` });
      }

      // 3. Verificar conflitos internos entre os próprios slots do lote
      const toMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };
      
      const startMinutes = toMinutes(slot.time);
      const endMinutes = startMinutes + (slot.duration || 50);

      for (let j = i + 1; j < slots.length; j++) {
        const other = slots[j];
        if (slot.dayOfWeek === other.dayOfWeek) {
          const otherStart = toMinutes(other.time);
          const otherEnd = otherStart + (other.duration || 50);
          if (startMinutes < otherEnd && otherStart < endMinutes) {
            return res.status(400).json({ error: `Conflito de horários no lote entre as ${slot.time} e ${other.time}.` });
          }
        }
      }
    }
    
    // Remover horários antigos do paciente para este profissional
    await prisma.appointment.deleteMany({
      where: { patientId, psychologistId: req.user.id }
    });

    // Criar novos horários
    const newAppointments = [];
    for (const slot of slots) {
      const datePart = slot.startDate ? slot.startDate.split('T')[0] : null;
      const start = datePart ? new Date(datePart + 'T00:00:00Z') : null;
      const schedPart = slot.scheduledDate ? slot.scheduledDate.split('T')[0] : null;
      const schedDate = schedPart ? new Date(schedPart + 'T00:00:00Z') : null;
      const endPart = slot.endDate ? slot.endDate.split('T')[0] : null;
      const endDate = endPart ? new Date(endPart + 'T00:00:00Z') : null;
      
      const created = await prisma.appointment.create({
        data: {
          dayOfWeek: slot.dayOfWeek,
          time: slot.time,
          duration: slot.duration || 50,
          startDate: start,
          maxSessions: slot.maxSessions ?? null,
          scheduledDate: schedDate,
          endDate: endDate,
          skipDates: slot.skipDates ?? null,
          patientId,
          psychologistId: req.user.id
        }
      });
      newAppointments.push(created);
    }

    res.status(201).json(newAppointments);
  } catch (error) {
    console.error("Error saving appointments batch:", error);
    res.status(500).json({ error: "Erro ao salvar horários: " + error.message });
  }
});

// Verificar conflitos (para feedback em tempo real no frontend)
router.post("/check-conflict", async (req, res) => {
  const { dayOfWeek, time, duration, startDate, scheduledDate, excludePatientId } = req.body;

  if (!time || !duration) {
    return res.json({ hasConflict: false, conflicts: [] });
  }

  try {
    const result = await checkConflictInternal({
      dayOfWeek,
      time,
      duration,
      startDate,
      scheduledDate,
      excludeId: null,
      psychologistId: req.user.id,
      excludePatientId
    });

    res.json({ hasConflict: result.hasConflict, conflicts: result.conflicts });
  } catch (error) {
    console.error("Erro ao verificar conflitos:", error);
    res.status(500).json({ error: "Erro ao verificar conflito" });
  }
});

// Criar um agendamento individual
router.post("/", async (req, res) => {
  const { patientId, dayOfWeek, time, duration, startDate, maxSessions, scheduledDate, endDate, skipDates } = req.body;

  try {
    const schedPart = scheduledDate ? scheduledDate.split('T')[0] : null;
    const schedDate = schedPart ? new Date(schedPart + 'T00:00:00Z') : null;
    const startPart = startDate ? startDate.split('T')[0] : null;
    const start = startPart ? new Date(startPart + 'T00:00:00Z') : schedDate;
    const endPart = endDate ? endDate.split('T')[0] : null;
    const end = endPart ? new Date(endPart + 'T00:00:00Z') : null;

    // 1. Validar retroatividade
    const todayMidnight = getTodayUtcMidnight();
    if (start && start < todayMidnight) {
      return res.status(400).json({ error: "A data de início do agendamento não pode ser anterior à data atual." });
    }
    if (schedDate && schedDate < todayMidnight) {
      return res.status(400).json({ error: "A data do agendamento avulso não pode ser anterior à data atual." });
    }

    // 2. Validar conflitos de horários
    // Não passa excludePatientId: qualquer conflito (incluindo mesmo paciente) deve ser bloqueado
    const conflictCheck = await checkConflictInternal({
      dayOfWeek,
      time,
      duration,
      startDate: startPart,
      scheduledDate: schedPart,
      excludeId: null,
      psychologistId: req.user.id
    });

    if (conflictCheck.hasConflict) {
      const names = conflictCheck.conflicts.map(c => c.patient?.name).join(", ");
      return res.status(400).json({ error: `Conflito de horário detectado com o(s) paciente(s): ${names}` });
    }

    const created = await prisma.appointment.create({
      data: {
        dayOfWeek,
        time,
        duration,
        startDate: start,
        maxSessions: maxSessions ?? null,
        scheduledDate: schedDate,
        endDate: end,
        skipDates: skipDates ?? null,
        patientId,
        psychologistId: req.user.id
      }
    });

    res.status(201).json({
      id: created.id,
      dayOfWeek: created.dayOfWeek,
      time: created.time,
      duration: created.duration,
      startDate: created.startDate ? created.startDate.toISOString().split('T')[0] : null,
      maxSessions: created.maxSessions,
      scheduledDate: created.scheduledDate ? created.scheduledDate.toISOString().split('T')[0] : null,
      endDate: created.endDate ? created.endDate.toISOString().split('T')[0] : null,
      skipDates: created.skipDates
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ error: "Erro ao criar agendamento: " + error.message });
  }
});

// Atualizar um agendamento
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { dayOfWeek, time, duration, startDate, maxSessions, scheduledDate, endDate, skipDates } = req.body;

  try {
    const existing = await prisma.appointment.findFirst({
      where: { id, psychologistId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    const startPart = startDate ? startDate.split('T')[0] : null;
    const start = startPart ? new Date(startPart + 'T00:00:00Z') : undefined;
    const schedPart = scheduledDate ? scheduledDate.split('T')[0] : null;
    const schedDate = schedPart ? new Date(schedPart + 'T00:00:00Z') : undefined;
    const endPart = endDate ? endDate.split('T')[0] : null;
    const end = endPart ? new Date(endPart + 'T00:00:00Z') : undefined;

    // 1. Validar retroatividade
    const todayMidnight = getTodayUtcMidnight();
    if (start && start < todayMidnight) {
      return res.status(400).json({ error: "A data de início do agendamento não pode ser anterior à data atual." });
    }
    if (schedDate && schedDate < todayMidnight) {
      return res.status(400).json({ error: "A data do agendamento avulso não pode ser anterior à data atual." });
    }

    // 2. Validar conflitos de horários apenas se houver alterações de horário/data
    const isChangingTimeOrDate = 
      time !== undefined || 
      dayOfWeek !== undefined || 
      duration !== undefined || 
      startDate !== undefined || 
      scheduledDate !== undefined;

    if (isChangingTimeOrDate) {
      const finalDayOfWeek = dayOfWeek !== undefined ? dayOfWeek : existing.dayOfWeek;
      const finalTime = time !== undefined ? time : existing.time;
      const finalDuration = duration !== undefined ? duration : existing.duration;
      const finalStartDate = startPart !== null ? startPart : (existing.startDate ? existing.startDate.toISOString().split('T')[0] : null);
      const finalScheduledDate = schedPart !== null ? schedPart : (existing.scheduledDate ? existing.scheduledDate.toISOString().split('T')[0] : null);

      // Não passa excludePatientId: qualquer conflito (incluindo mesmo paciente) deve ser bloqueado
      const conflictCheck = await checkConflictInternal({
        dayOfWeek: finalDayOfWeek,
        time: finalTime,
        duration: finalDuration,
        startDate: finalStartDate,
        scheduledDate: finalScheduledDate,
        excludeId: id,
        psychologistId: req.user.id
      });

      if (conflictCheck.hasConflict) {
        const names = conflictCheck.conflicts.map(c => c.patient?.name).join(", ");
        return res.status(400).json({ error: `Conflito de horário detectado com o(s) paciente(s): ${names}` });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(time !== undefined && { time }),
        ...(duration !== undefined && { duration }),
        ...(start !== undefined && { startDate: start }),
        ...(maxSessions !== undefined && { maxSessions }),
        ...(schedDate !== undefined && { scheduledDate: schedDate }),
        ...(end !== undefined && { endDate: end }),
        ...(skipDates !== undefined && { skipDates })
      }
    });

    res.json({
      id: updated.id,
      dayOfWeek: updated.dayOfWeek,
      time: updated.time,
      duration: updated.duration,
      startDate: updated.startDate ? updated.startDate.toISOString().split('T')[0] : null,
      maxSessions: updated.maxSessions,
      scheduledDate: updated.scheduledDate ? updated.scheduledDate.toISOString().split('T')[0] : null,
      endDate: updated.endDate ? updated.endDate.toISOString().split('T')[0] : null,
      skipDates: updated.skipDates
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Erro ao atualizar agendamento: " + error.message });
  }
});

// Excluir um agendamento individual
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.appointment.findFirst({
      where: { id, psychologistId: req.user.id }
    });
    if (!existing) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }
    await prisma.appointment.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Erro ao excluir agendamento" });
  }
});

export default router;
