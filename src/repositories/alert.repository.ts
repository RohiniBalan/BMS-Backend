import prisma from "../prisma/prisma";
import { AlertSeverity, AlertType, Prisma } from "@prisma/client";

export interface AlertFilters {
  isResolved?: boolean;
  severity?: AlertSeverity;
  alertType?: AlertType;
  deviceId?: string;
}

export class AlertRepository {
  // ---------- List with filters + pagination ----------
  async findAll(filters: AlertFilters, skip: number, take: number) {
    const where: Prisma.AlertWhereInput = {};
    if (filters.isResolved !== undefined) where.isResolved = filters.isResolved;
    if (filters.severity) where.severity = filters.severity;
    if (filters.alertType) where.alertType = filters.alertType;
    if (filters.deviceId) where.deviceId = filters.deviceId;

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          device: { select: { deviceName: true } },
          resolvedBy: { select: { fullName: true } },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return { alerts, total };
  }

  // ---------- Find unresolved alert by type and device ----------
  async findUnresolved(deviceId: string, alertType: AlertType) {
    return prisma.alert.findFirst({
      where: { deviceId, alertType, isResolved: false },
    });
  }

  // ---------- Find recent ----------
  // async findRecent(limit: number) {
  //   return prisma.alert.findMany({
  //     take: limit,
  //     orderBy: { createdAt: "desc" },
  //     include: { device: { select: { deviceName: true } } },
  //   });
  // }

  async findRecent(limit: number, user?: { userId: string; role: string }) {
    const where: Prisma.AlertWhereInput = {};

    // 👇 USER FILTER (IMPORTANT)
    if (user && user.role !== "ADMIN") {
  where.device = {
    userId: user.userId,
  };
}

    return prisma.alert.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        device: { select: { deviceName: true } },
      },
    });
  }

  // ---------- Summary (Counts by severity) ----------
  // async getSummary(deviceId?: string) {
  //   const where: Prisma.AlertWhereInput = { isResolved: false };
  //   if (deviceId) where.deviceId = deviceId;

  //   const groupBy = await prisma.alert.groupBy({
  //     by: ["severity"],
  //     where,
  //     _count: { severity: true },
  //   });

  //   const summary = {
  //     [AlertSeverity.CRITICAL]: 0,
  //     [AlertSeverity.WARNING]: 0,
  //     [AlertSeverity.INFO]: 0,
  //   };

  //   groupBy.forEach((group) => {
  //     summary[group.severity] = group._count.severity;
  //   });

  //   return summary;
  // }

  async getSummary(deviceId?: string, user?: { userId: string; role: string }) {
    const where: Prisma.AlertWhereInput = {
      isResolved: false,
    };

    // USER restriction
    if (user && user.role !== "ADMIN") {
  where.device = {
    userId: user.userId,
  };
}

    // optional device filter
    if (deviceId) {
      where.deviceId = deviceId;
    }

    const groupBy = await prisma.alert.groupBy({
      by: ["severity"],
      where,
      _count: { severity: true },
    });

    const summary = {
      [AlertSeverity.CRITICAL]: 0,
      [AlertSeverity.WARNING]: 0,
      [AlertSeverity.INFO]: 0,
    };

    groupBy.forEach((group) => {
      summary[group.severity] = group._count.severity;
    });

    return summary;
  }

  // ---------- Create ----------
  async create(data: Prisma.AlertCreateInput) {
    return prisma.alert.create({
      data,
      include: { device: { select: { deviceName: true } } },
    });
  }

  // ---------- Resolve ----------
  async resolve(id: string, userId: string) {
    return prisma.alert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: { connect: { id: userId } },
      },
      include: {
        device: { select: { deviceName: true } },
        resolvedBy: { select: { fullName: true } },
      },
    });
  }

  // ---------- Delete ----------
  async delete(id: string) {
    return prisma.alert.delete({ where: { id } });
  }

  // ---------- Fetch data for auto-check ----------
  // We need latest telemetry per device, and potentially their device config for thresholds.
  // We can join device and any configs we have.
  async getAutoCheckData() {
    // DB-level latest-per-device
    const maxPerDevice = await prisma.telemetry.groupBy({
      by: ["deviceId"],
      _max: { recordedAt: true },
    });

    if (maxPerDevice.length === 0) return [];

    return Promise.all(
      maxPerDevice.map(({ deviceId, _max }) =>
        prisma.telemetry.findFirst({
          where: { deviceId, recordedAt: _max.recordedAt! },
          include: {
            device: {
              select: {
                id: true,
                deviceName: true,
                status: true,
                deviceType: true,
              },
            },
          },
        }),
      ),
    );
  }
}
