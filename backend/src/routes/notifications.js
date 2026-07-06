import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.post("/send-reminder", async (req, res) => {
  const { patientId, appointmentId, message } = req.body;
  
  if (!patientId || !appointmentId) {
    return res.status(400).json({ error: "patientId e appointmentId são obrigatórios" });
  }

  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, psychologistId: req.user.id }
    });

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId }
    });

    if (!patient || !appointment) {
      return res.status(404).json({ error: "Paciente ou Agendamento não encontrado" });
    }

    if (!patient.phone) {
      return res.status(400).json({ error: "Paciente não possui telefone cadastrado" });
    }

    const defaultMsg = `Olá ${patient.name}, aqui é do consultório de psicologia. Passando para lembrar da sua sessão agendada para amanhã, às ${appointment.time}. Por favor, confirme respondendo SIM ou NÃO.`;
    const finalMessage = message || defaultMsg;

    const whatsappUrl = process.env.WHATSAPP_API_URL;
    const whatsappToken = process.env.WHATSAPP_API_TOKEN;

    if (!whatsappUrl || !whatsappToken) {
      console.log(`[Mock WhatsApp] Enviando mensagem para ${patient.phone}: ${finalMessage}`);
      return res.json({ 
        success: true, 
        mocked: true, 
        message: "WhatsApp enviado (MOCK - variáveis de ambiente não configuradas)" 
      });
    }

    // Chamada real para Evolution API ou Z-API
    const response = await fetch(`${whatsappUrl}/message/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": whatsappToken,
        "Authorization": `Bearer ${whatsappToken}`
      },
      body: JSON.stringify({
        number: patient.phone.replace(/\D/g, ""),
        text: finalMessage
      })
    });

    const data = await response.json();
    res.json({ success: true, providerResponse: data });
  } catch (error) {
    console.error("Error sending WhatsApp reminder:", error.message);
    res.status(500).json({ error: "Erro ao enviar lembrete do WhatsApp" });
  }
});

export default router;
