import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Configuração de segurança
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Storage seguro
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "attachments"));
  },
  filename: (req, file, cb) => {
    // Gerar nome único e seguro
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não permitido. Use PDF, JPG, PNG ou DOC."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE }
});

// Criar diretório de uploads se não existir
import fs from "fs";
const uploadDir = path.join(process.cwd(), "uploads", "attachments");
if (!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Upload de arquivo
router.post("/:patientId/attachments", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const { patientId } = req.params;
    const userId = req.user.id;

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, psychologistId: userId }
    });

    if (!patient) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        patientId,
        uploadedBy: userId
      }
    });

    res.json({
      id: attachment.id,
      filename: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      createdAt: attachment.createdAt
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Upload error:", error);
    res.status(500).json({ error: "Erro ao salvar arquivo" });
  }
});

// Listar anexos de um paciente
router.get("/patient/:patientId", authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;

    // Verificar propriedade
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, psychologistId: userId }
    });

    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    const attachments = await prisma.attachment.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" }
    });

    res.json(attachments.map(a => ({
      id: a.id,
      filename: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      createdAt: a.createdAt
    })));
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({ error: "Erro ao listar arquivos" });
  }
});

// Download de arquivo
router.get("/attachments/:id/download", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!attachment) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }

    // Verificar propriedade
    if (attachment.patient.psychologistId !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const filePath = path.join(uploadDir, attachment.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
    }

    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.originalName}"`);
    res.setHeader("Content-Length", attachment.size);

    // Streaming seguro - não usar path traversal
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// Deletar anexo
router.delete("/attachments/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!attachment) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }

    // Verificar propriedade
    if (attachment.patient.psychologistId !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Remover arquivo físico
    const filePath = path.join(uploadDir, attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remover do banco
    await prisma.attachment.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Erro ao deletar arquivo" });
  }
});

export default router;
