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
        patient: { select: { id: true, name: true } },
        payment: { select: { receiptIssued: true } }
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
        patient: { select: { id: true, name: true } },
        payment: { select: { receiptIssued: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Erro ao filtrar attendances" });
  }
});

// Função recursiva para buscar todos os descendentes
async function getDescendants(id) {
  const children = await prisma.attendance.findMany({
    where: { parentId: id }
  });
  
  let descendants = [...children];
  for (const child of children) {
    const childDescendants = await getDescendants(child.id);
    descendants = [...descendants, ...childDescendants];
  }
  return descendants;
}

// Buscar contagem e info de descendentes
router.get("/:id/descendants", async (req, res) => {
  try {
    const descendants = await getDescendants(req.params.id);
    res.json({
      count: descendants.length,
      descendants: descendants.map(d => ({ id: d.id, date: d.date }))
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar descendentes" });
  }
});

// Registrar presença/falta
router.post("/", async (req, res) => {
  const { patientId, date, status, notes, sessionTime, parentId } = req.body;
  
  try {
    // Extrair apenas a data (YYYY-MM-DD) para evitar problemas de fuso horário
    const dateOnly = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
    const normalizedDate = new Date(dateOnly + 'T00:00:00Z');

    const existing = await prisma.attendance.findFirst({
      where: {
        patientId,
        date: normalizedDate,
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
        date: normalizedDate,
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

// Deletar attendance (Reset com Cascade)
router.delete("/:id", async (req, res) => {
  try {
    const recordToDelete = await prisma.attendance.findUnique({
      where: { id: req.params.id },
      select: { parentId: true, status: true }
    });

    if (!recordToDelete) {
      return res.status(404).json({ error: "Registro não encontrado" });
    }

    // Se tiver um pai, limpamos a menção ao reagendamento nas notas do pai
    if (recordToDelete.parentId) {
      const parent = await prisma.attendance.findUnique({
        where: { id: recordToDelete.parentId }
      });

      if (parent && parent.notes) {
        // Remover a parte "Reagendado para ..." das notas
        const notesParts = parent.notes.split(/Reagendado para/i);
        const cleanNotes = notesParts[0].trim();
        
        await prisma.attendance.update({
          where: { id: parent.id },
          data: { 
            notes: cleanNotes || "Falta justificada (reagendamento cancelado)." 
          }
        });
      }
    }

    // A deleção aqui disparará o onDelete: Cascade no banco para todos os filhos
    await prisma.attendance.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar attendance:", error);
    res.status(500).json({ error: "Erro ao deletar registro" });
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