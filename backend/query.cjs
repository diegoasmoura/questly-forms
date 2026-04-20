const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const attendances = await prisma.attendance.findMany({
    where: { patientId: 'f1682a16-aeea-4611-8aaa-f311d835cb97' },
    orderBy: { date: 'desc' },
    take: 10,
    select: { id: true, date: true, status: true, sessionTime: true, notes: true }
  });
  console.log(JSON.stringify(attendances, null, 2));
  await prisma.$disconnect();
}

main();