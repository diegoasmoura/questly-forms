import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import formRoutes from "./routes/forms.js";
import responseRoutes from "./routes/responses.js";
import shareRoutes from "./routes/share.js";
import patientRoutes from "./routes/patients.js";
import attachmentRoutes from "./routes/attachments.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://localhost:3002',
  'http://localhost:3005',
  'http://127.0.0.1:5173', 
  'http://127.0.0.1:3000', 
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3005'
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    if (!allowedOrigins.includes(origin.trim())) {
      allowedOrigins.push(origin.trim());
    }
  });
}

app.use(cors({
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/responses", responseRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/patients", attachmentRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Origem não permitida') {
    return res.status(403).json({ error: 'Acesso não permitido' });
  }
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
