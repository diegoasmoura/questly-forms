import prisma from "./src/db.js";

async function simulate() {
  const psychologistId = "2e28d512-b907-453e-85e2-3e66b10af1f4";
  
  // Exatamente o que o frontend envia quando os campos estão vazios
  const payload = {
    name: "PACIENTE TESTE FAKE",
    email: "",
    phone: "(34) 99999-9999",
    birthDate: "", // String vazia vinda do <input type="date">
    cpf: "111.222.333-44",
    rg: "",
    gender: "",
    maritalStatus: "",
    profession: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    emergencyName: "",
    emergencyPhone: "",
    notes: ""
  };

  try {
    console.log("Simulando rota POST /patients...");
    
    // Lógica que está no router
    const data = payload;
    const cleanData = {};
    Object.keys(data).forEach(key => {
      let value = data[key] === "" ? null : data[key];
      if (value && (key === "cpf" || key === "phone" || key === "emergencyPhone" || key === "cep")) {
        value = value.replace(/\D/g, "");
      }
      cleanData[key] = value;
    });

    if (cleanData.birthDate) {
      const date = new Date(cleanData.birthDate);
      cleanData.birthDate = isNaN(date.getTime()) ? null : date;
    }

    console.log("Dados limpos para o Prisma:", cleanData);

    const patient = await prisma.patient.create({
      data: {
        ...cleanData,
        psychologistId
      }
    });

    console.log("✅ SUCESSO! Paciente criado:", patient.id);
    await prisma.patient.delete({ where: { id: patient.id } });

  } catch (error) {
    console.error("❌ ERRO CAPTURADO NO TESTE:");
    console.log(error.message);
    if (error.code) console.log("Código Prisma:", error.code);
  } finally {
    await prisma.$disconnect();
  }
}

simulate();
