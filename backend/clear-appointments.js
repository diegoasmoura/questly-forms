import prisma from "./src/db.js";

async function clearSessions() {
  try {
    await prisma.patient.updateMany({
      data: {
        sessionTime: null,
        sessionDuration: null,
        sessionFrequency: null,
        nextSession: null
      }
    });
    console.log("All patient session fields cleared!");
    
    await prisma.appointment.deleteMany({});
    console.log("All appointments deleted!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSessions();