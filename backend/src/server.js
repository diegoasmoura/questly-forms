import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import formRoutes from "./routes/forms.js";
import responseRoutes from "./routes/responses.js";
import shareRoutes from "./routes/share.js";
import patientRoutes from "./routes/patients.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/responses", responseRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/patients", patientRoutes);

// Public form access
app.get("/api/share/:token", async (req, res) => {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { token: req.params.token },
      include: { form: true },
    });
    if (!shareLink || !shareLink.active) {
      return res.status(404).json({ error: "Link not found or expired" });
    }
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return res.status(410).json({ error: "Link expired" });
    }
    res.json({
      formId: shareLink.form.id,
      title: shareLink.form.title,
      schema: shareLink.form.schema,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
});

// Submit response via share link
app.post("/api/share/:token/submit", async (req, res) => {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { token: req.params.token },
    });
    if (!shareLink || !shareLink.active) {
      return res.status(404).json({ error: "Link not found or expired" });
    }
    const response = await prisma.response.create({
      data: {
        formId: shareLink.formId,
        patientId: shareLink.patientId,
        data: req.body,
      },
    });
    res.json({ success: true, responseId: response.id });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
