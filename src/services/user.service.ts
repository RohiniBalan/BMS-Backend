import prisma from "../config/prisma";

export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    include: {
      devices: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    status: user.isActive ? "Active" : "Inactive",
    assignedDevices: user.devices.length,
    lastLoginAt: user.lastLoginAt,
  }));
};