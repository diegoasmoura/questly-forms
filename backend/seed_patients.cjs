const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const firstNames = ['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiana', 'Victor', 'Yasmin'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "diego.angelosantos@hotmail.com" } });
  
  if (!user) {
    console.error("Nenhum usuário (psicólogo) encontrado no banco. Cadastre-se primeiro.");
    process.exit(1);
  }

  console.log(`Usuário encontrado: ${user.name} (${user.id})`);
  console.log("Gerando 30 pacientes fictícios...");

  const newPatients = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[getRandomInt(0, firstNames.length - 1)];
    const lastName = lastNames[getRandomInt(0, lastNames.length - 1)];
    const name = `${firstName} ${lastName}`;
    
    // Aniversário aleatório entre 15 e 60 anos atrás
    const birthDate = getRandomDate(new Date(currentDate.getFullYear() - 60, 0, 1), new Date(currentDate.getFullYear() - 15, 0, 1));
    
    const isActive = Math.random() > 0.2; // 80% chance of being active
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(1, 99)}@example.com`;
    const phone = `119${getRandomInt(10000000, 99999999)}`;
    
    newPatients.push({
      name,
      email,
      phone,
      birthDate,
      isActive,
      psychologistId: user.id,
      funnelStep: "active",
      sessionDuration: 50,
    });
  }

  let createdCount = 0;

  for (const p of newPatients) {
    const patient = await prisma.patient.create({ data: p });
    createdCount++;

    // Gerar Attendances (Sessões e Faltas)
    const totalSessions = getRandomInt(0, 15);
    for(let s = 0; s < totalSessions; s++) {
      const isFalta = Math.random() < 0.15; // 15% de chance de falta
      await prisma.attendance.create({
        data: {
          patientId: patient.id,
          psychologistId: user.id,
          date: getRandomDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1), currentDate),
          status: isFalta ? 'falta' : 'presente'
        }
      });
    }

    // Gerar Appointment se estiver ativo e sorteio der chance de ter retorno
    if (patient.isActive && Math.random() > 0.3) {
      const dayOfWeek = getRandomInt(1, 5); // Seg a Sex
      const time = `${getRandomInt(8, 18).toString().padStart(2, '0')}:00`;
      
      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          psychologistId: user.id,
          dayOfWeek,
          time,
          duration: 50,
          startDate: currentDate
        }
      });
    }
  }

  console.log(`${createdCount} pacientes criados com sucesso com dados de sessão!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
