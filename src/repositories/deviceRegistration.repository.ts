import prisma from "../prisma/prisma";
import { BatteryType } from "@prisma/client";

export class DeviceRegistrationRepository {
  async findByDeviceId(deviceId: string) {
    return prisma.deviceRegistration.findUnique({
      where: { deviceId },
    });
  }

  async create(data: {
    deviceId: string;
    userId: string;
    deviceName: string;
    dataSubscription: string;
    batteryType: BatteryType;
    registrationSource: string;
  }) {
    return prisma.deviceRegistration.create({
      data,
    });
  }

  async findByUserId(userId: string) {
  return prisma.deviceRegistration.findMany({
    where: { userId },
    orderBy: {
      registeredAt: "desc",
    },
  });
}
}