import prisma from "./src/db.js";

async function test() {
  const psychologistId = "2e28d512-b907-453e-85e2-3e66b10af1f4";
  const testData = {
    name: "DIEGO ANGELO SANJOS DE MOURA",
    email: "diego@test.com",
    phone: "(34) 98886-1577",
    birthDate: "1990-01-01",
    cpf: "087.346.876-70",
    rg: "",
    gender: "Masculino",
    maritalStatus: "Solteiro(a)",
    profession: "Dev",
    cep: "38400-000",
    street: "Rua Teste",
    number: "123",
    complement: "",
    neighborhood: "Bairro",
    city: "Uberlândia",
    state: "MG",
    emergencyName: "",
    emergencyPhone: "",
    notes: "Teste de salvamento"
  };

  try {
    console.log("Iniciando teste de criação de paciente...");
    
    // Simular a limpeza que o backend faz
    const cleanData = {};
    Object.keys(testData).forEach(key => {
      cleanData[key] = testData[key] === "" ? null : testData[key];
    });

    if (cleanData.birthDate) {
      cleanData.birthDate = new Date(cleanData.birthDate);
    }

    const patient = await prisma.patient.create({
      data: {
        ...cleanData,
        psychologistId
      }
    });

    console.log("✅ Sucesso! Paciente criado com ID:", patient.id);
    
    // Limpar o teste
    await prisma.patient.delete({ where: { id: patient.id } });
    console.log("✅ Teste limpo com sucesso.");

  } catch (error) {
    console.error("❌ ERRO NO PRISMA:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
