import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const loginAttempts = new Map();

function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `login:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  const record = loginAttempts.get(key) || { count: 0, firstAttempt: now };

  if (now - record.firstAttempt > windowMs) {
    record.count = 1;
    record.firstAttempt = now;
  } else {
    record.count++;
  }

  loginAttempts.set(key, record);

  if (record.count > maxAttempts) {
    const remainingTime = Math.ceil((windowMs - (now - record.firstAttempt)) / 1000 / 60);
    return res.status(429).json({ 
      error: `Muitas tentativas. Tente novamente em ${remainingTime} minutos.` 
    });
  }

  next();
}

router.post("/register", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "E-mail inválido" });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(500).json({ error: "Erro interno. Tente novamente." });
  }
});

router.post("/login", rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(500).json({ error: "Erro interno. Tente novamente." });
  }
});

router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token não fornecido" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ user });
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });
    res.json({ user });
  } catch (error) {
    console.error("Profile update error:", error.message);
    console.error("Profile update stack:", error.stack);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

// Avatar upload
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "avatars"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato não permitido. Use JPG, PNG ou WebP."), false);
    }
  }
});

router.post("/avatar", authMiddleware, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
    res.json({ user });
  } catch (error) {
    console.error("Avatar upload error:", error.message);
    res.status(500).json({ error: "Erro ao fazer upload do avatar" });
  }
});

export default router;
