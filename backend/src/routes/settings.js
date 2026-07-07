import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Campos permitidos para atualização via settings
const CLINIC_FIELDS = [
  "clinicName",
  "crp",
  "clinicPhone",
  "clinicAddress",
  "clinicLogo",
  "therapeuticApproach",
];

const AGENDA_FIELDS = [
  "sessionDuration",
  "sessionInterval",
  "workStartTime",
  "workEndTime",
  "workDays",
  "timezone",
];

const ALLOWED_FIELDS = [...CLINIC_FIELDS, ...AGENDA_FIELDS];

// GET /api/settings — retorna configurações do usuário autenticado
router.get("/", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        clinicName: true,
        crp: true,
        clinicPhone: true,
        clinicAddress: true,
        clinicLogo: true,
        therapeuticApproach: true,
        sessionDuration: true,
        sessionInterval: true,
        workStartTime: true,
        workEndTime: true,
        workDays: true,
        timezone: true,
        bookingSlug: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Settings fetch error:", error.message);
    res.status(500).json({ error: "Erro ao carregar configurações" });
  }
});

// PUT /api/settings — atualiza configurações do usuário
router.put("/", async (req, res) => {
  try {
    const data = {};

    for (const [key, value] of Object.entries(req.body)) {
      if (!ALLOWED_FIELDS.includes(key)) continue;

      // Validações por tipo de campo
      if (key === "sessionDuration" || key === "sessionInterval") {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed) || parsed < 0 || parsed > 240) continue;
        data[key] = parsed;
      } else if (key === "workDays") {
        // Deve ser array de inteiros 0-6
        if (!Array.isArray(value)) continue;
        const valid = value.every(
          (d) => Number.isInteger(d) && d >= 0 && d <= 6
        );
        if (!valid) continue;
        data[key] = value;
      } else if (key === "workStartTime" || key === "workEndTime") {
        // Validar formato HH:MM
        if (!/^\d{2}:\d{2}$/.test(value)) continue;
        data[key] = value;
      } else {
        // String fields — sanitizar
        data[key] = typeof value === "string" ? value.trim() : value;
      }
    }

    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhum campo válido para atualizar" });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        clinicName: true,
        crp: true,
        clinicPhone: true,
        clinicAddress: true,
        clinicLogo: true,
        therapeuticApproach: true,
        sessionDuration: true,
        sessionInterval: true,
        workStartTime: true,
        workEndTime: true,
        workDays: true,
        timezone: true,
        bookingSlug: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Settings update error:", error.message);
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

export default router;
