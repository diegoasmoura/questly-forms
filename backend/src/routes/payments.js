import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// Listar todos os pagamentos do profissional
router.get("/", async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { psychologistId: req.user.id },
      include: {
        patient: { select: { name: true } },
        attendances: { select: { date: true, status: true } },
        receiptAttachment: true
      },
      orderBy: { paymentDate: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar pagamentos" });
  }
});

// Listar pagamentos de um paciente específico
router.get("/patient/:patientId", async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { 
        patientId: req.params.patientId,
        psychologistId: req.user.id
      },
      include: {
        attendances: { 
          select: { id: true, date: true, status: true, sessionTime: true },
          orderBy: { date: 'asc' }
        },
        receiptAttachment: { select: { id: true, filename: true, originalName: true, mimeType: true, size: true } }
      },
      orderBy: { paymentDate: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar pagamentos do paciente" });
  }
});

// Registrar um novo pagamento (bloco de sessões)
router.post("/", async (req, res) => {
  const { patientId, amount, paymentDate, method, notes, attendanceIds, receiptIssued } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o registro de pagamento
      const payment = await tx.payment.create({
        data: {
          patientId,
          amount: parseFloat(amount),
          paymentDate: new Date(paymentDate),
          method,
          notes,
          receiptIssued: receiptIssued || false,
          receiptAttachmentId: req.body.receiptAttachmentId || null,
          psychologistId: req.user.id
        }
      });

      // 2. Vincular as sessões ao pagamento
      if (attendanceIds && attendanceIds.length > 0) {
        await tx.attendance.updateMany({
          where: {
            id: { in: attendanceIds },
            patientId,
            psychologistId: req.user.id
          },
          data: { paymentId: payment.id }
        });
      }

      return payment;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    res.status(500).json({ error: "Erro ao registrar pagamento" });
  }
});

// Atualizar um pagamento
router.put("/:id", async (req, res) => {
  const { amount, paymentDate, method, notes, receiptIssued, attendanceIds } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar dados básicos
      const payment = await tx.payment.update({
        where: { id: req.params.id, psychologistId: req.user.id },
        data: {
          amount: parseFloat(amount),
          paymentDate: new Date(paymentDate),
          method,
          notes,
          receiptIssued,
          receiptAttachmentId: req.body.receiptAttachmentId || null
        }
      });

      // 2. Se informou novos IDs de sessão, atualiza os vínculos
      if (attendanceIds) {
        // Primeiro remove vínculos antigos
        await tx.attendance.updateMany({
          where: { paymentId: req.params.id },
          data: { paymentId: null }
        });

        // Adiciona novos vínculos
        if (attendanceIds.length > 0) {
          await tx.attendance.updateMany({
            where: { id: { in: attendanceIds } },
            data: { paymentId: req.params.id }
          });
        }
      }

      return payment;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar pagamento" });
  }
});

// Deletar um pagamento
router.delete("/:id", async (req, res) => {
  try {
    // Ao deletar o pagamento, os attendances vinculados voltam para paymentId: null (onDelete: SetNull)
    await prisma.payment.delete({
      where: { id: req.params.id, psychologistId: req.user.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar pagamento" });
  }
});

export default router;
