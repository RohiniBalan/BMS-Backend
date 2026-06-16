import prisma from "../prisma/prisma";
import { DeviceStatus, Prisma } from "@prisma/client";

export interface DeviceFilters {
  status?: DeviceStatus;
  deviceType?: string;
  search?: string;
  userId?: string;
}

export class DeviceRepository {
  // ---------- List with filters + pagination ----------
  async findAll(filters: DeviceFilters, skip: number, take: number) {
    const where: Prisma.DeviceWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.deviceType)
      where.deviceType = { equals: filters.deviceType, mode: "insensitive" };
    if (filters.search)
      where.deviceName = { contains: filters.search, mode: "insensitive" };
    if (filters.userId) where.userId = filters.userId;
    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },

        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },

          registration: {
            select: {
              batteryType: true,
              dataSubscription: true,
              registeredAt: true,
              registrationSource: true,
    registeredById: true,
    userId: true,
            },
          },

          telemetry: {
            orderBy: {
              recordedAt: "desc",
            },
            take: 1,
          },
        },
      }),

      prisma.device.count({ where }),
    ]);
    return { devices, total };
  }

  // ---------- Single device ----------
  async findById(id: string) {
    return prisma.device.findUnique({
      where: { id },

      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },

        telemetry: {
          orderBy: {
            recordedAt: "desc",
          },
          take: 1,
        },
        registration: {
          select: {
            batteryType: true,
            dataSubscription: true,
            registeredAt: true,
            registrationSource: true,
            registeredById: true,
            userId: true,
          },
        },
      },
    });
  }

  async findBySerialNumber(serialNumber: string) {
    return prisma.device.findUnique({ where: { serialNumber } });
  }

  // ---------- Create ----------
  async create(data: Prisma.DeviceCreateInput) {
    return prisma.device.create({ data });
  }

  // ---------- Update ----------
  async update(id: string, data: Prisma.DeviceUpdateInput) {
    return prisma.device.update({ where: { id }, data });
  }

  // ---------- Delete ----------
  async delete(id: string) {
    return prisma.device.delete({ where: { id } });
  }

  // ---------- Patch status ----------
  async updateStatus(id: string, status: DeviceStatus) {
    return prisma.device.update({ where: { id }, data: { status } });
  }

  // ---------- Find non-OFFLINE devices with no telemetry in last N minutes ----------
  async findStaleDevices(staleMinutes: number) {
    const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);
    const activeDevices = await prisma.device.findMany({
      where: { status: { not: DeviceStatus.OFFLINE } },
      select: { id: true, deviceName: true },
    });
    if (activeDevices.length === 0) return [];
    const recentTelemetry = await prisma.telemetry.findMany({
      where: {
        deviceId: { in: activeDevices.map((d) => d.id) },
        recordedAt: { gte: cutoff },
      },
      select: { deviceId: true },
      distinct: ["deviceId"],
    });
    const recentIds = new Set(recentTelemetry.map((t) => t.deviceId));
    return activeDevices.filter((d) => !recentIds.has(d.id));
  }

  // ---------- Map endpoint (only devices with coords) ----------
  async findWithCoordinates() {
    return prisma.device.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        deviceName: true,
        latitude: true,
        longitude: true,
        locationName: true,
        status: true,
        // latest telemetry — nested subquery via Prisma relation ordering
        telemetry: {
          orderBy: { recordedAt: "desc" },
          take: 1,
          select: { soc: true },
        },
      },
    });
  }
}
