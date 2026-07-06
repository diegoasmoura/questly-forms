import { Router } from "express";
import prisma from "../db.js";

const router = Router();

// GET /api/booking/:slug - Obter configuração e horários disponíveis
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const { date } = req.query; // YYYY-MM-DD

  try {
    const user = await prisma.user.findUnique({
      where: { bookingSlug: slug },
      include: {
        bookingConfig: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Profissional não encontrado" });
    }

    // Fallback: se o profissional existe mas não tem config, cria uma padrão
    let bookingConfig = user.bookingConfig;
    if (!bookingConfig) {
      bookingConfig = await prisma.bookingConfig.create({
        data: {
          userId: user.id,
          active: true,
          slotDuration: 50,
          workingDays: [
            { dayOfWeek: 1, start: "08:00", end: "18:00" },
            { dayOfWeek: 2, start: "08:00", end: "18:00" },
            { dayOfWeek: 3, start: "08:00", end: "18:00" },
            { dayOfWeek: 4, start: "08:00", end: "18:00" },
            { dayOfWeek: 5, start: "08:00", end: "18:00" }
          ]
        }
      });
    }

    if (!bookingConfig.active) {
      return res.status(400).json({ error: "Agendamento online desativado para este profissional" });
    }

    const workingDays = bookingConfig.workingDays || [];

    let availableSlots = [];
    if (date) {
      const targetDate = new Date(date + "T00:00:00");
      const dayOfWeek = targetDate.getDay();

      const configDay = workingDays.find(d => d.dayOfWeek === dayOfWeek);
      if (configDay) {
        const slots = [];
        let [startH, startM] = configDay.start.split(":").map(Number);
        let [endH, endM] = configDay.end.split(":").map(Number);

        let current = new Date(targetDate);
        current.setHours(startH, startM, 0, 0);
        const limit = new Date(targetDate);
        limit.setHours(endH, endM, 0, 0);

        while (current < limit) {
          const timeStr = `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`;
          slots.push(timeStr);
          current.setMinutes(current.getMinutes() + bookingConfig.slotDuration + 10);
        }

        const occupiedAppointments = await prisma.appointment.findMany({
          where: {
            psychologistId: user.id
          }
        });

        availableSlots = slots.filter(slotTime => {
          const hasConflict = occupiedAppointments.some(app => {
            if (app.time !== slotTime) return false;
            
            if (app.scheduledDate) {
              return app.scheduledDate.toISOString().split("T")[0] === date;
            }
            
            if (app.dayOfWeek !== dayOfWeek) return false;
            if (app.startDate && date < app.startDate.toISOString().split("T")[0]) return false;
            if (app.endDate && date > app.endDate.toISOString().split("T")[0]) return false;
            if (app.skipDates && Array.isArray(app.skipDates) && app.skipDates.includes(date)) return false;
            
            return true;
          });
          return !hasConflict;
        });
      }
    }

    res.json({
      psychologist: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl
      },
      config: {
        slotDuration: bookingConfig.slotDuration,
        workingDays
      },
      availableSlots
    });
  } catch (error) {
    console.error("Error fetching booking details:", error.message);
    res.status(500).json({ error: "Erro ao buscar dados de agendamento" });
  }
});

// POST /api/booking/:slug - Realizar agendamento
router.post("/:slug", async (req, res) => {
  const { slug } = req.params;
  const { patientName, patientEmail, patientPhone, date, time } = req.body;

  if (!patientName || !patientEmail || !patientPhone || !date || !time) {
    return res.status(400).json({ error: "Todos os campos do paciente, data e hora são obrigatórios" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { bookingSlug: slug },
      include: { bookingConfig: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Profissional não encontrado" });
    }

    let patient = await prisma.patient.findFirst({
      where: {
        email: patientEmail,
        psychologistId: user.id
      }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: patientName.trim(),
          email: patientEmail.trim(),
          phone: patientPhone.replace(/\D/g, ""),
          funnelStep: "triagem",
          leadSource: "Agendamento Online",
          psychologistId: user.id
        }
      });
    }

    const targetDate = new Date(date + "T" + time + ":00");
    const dayOfWeek = targetDate.getDay();

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        psychologistId: user.id,
        dayOfWeek,
        time,
        duration: user.bookingConfig?.slotDuration || 50,
        startDate: new Date(date + "T00:00:00"),
        scheduledDate: targetDate
      }
    });

    res.status(201).json({
      success: true,
      message: "Consulta agendada com sucesso!",
      appointment
    });
  } catch (error) {
    console.error("Error creating booking appointment:", error.message);
    res.status(500).json({ error: "Erro ao realizar agendamento de consulta" });
  }
});

export default router;
