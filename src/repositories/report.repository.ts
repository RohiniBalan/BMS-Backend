import prisma from "../prisma/prisma";
import { AlertSeverity, DeviceStatus } from "@prisma/client";

function computeHealthScore(soc: number, temperature: number, status: string): number {
  let score = 100;
  if (soc < 20) score -= 25;
  else if (soc < 40) score -= 10;
  if (temperature > 50) score -= 25;
  else if (temperature > 40) score -= 10;
  if (status === "OFFLINE") score -= 15;
  else if (status === "WARNING") score -= 8;
  return Math.max(0, score);
}

export class ReportRepository {
  // ─── Fleet Summary ──────────────────────────────────────────────────────────
  async getFleetReport() {
    const alertWhere = { isResolved: false };

    const [
      totalDevices,
      onlineDevices,
      offlineDevices,
      warningDevices,
      criticalAlerts,
      warningAlerts,
      totalActiveAlerts,
      capacityAgg,
      telemetryAgg,
    ] = await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { status: DeviceStatus.ONLINE } }),
      prisma.device.count({ where: { status: DeviceStatus.OFFLINE } }),
      prisma.device.count({ where: { status: DeviceStatus.WARNING } }),
      prisma.alert.count({ where: { ...alertWhere, severity: AlertSeverity.CRITICAL } }),
      prisma.alert.count({ where: { ...alertWhere, severity: AlertSeverity.WARNING } }),
      prisma.alert.count({ where: alertWhere }),
      prisma.device.aggregate({ _sum: { totalCapacityKWh: true } }),
      prisma.telemetry.aggregate({
        _avg: { soc: true, temperature: true, voltage: true },
      }),
    ]);

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      warningDevices,
      criticalAlerts,
      warningAlerts,
      totalActiveAlerts,
      totalCapacityMWh: +((capacityAgg._sum.totalCapacityKWh ?? 0) / 1000).toFixed(2),
      avgSOC: telemetryAgg._avg.soc != null ? +telemetryAgg._avg.soc.toFixed(1) : 0,
      avgTemperature: telemetryAgg._avg.temperature != null ? +telemetryAgg._avg.temperature.toFixed(1) : 0,
      avgVoltage: telemetryAgg._avg.voltage != null ? +telemetryAgg._avg.voltage.toFixed(1) : 0,
      fleetHealthScore: Math.round((onlineDevices / Math.max(totalDevices, 1)) * 100),
    };
  }

  // ─── Device Report ──────────────────────────────────────────────────────────
  async getDeviceReport(filters: { deviceId?: string; status?: DeviceStatus }) {
    const where: any = {};
    if (filters.deviceId) where.id = filters.deviceId;
    if (filters.status) where.status = filters.status;

    const devices = await prisma.device.findMany({
      where,
      include: {
        telemetry: { orderBy: { recordedAt: "desc" }, take: 1 },
        registration: { select: { batteryType: true, registeredAt: true } },
        user: { select: { fullName: true, email: true } },
        alerts: { where: { isResolved: false }, select: { severity: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return devices.map((d) => {
      const t = d.telemetry[0];
      const soc = t?.soc ?? 0;
      const temperature = t?.temperature ?? 0;

      return {
        id: d.id,
        name: d.deviceName,
        type: d.deviceType,
        status: d.status,
        soc,
        voltage: t?.voltage ?? 0,
        temperature,
        current: t?.current ?? 0,
        capacity: d.totalCapacityKWh,
        healthScore: computeHealthScore(soc, temperature, d.status),
        batteryType: d.registration?.batteryType ?? null,
        assignedTo: d.user?.fullName ?? null,
        activeAlerts: d.alerts.length,
        lastSeen: t?.recordedAt?.toISOString() ?? null,
      };
    });
  }

  // ─── Alert Report ───────────────────────────────────────────────────────────
  async getAlertReport(filters: {
    from?: Date;
    to?: Date;
    deviceId?: string;
    severity?: AlertSeverity;
  }) {
    const where: any = {};
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }
    if (filters.deviceId) where.deviceId = filters.deviceId;
    if (filters.severity) where.severity = filters.severity;

    return prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        device: { select: { deviceName: true, serialNumber: true } },
        resolvedBy: { select: { fullName: true } },
        acknowledgedBy: { select: { fullName: true } },
      },
    });
  }

  // ─── Battery Health Report ──────────────────────────────────────────────────
  async getBatteryHealthReport() {
    const devices = await prisma.device.findMany({
      include: {
        telemetry: { orderBy: { recordedAt: "desc" }, take: 1 },
        _count: { select: { alerts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return devices
      .map((d) => {
        const t = d.telemetry[0];
        const soc = t?.soc ?? 0;
        const temperature = t?.temperature ?? 0;
        return {
          id: d.id,
          name: d.deviceName,
          status: d.status,
          soc,
          voltage: t?.voltage ?? 0,
          temperature,
          healthScore: computeHealthScore(soc, temperature, d.status),
          totalAlerts: d._count.alerts,
        };
      })
      .sort((a, b) => a.healthScore - b.healthScore);
  }

  // ─── User Performance Report (ownership-scoped) ─────────────────────────────
  async getUserPerformanceReport(userId: string, deviceId: string, from?: Date, to?: Date) {
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        OR: [{ userId }, { registration: { userId } }],
      },
      include: {
        telemetry: { orderBy: { recordedAt: "desc" }, take: 1 },
        registration: { select: { batteryType: true, registeredAt: true } },
      },
    });
    if (!device) return null;

    const telWhere: any = { deviceId };
    if (from || to) {
      telWhere.recordedAt = {};
      if (from) telWhere.recordedAt.gte = from;
      if (to) telWhere.recordedAt.lte = to;
    }

    const alertWhere: any = { deviceId };
    if (from || to) {
      alertWhere.createdAt = {};
      if (from) alertWhere.createdAt.gte = from;
      if (to) alertWhere.createdAt.lte = to;
    }

    const [periodAgg, alertCounts] = await Promise.all([
      prisma.telemetry.aggregate({
        where: telWhere,
        _avg: { soc: true, voltage: true, temperature: true, current: true },
        _max: { temperature: true, voltage: true },
        _min: { soc: true, voltage: true },
        _count: { id: true },
      }),
      prisma.alert.groupBy({
        by: ["severity"],
        where: alertWhere,
        _count: { id: true },
      }),
    ]);

    const latest = device.telemetry[0];
    const soc = latest?.soc ?? 0;
    const temperature = latest?.temperature ?? 0;
    const healthScore = computeHealthScore(soc, temperature, device.status);

    return {
      device: {
        id: device.id,
        name: device.deviceName,
        type: device.deviceType,
        status: device.status,
        capacity: device.totalCapacityKWh,
        batteryType: device.registration?.batteryType ?? null,
        registeredAt: device.registration?.registeredAt?.toISOString() ?? null,
      },
      current: {
        soc,
        voltage: latest?.voltage ?? 0,
        temperature,
        current: latest?.current ?? 0,
      },
      healthScore,
      periodStats: {
        avgSOC: periodAgg._avg.soc != null ? +periodAgg._avg.soc.toFixed(1) : 0,
        avgVoltage: periodAgg._avg.voltage != null ? +periodAgg._avg.voltage.toFixed(1) : 0,
        avgTemperature: periodAgg._avg.temperature != null ? +periodAgg._avg.temperature.toFixed(1) : 0,
        avgCurrent: periodAgg._avg.current != null ? +periodAgg._avg.current.toFixed(1) : 0,
        maxTemperature: periodAgg._max.temperature != null ? +periodAgg._max.temperature.toFixed(1) : 0,
        maxVoltage: periodAgg._max.voltage != null ? +periodAgg._max.voltage.toFixed(1) : 0,
        minSOC: periodAgg._min.soc != null ? +periodAgg._min.soc.toFixed(1) : 0,
        totalReadings: periodAgg._count.id,
      },
      alertSummary: {
        critical: alertCounts.find((a) => a.severity === "CRITICAL")?._count.id ?? 0,
        warning: alertCounts.find((a) => a.severity === "WARNING")?._count.id ?? 0,
        info: alertCounts.find((a) => a.severity === "INFO")?._count.id ?? 0,
      },
    };
  }

  // ─── User Telemetry Report ───────────────────────────────────────────────────
  async getUserTelemetryReport(userId: string, deviceId: string, from?: Date, to?: Date, limit = 100) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, OR: [{ userId }, { registration: { userId } }] },
    });
    if (!device) return null;

    const where: any = { deviceId };
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = from;
      if (to) where.recordedAt.lte = to;
    }

    const records = await prisma.telemetry.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      take: limit,
      select: { soc: true, voltage: true, current: true, temperature: true, capacity: true, recordedAt: true },
    });

    return {
      deviceName: device.deviceName,
      deviceId: device.id,
      records: records.map((r) => ({
        time: r.recordedAt.toISOString(),
        soc: r.soc,
        voltage: r.voltage,
        current: r.current,
        temperature: r.temperature,
        capacity: r.capacity,
      })),
    };
  }

  // ─── User Alert Report ───────────────────────────────────────────────────────
  async getUserAlertReport(userId: string, deviceId: string, from?: Date, to?: Date, severity?: AlertSeverity) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, OR: [{ userId }, { registration: { userId } }] },
    });
    if (!device) return null;

    const where: any = { deviceId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }
    if (severity) where.severity = severity;

    const [alerts, summaryGroups] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          alertType: true,
          severity: true,
          message: true,
          isResolved: true,
          isAcknowledged: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      prisma.alert.groupBy({
        by: ["severity"],
        where: { deviceId, ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) },
        _count: { id: true },
      }),
    ]);

    return {
      deviceName: device.deviceName,
      alerts: alerts.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        resolvedAt: a.resolvedAt?.toISOString() ?? null,
      })),
      summary: {
        total: alerts.length,
        critical: summaryGroups.find((s) => s.severity === "CRITICAL")?._count.id ?? 0,
        warning: summaryGroups.find((s) => s.severity === "WARNING")?._count.id ?? 0,
        info: summaryGroups.find((s) => s.severity === "INFO")?._count.id ?? 0,
      },
    };
  }

  // ─── Audit / User Activity Report ───────────────────────────────────────────
  async getAuditReport(filters: { from?: Date; to?: Date }) {
    const where: any = {};
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { fullName: true, email: true, role: true } },
      },
    });
  }
}
