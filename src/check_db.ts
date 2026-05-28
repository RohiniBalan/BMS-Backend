import prisma from "./prisma/prisma";

async function main() {
  try {
    const userCount = await prisma.user.count();
    const deviceCount = await prisma.device.count();
    const telemetryCount = await prisma.telemetry.count();
    const alertCount = await prisma.alert.count();
    const chemistryCount = await prisma.batteryChemistry.count();
    const configCount = await prisma.chemistryConfig.count();
    const thermalCount = await prisma.thermalSafety.count();
    
    console.log("DB_STATUS_OUTPUT:", JSON.stringify({
      status: "connected",
      userCount,
      deviceCount,
      telemetryCount,
      alertCount,
      chemistryCount,
      configCount,
      thermalCount,
    }));
  } catch (err: any) {
    console.error("Database connection error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
