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
    userId: string | null;
    registeredById: string;
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

    include: {
      device: {
        include: {
          telemetry: {
            orderBy: {
              recordedAt: "desc",
            },
            take: 1,
          },
        },
      },
    },

    orderBy: {
      registeredAt: "desc",
    },
  });
}

async updateByDeviceId(deviceId: string, data: any) {
  return prisma.deviceRegistration.update({
    where: { deviceId },
    data,
  });
}

async deleteByDeviceId(deviceId: string) {
  return prisma.deviceRegistration.delete({
    where: { deviceId },
  });
}
}