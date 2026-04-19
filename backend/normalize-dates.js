import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando normalização de Attendances...');
  
  const all = await prisma.attendance.findMany();
  
  for (const att of all) {
    const norm = new Date(att.date);
    norm.setUTCHours(0, 0, 0, 0);
    
    // Se a data não estiver normalizada, atualiza
    if (att.date.getTime() !== norm.getTime()) {
      try {
        await prisma.attendance.update({
          where: { id: att.id },
          data: { date: norm }
        });
        console.log(`Registro ${att.id} normalizado.`);
      } catch (e) {
        console.log(`Conflito ao normalizar ${att.id} (provável duplicata), removendo...`);
        await prisma.attendance.delete({ where: { id: att.id } });
      }
    }
  }
  
  console.log('Normalização concluída!');
}

main().finally(() => prisma.$disconnect());
