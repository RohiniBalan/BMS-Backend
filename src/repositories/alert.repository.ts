import prisma from "../prisma/prisma";
import { AlertSeverity, AlertType, Prisma } from "@prisma/client";

export interface AlertFilters {
  isResolved?: boolean;
  isAcknowledged?: boolean;
  severity?: AlertSeverity;
  alertType?: AlertType;
  deviceId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  userId?: string;
}

export class AlertRepository {
  // ---------- List with filters + pagination ----------
  async findAll(filters: AlertFilters, skip: number, take: number) {
    const where: Prisma.AlertWhereInput = {};
    if (filters.isResolved !== undefined) where.isResolved = filters.isResolved;
    if (filters.isAcknowledged !== undefined) where.isAcknowledged = filters.isAcknowledged;
    if (filters.severity) where.severity = filters.severity;
    if (filters.alertType) where.alertType = filters.alertType;
    if (filters.deviceId) where.deviceId = filters.deviceId;
    if (filters.userId) where.device = { userId: filters.userId };
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }
    if (filters.search) {
      const search = filters.search;
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { device: { deviceName: { contains: search, mode: "insensitive" } } },
        { device: { serialNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          device: {
            select: {
              id: true,
              deviceName: true,
              serialNumber: true,
              deviceType: true,
              user: { select: { fullName: true, email: true } },
              registration: { select: { batteryType: true } },
            },
          },
          acknowledgedBy: { select: { fullName: true } },
          resolvedBy: { select: { fullName: true } },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        const sensorSnapshot = await prisma.telemetry.findFirst({
          where: {
            deviceId: alert.deviceId,
            recordedAt: { lte: alert.createdAt },
          },
          orderBy: { recordedAt: "desc" },
          select: {
            soc: true,
            voltage: true,
            current: true,
            temperature: true,
            recordedAt: true,
          },
        }) ?? await prisma.telemetry.findFirst({
          where: { deviceId: alert.deviceId },
          orderBy: { recordedAt: "desc" },
          select: {
            soc: true,
            voltage: true,
            current: true,
            temperature: true,
            recordedAt: true,
          },
        });

        return { ...alert, sensorSnapshot };
      }),
    );

    return { alerts: enrichedAlerts, total };
  }

  // ---------- Find unresolved alert by type and device ----------
  async findUnresolved(deviceId: string, alertType: AlertType) {
    return prisma.alert.findFirst({
      where: { deviceId, alertType, isResolved: false },
    });
  }

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
        device: { select: { deviceName: true, serialNumber: true } },
      },
    });
  }

  async getStats(user?: { userId: string; role: string }) {
    const where: Prisma.AlertWhereInput = {};

    if (user && user.role !== "ADMIN") {
      where.device = { userId: user.userId };
    }

    const [
      totalAlerts,
      activeAlerts,
      acknowledgedAlerts,
      resolvedAlerts,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      deviceGroups,
      trendGroups,
    ] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.count({ where: { ...where, isResolved: false } }),
      prisma.alert.count({ where: { ...where, isResolved: false, isAcknowledged: true } }),
      prisma.alert.count({ where: { ...where, isResolved: true } }),
      prisma.alert.count({ where: { ...where, severity: AlertSeverity.CRITICAL } }),
      prisma.alert.count({ where: { ...where, severity: AlertSeverity.WARNING } }),
      prisma.alert.count({ where: { ...where, severity: AlertSeverity.INFO } }),
      prisma.alert.groupBy({
        by: ["deviceId"],
        where,
        _count: { deviceId: true },
        orderBy: { _count: { deviceId: "desc" } },
        take: 8,
      }),
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS count
        FROM "Alert"
        ${user && user.role !== "ADMIN"
          ? Prisma.sql`WHERE "deviceId" IN (SELECT "id" FROM "Device" WHERE "userId" = ${user.userId})`
          : Prisma.empty}
        GROUP BY day
        ORDER BY day DESC
        LIMIT 14
      `,
    ]);

    const devices = await prisma.device.findMany({
      where: { id: { in: deviceGroups.map((group) => group.deviceId) } },
      select: { id: true, deviceName: true, serialNumber: true },
    });

    const deviceMap = new Map(devices.map((device) => [device.id, device]));

    return {
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      resolvedAlerts,
      acknowledgedAlerts,
      severityDistribution: [
        { name: "Critical", value: criticalAlerts, color: "#FF5252" },
        { name: "Warning", value: warningAlerts, color: "#FFB300" },
        { name: "Info", value: infoAlerts, color: "#448AFF" },
      ],
      deviceAlerts: deviceGroups.map((group) => {
        const device = deviceMap.get(group.deviceId);
        return {
          deviceId: group.deviceId,
          deviceName: device?.deviceName || "Unknown Device",
          serialNumber: device?.serialNumber || "--",
          count: group._count.deviceId,
        };
      }),
      trend: trendGroups
        .map((group) => ({
          date: group.day.toISOString().slice(0, 10),
          alerts: Number(group.count),
        }))
        .reverse(),
    };
  }


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
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: { connect: { id: userId } },
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

  async acknowledge(id: string, userId: string) {
    return prisma.alert.update({
      where: { id },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: { connect: { id: userId } },
      },
      include: {
        device: { select: { deviceName: true } },
        acknowledgedBy: { select: { fullName: true } },
      },
    });
  }

  // ---------- Delete ----------
  async delete(id: string) {
    return prisma.alert.delete({ where: { id } });
  }

  // ---------- Auto-resolve unresolved alerts for a device+type ----------
  async resolveByDeviceAndType(deviceId: string, alertType: AlertType): Promise<void> {
    await prisma.alert.updateMany({
      where: { deviceId, alertType, isResolved: false },
      data: { isResolved: true, resolvedAt: new Date() },
    });
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
