import { Router } from "express";
import prisma from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { psychologistId: req.user.id },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { responses: true, shareLinks: true }
        },
        attendances: {
          select: { status: true }
        }
      }
    });

    // Process attendances to get counts per status
    const patientsWithStats = patients.map(patient => {
      const stats = {
        presente: 0,
        falta: 0,
        justificada: 0
      };

      patient.attendances.forEach(att => {
        if (stats.hasOwnProperty(att.status)) {
          stats[att.status]++;
        }
      });

      // Remove the full attendances list to keep the response light
      const { attendances, ...patientData } = patient;
      return {
        ...patientData,
        attendanceStats: stats
      };
    });

    res.json(patientsWithStats);
  } catch (error) {
    console.error("Error listing patients:", error.message);
    res.status(500).json({ error: "Erro ao buscar pacientes" });
  }
});

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
          }
        }
      }
    });
    if (!patient) return res.status(404).json({ error: "Paciente não encontrado" });
    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error.message);
    res.status(500).json({ error: "Erro ao buscar paciente" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    const requiredFields = {
      name: "Nome",
      cpf: "CPF",
      birthDate: "Data de Nascimento",
      email: "E-mail",
      phone: "Telefone",
      emergencyName: "Nome do Contato de Emergência",
      emergencyPhone: "Telefone de Emergência"
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!data[field]) {
        return res.status(400).json({ error: `${label} é obrigatório` });
      }
    }

    const insertData = {
      psychologistId: req.user.id,
      name: data.name.trim()
    };

    const allowedFields = [
      "email", "phone", "birthDate", "notes", "cpf", "rg", 
      "gender", "maritalStatus", "profession", "cep", "street", 
      "number", "complement", "neighborhood", "city", "state",
      "emergencyName", "emergencyPhone", "sessionTime", "sessionDuration", 
      "sessionFrequency", "nextSession"
    ];
    
    const fieldsToNormalize = ["cpf", "phone", "emergencyPhone", "cep"];
    
    allowedFields.forEach(key => {
      let value = data[key];
      
      if (value === "" || value === null || value === undefined) return;

      if (typeof value === "string") {
        value = value.trim();
        if (value === "") return;
      }

      if (fieldsToNormalize.includes(key)) {
        value = value.replace(/\D/g, "");
      }

      if (key === "birthDate" || key === "nextSession") {
        const date = new Date(value);
        if (isNaN(date.getTime())) return;
        value = date;
      }

      if (key === "sessionDuration") {
        value = parseInt(value, 10);
        if (isNaN(value)) return;
      }

      insertData[key] = value;
    });

    const patient = await prisma.patient.create({
      data: insertData
    });
    
    res.status(201).json(patient);
  } catch (error) {
    console.error("Error creating patient:", error.code, error.message);
    
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      const field = target.includes('email') ? 'e-mail' : target.includes('cpf') ? 'CPF' : 'dados';
      return res.status(400).json({ 
        error: `Um paciente com este ${field} já está cadastrado.` 
      });
    }
    
    res.status(500).json({ error: error.message || "Erro ao salvar paciente" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const data = req.body;
    console.log("PUT /patients/:id - received data:", JSON.stringify(data, null, 2));
    
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, psychologistId: req.user.id },
    });
    if (!patient) return res.status(404).json({ error: "Paciente não encontrado" });

    const requiredFields = {
      name: "Nome",
      cpf: "CPF",
      birthDate: "Data de Nascimento",
      email: "E-mail",
      phone: "Telefone",
      emergencyName: "Nome do Contato de Emergência",
      emergencyPhone: "Telefone de Emergência"
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (data.hasOwnProperty(field) && !data[field]) {
        return res.status(400).json({ error: `${label} não pode ser vazio` });
      }
    }

    const allowedFields = [
      "name", "email", "phone", "birthDate", "notes", "cpf", "rg",
      "gender", "maritalStatus", "profession", "cep", "street",
      "number", "complement", "neighborhood", "city", "state",
      "emergencyName", "emergencyPhone", "isActive", "inactivatedAt",
      "sessionTime", "sessionDuration", "sessionFrequency", "nextSession"
    ];

    const cleanData = {};
    allowedFields.forEach(key => {
      if (data.hasOwnProperty(key)) {
        cleanData[key] = data[key] === "" ? null : data[key];
      }
    });
    
    console.log("cleanData after processing:", JSON.stringify(cleanData, null, 2));

    if (cleanData.hasOwnProperty('birthDate')) {
      if (!cleanData.birthDate) {
        cleanData.birthDate = null;
      } else {
        const date = new Date(cleanData.birthDate);
        cleanData.birthDate = isNaN(date.getTime()) ? null : date;
      }
    }

    if (cleanData.hasOwnProperty('nextSession')) {
      if (!cleanData.nextSession) {
        cleanData.nextSession = null;
      } else {
        const date = new Date(cleanData.nextSession);
        cleanData.nextSession = isNaN(date.getTime()) ? null : date;
      }
    }

    if (cleanData.sessionDuration) {
      cleanData.sessionDuration = parseInt(cleanData.sessionDuration, 10);
      if (isNaN(cleanData.sessionDuration)) {
        cleanData.sessionDuration = null;
      }
    }

    // Handle isActive toggle
    if (data.isActive === false && patient.isActive !== false) {
      cleanData.inactivatedAt = new Date();
    } else if (data.isActive === true) {
      cleanData.inactivatedAt = null;
    }

    const updated = await prisma.patient.update({
      where: { id: req.params.id },
      data: cleanData,
    });
    console.log("Updated patient from DB:", JSON.stringify(updated, null, 2));
    res.json(updated);
  } catch (error) {
    console.error("Error updating patient:", error);
    
    if (error.code === 'P2002') {
      const target = error.meta?.target || [];
      const field = target.includes('email') ? 'e-mail' : target.includes('cpf') ? 'CPF' : 'dados';
      return res.status(400).json({ 
        error: `Um paciente com este ${field} já está cadastrado.` 
      });
    }
    
    res.status(500).json({ error: error.message || "Erro ao atualizar paciente" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, psychologistId: req.user.id },
    });
    if (!patient) return res.status(404).json({ error: "Paciente não encontrado" });
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error.message);
    res.status(500).json({ error: "Erro ao excluir paciente" });
  }
});

export default router;
