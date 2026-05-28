import prisma from "./prisma/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, fullName: true }
  });
  const devices = await prisma.device.findMany({
    select: { id: true, deviceName: true, deviceType: true, serialNumber: true }
  });
  console.log("INSPECTION_OUTPUT:", JSON.stringify({ users, devices }));
}

main();
