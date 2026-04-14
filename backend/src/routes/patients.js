import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// All routes require auth
router.use(authMiddleware);

// List patients
router.get("/", async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { psychologistId: req.user.id },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { responses: true }
        }
      }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single patient with history
router.get("/:id", async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, psychologistId: req.user.id },
      include: {
        responses: {
          include: {
            form: {
              select: { 
                title: true,
                schema: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        shareLinks: {
          include: {
            form: {
              select: { 
                title: true,
                schema: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create patient
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    if (!data.name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Clean and Normalize Data - STRICT SCHEMA ENFORCEMENT
    const insertData = {
      psychologistId: req.user.id,
      name: data.name
    };

    // Explicitly allow only these fields from the request
    const allowedFields = [
      "email", "phone", "birthDate", "notes", "cpf", "rg", 
      "gender", "maritalStatus", "profession", "cep", "street", 
      "number", "complement", "neighborhood", "city", "state",
      "emergencyName", "emergencyPhone"
    ];
    
    const fieldsToNormalize = ["cpf", "phone", "emergencyPhone", "cep"];
    
    allowedFields.forEach(key => {
      let value = data[key];
      
      if (value === "" || value === null || value === undefined) return;

      if (typeof value === "string") {
        value = value.trim();
        if (value === "") return;
      }

      // Normalization
      if (fieldsToNormalize.includes(key)) {
        value = value.replace(/\D/g, "");
      }

      if (key === "birthDate") {
        const date = new Date(value);
        if (isNaN(date.getTime())) return;
        value = date;
      }

      insertData[key] = value;
    });

    console.log("DEBUG - Tentando criar com:", JSON.stringify(insertData, null, 2));

    const patient = await prisma.patient.create({
      data: insertData
    });
    
    console.log("Paciente criado com sucesso:", patient.id);
    res.status(201).json(patient);
  } catch (error) {
    console.error("ERRO CRÍTICO NA CRIAÇÃO DE PACIENTE:");
    console.error("- Código:", error.code);
    console.error("- Mensagem:", error.message);
    console.error("- Meta:", error.meta);
    
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      const field = target.includes('email') ? 'e-mail' : target.includes('cpf') ? 'CPF' : 'dados';
      return res.status(400).json({ 
        error: `Um paciente com este ${field} já está cadastrado no seu sistema.`,
        details: error.meta
      });
    }
    
    res.status(500).json({ 
      error: "Erro ao salvar no banco de dados", 
      message: error.message,
      code: error.code
    });
  }
});

// Update patient
router.put("/:id", async (req, res) => {
  try {
    const data = req.body;
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, psychologistId: req.user.id },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Convert empty strings to null
    const cleanData = {};
    Object.keys(data).forEach(key => {
      cleanData[key] = data[key] === "" ? null : data[key];
    });

    // Handle birthDate specifically
    if (cleanData.birthDate) {
      const date = new Date(cleanData.birthDate);
      cleanData.birthDate = isNaN(date.getTime()) ? null : date;
    }

    const updated = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...cleanData,
        id: undefined,
        psychologistId: undefined
      },
    });
    res.json(updated);
  } catch (error) {
    console.error("Patient Update Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete patient
router.delete("/:id", async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, psychologistId: req.user.id },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
