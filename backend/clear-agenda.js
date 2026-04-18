import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpeza da agenda...');
  
  const deletedAttendances = await prisma.attendance.deleteMany({});
  console.log(`${deletedAttendances.count} registros de presença removidos.`);
  
  const deletedAppointments = await prisma.appointment.deleteMany({});
  console.log(`${deletedAppointments.count} agendamentos fixos removidos.`);
  
  console.log('Limpeza concluída com sucesso!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
