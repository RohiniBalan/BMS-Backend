import prisma from "../prisma/prisma";
import { Prisma, AlertSeverity, DeviceStatus } from "@prisma/client";

export class AnalyticsRepository {
  // Helpers
  private async getLatestTelemetryPerDevice() {
    const maxPerDevice = await prisma.telemetry.groupBy({
      by: ["deviceId"],
      _max: { recordedAt: true },
    });
    if (maxPerDevice.length === 0) return [];

    return Promise.all(
      maxPerDevice.map(({ deviceId, _max }) =>
        prisma.telemetry.findFirst({
          where: { deviceId, recordedAt: _max.recordedAt! },
        })
      )
    );
  }

  // ---------- Dashboard Summary ----------
  async getDashboardSummary(deviceId?: string) {
    // Basic device stats
    const deviceWhere = deviceId ? { id: deviceId } : {};
    const totalDevices = await prisma.device.count({ where: deviceWhere });
    const onlineDevices = await prisma.device.count({ where: { ...deviceWhere, status: DeviceStatus.ONLINE } });
    
    const capacityAgg = await prisma.device.aggregate({
      where: deviceWhere,
      _sum: { totalCapacityKWh: true },
    });
    const totalCapacityMWh = (capacityAgg._sum.totalCapacityKWh || 0) / 1000;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const capacityAddedToday = await prisma.device.aggregate({
      where: { ...deviceWhere, createdAt: { gte: yesterday } },
      _sum: { totalCapacityKWh: true },
    });
    const capacityChangeTodayKWh = capacityAddedToday._sum.totalCapacityKWh || 0;

    // Alerts stats
    const alertWhere = deviceId ? { deviceId, isResolved: false } : { isResolved: false };
    const totalAlerts = await prisma.alert.count({ where: alertWhere });
    const criticalAlerts = await prisma.alert.count({ where: { ...alertWhere, severity: AlertSeverity.CRITICAL } });
    const warningAlerts = await prisma.alert.count({ where: { ...alertWhere, severity: AlertSeverity.WARNING } });

    // SOC Stats
    let latestTels: any[] = [];
    if (deviceId) {
      const t = await prisma.telemetry.findFirst({ where: { deviceId }, orderBy: { recordedAt: "desc" } });
      if (t) latestTels.push(t);
    } else {
      latestTels = await this.getLatestTelemetryPerDevice();
    }
    
    const validTels = latestTels.filter(Boolean);
    const averageSOC = validTels.length > 0 
      ? validTels.reduce((sum, t) => sum + t.soc, 0) / validTels.length 
      : 0;

    // Dummy socChangeFromYesterday (could be complex to query exact average SOC exactly 24h ago)
    const socChangeFromYesterday = 0.5; // Mock for now

    return {
      averageSOC: +averageSOC.toFixed(2),
      socChangeFromYesterday,
      totalCapacityMWh: +totalCapacityMWh.toFixed(2),
      capacityChangeTodayKWh: +capacityChangeTodayKWh.toFixed(2),
      totalAlerts,
      criticalAlerts,
      warningAlerts,
      totalDevices,
      onlineDevices,
    };
  }

  // ---------- SOC Distribution ----------
  async getSocDistribution() {
    const latest = await this.getLatestTelemetryPerDevice();
    const dist = {
      "0-20": 0,
      "20-40": 0,
      "40-60": 0,
      "60-80": 0,
      "80-100": 0,
    };

    latest.forEach((t) => {
      if (!t) return;
      if (t.soc <= 20) dist["0-20"]++;
      else if (t.soc <= 40) dist["20-40"]++;
      else if (t.soc <= 60) dist["40-60"]++;
      else if (t.soc <= 80) dist["60-80"]++;
      else dist["80-100"]++;
    });

    return dist;
  }

  // ---------- Analytics Trends ----------
  async getTrend(type: "soc" | "temperature", deviceId?: string, range: string = "24h") {
    let from = new Date();
    let trunc = "hour";

    if (range === "24h") {
      from = new Date(Date.now() - 24 * 60 * 60 * 1000);
      trunc = "hour";
    } else if (range === "7d") {
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      trunc = "day";
    } else if (range === "30d") {
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      trunc = "day";
    }

    const deviceWhere = deviceId ? Prisma.sql`AND "deviceId" = ${deviceId}` : Prisma.empty;
    const truncRaw = Prisma.raw(`'${trunc}'`);
    const fieldRaw = Prisma.raw(`"${type}"`);

    // We do average of type per trunc
    const rawData: any[] = await prisma.$queryRaw`
      SELECT 
        date_trunc(${truncRaw}, "recordedAt") as "recordedAt",
        AVG(${fieldRaw}) as value
      FROM "Telemetry"
      WHERE "recordedAt" >= ${from}
        ${deviceWhere}
      GROUP BY date_trunc(${truncRaw}, "recordedAt")
      ORDER BY date_trunc(${truncRaw}, "recordedAt") ASC
    `;

    return rawData.map(r => ({
      recordedAt: r.recordedAt,
      value: Number(r.value),
    }));
  }

  async getFleetSummary(range: string = "24h") {
    let from = new Date();
    if (range === "24h") from = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (range === "7d") from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (range === "30d") from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const data = await prisma.telemetry.aggregate({
      where: { recordedAt: { gte: from } },
      _avg: { temperature: true, soc: true, voltage: true },
      _max: { temperature: true, voltage: true },
      _min: { temperature: true, voltage: true },
    });

    return data;
  }

  // ---------- Reports Data ----------
  async getReportData(deviceId?: string, fromDate?: string, toDate?: string) {
    const where: Prisma.TelemetryWhereInput = {};
    if (deviceId) where.deviceId = deviceId;
    if (fromDate || toDate) {
      where.recordedAt = {};
      if (fromDate) (where.recordedAt as any).gte = new Date(fromDate);
      if (toDate) (where.recordedAt as any).lte = new Date(toDate);
    }

    return prisma.telemetry.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      take: 10000, // safety limit for JSON
      include: { device: { select: { deviceName: true } } },
    });
  }
}
