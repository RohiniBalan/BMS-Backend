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
  // async getDashboardSummary(deviceId?: string) {
  //   // Basic device stats
  //   const deviceWhere = deviceId ? { id: deviceId } : {};
  //   const totalDevices = await prisma.device.count({ where: deviceWhere });
  //   const onlineDevices = await prisma.device.count({ where: { ...deviceWhere, status: DeviceStatus.ONLINE } });
    
  //   const capacityAgg = await prisma.device.aggregate({
  //     where: deviceWhere,
  //     _sum: { totalCapacityKWh: true },
  //   });
  //   const totalCapacityMWh = (capacityAgg._sum.totalCapacityKWh || 0) / 1000;

  //   const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  //   const capacityAddedToday = await prisma.device.aggregate({
  //     where: { ...deviceWhere, createdAt: { gte: yesterday } },
  //     _sum: { totalCapacityKWh: true },
  //   });
  //   const capacityChangeTodayKWh = capacityAddedToday._sum.totalCapacityKWh || 0;

  //   // Alerts stats
  //   const alertWhere = deviceId ? { deviceId, isResolved: false } : { isResolved: false };
  //   const totalAlerts = await prisma.alert.count({ where: alertWhere });
  //   const criticalAlerts = await prisma.alert.count({ where: { ...alertWhere, severity: AlertSeverity.CRITICAL } });
  //   const warningAlerts = await prisma.alert.count({ where: { ...alertWhere, severity: AlertSeverity.WARNING } });

  //   // SOC Stats
  //   let latestTels: any[] = [];
  //   if (deviceId) {
  //     const t = await prisma.telemetry.findFirst({ where: { deviceId }, orderBy: { recordedAt: "desc" } });
  //     if (t) latestTels.push(t);
  //   } else {
  //     latestTels = await this.getLatestTelemetryPerDevice();
  //   }
    
  //   const validTels = latestTels.filter(Boolean);
  //   const averageSOC = validTels.length > 0 
  //     ? validTels.reduce((sum, t) => sum + t.soc, 0) / validTels.length 
  //     : 0;

  //   // Dummy socChangeFromYesterday (could be complex to query exact average SOC exactly 24h ago)
  //   const socChangeFromYesterday = 0.5; // Mock for now

  //   return {
  //     averageSOC: +averageSOC.toFixed(2),
  //     socChangeFromYesterday,
  //     totalCapacityMWh: +totalCapacityMWh.toFixed(2),
  //     capacityChangeTodayKWh: +capacityChangeTodayKWh.toFixed(2),
  //     totalAlerts,
  //     criticalAlerts,
  //     warningAlerts,
  //     totalDevices,
  //     onlineDevices,
  //   };
  // }

  private getDeviceWhere(user?: { id: string; role: string }) {
  if (!user || user.role === "ADMIN") return {};
  return { userId: user.id };
}

  async getDashboardSummary(deviceId?: string, user?: { id: string; role: string }) {
    // Basic device stats
    const deviceWhere = {
  ...this.getDeviceWhere(user),
  ...(deviceId ? { id: deviceId } : {})
};
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
    const alertWhere: any = {
  isResolved: false,
  ...(deviceId ? { deviceId } : {}),
  device: this.getDeviceWhere(user)
};
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
  // async getSocDistribution() {
  //   const latest = await this.getLatestTelemetryPerDevice();
  //   const dist = {
  //     "0-20": 0,
  //     "20-40": 0,
  //     "40-60": 0,
  //     "60-80": 0,
  //     "80-100": 0,
  //   };

  //   latest.forEach((t) => {
  //     if (!t) return;
  //     if (t.soc <= 20) dist["0-20"]++;
  //     else if (t.soc <= 40) dist["20-40"]++;
  //     else if (t.soc <= 60) dist["40-60"]++;
  //     else if (t.soc <= 80) dist["60-80"]++;
  //     else dist["80-100"]++;
  //   });

  //   return dist;
  // }

  async getSocDistribution(user?: { id: string; role: string }) {
    const devices = await prisma.device.findMany({
  where: this.getDeviceWhere(user),
  include: {
    telemetry: {
      orderBy: { recordedAt: "desc" },
      take: 1,
    },
  },
});
    const dist = {
      "0-20": 0,
      "20-40": 0,
      "40-60": 0,
      "60-80": 0,
      "80-100": 0,
    };

    devices.forEach((device) => {
      const t = device.telemetry[0];
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
  // async getTrend(type: "soc" | "temperature", deviceId?: string, range: string = "24h") {
  //   let from = new Date();
  //   let trunc = "hour";

  //   if (range === "24h") {
  //     from = new Date(Date.now() - 24 * 60 * 60 * 1000);
  //     trunc = "hour";
  //   } else if (range === "7d") {
  //     from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  //     trunc = "day";
  //   } else if (range === "30d") {
  //     from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  //     trunc = "day";
  //   }

  //   const deviceWhere = deviceId ? Prisma.sql`AND "deviceId" = ${deviceId}` : Prisma.empty;
  //   const truncRaw = Prisma.raw(`'${trunc}'`);
  //   const fieldRaw = Prisma.raw(`"${type}"`);

  //   // We do average of type per trunc
  //   const rawData: any[] = await prisma.$queryRaw`
  //     SELECT 
  //       date_trunc(${truncRaw}, "recordedAt") as "recordedAt",
  //       AVG(${fieldRaw}) as value
  //     FROM "Telemetry"
  //     WHERE "recordedAt" >= ${from}
  //       ${deviceWhere}
  //     GROUP BY date_trunc(${truncRaw}, "recordedAt")
  //     ORDER BY date_trunc(${truncRaw}, "recordedAt") ASC
  //   `;

  //   return rawData.map(r => ({
  //     recordedAt: r.recordedAt,
  //     value: Number(r.value),
  //   }));
  // }

  async getTrend(type: "soc" | "temperature" | "voltage" | "current", deviceId?: string, range: string = "24h", user?: { id: string; role: string }) {
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

   const deviceFilter =
  user && user.role !== "ADMIN"
    ? Prisma.sql`AND "deviceId" IN (
        SELECT id FROM "Device" WHERE "userId" = ${user.id}
        UNION
        SELECT "deviceId" FROM "DeviceRegistration" WHERE "userId" = ${user.id}
      )`
    : Prisma.empty;

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
    ${deviceFilter}
    ${deviceId ? Prisma.sql`AND "deviceId" = ${deviceId}` : Prisma.empty}
  GROUP BY date_trunc(${truncRaw}, "recordedAt")
  ORDER BY date_trunc(${truncRaw}, "recordedAt") ASC
`;

    return rawData.map(r => ({
      recordedAt: r.recordedAt,
      value: Number(r.value),
    }));
  }

  // async getFleetSummary(range: string = "24h") {
  //   let from = new Date();
  //   if (range === "24h") from = new Date(Date.now() - 24 * 60 * 60 * 1000);
  //   else if (range === "7d") from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  //   else if (range === "30d") from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  //   const data = await prisma.telemetry.aggregate({
  //     where: { recordedAt: { gte: from } },
  //     _avg: { temperature: true, soc: true, voltage: true },
  //     _max: { temperature: true, voltage: true },
  //     _min: { temperature: true, voltage: true },
  //   });

  //   return data;
  // }

  async getFleetSummary(range: string = "24h",  user?: { id: string; role: string }) {
    let from = new Date();
    if (range === "24h") from = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (range === "7d") from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (range === "30d") from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const data = await prisma.telemetry.aggregate({
      where: {
  recordedAt: { gte: from },
  device: this.getDeviceWhere(user)
},
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

  // ---------- User Device Analytics ----------
  async getUserDeviceAnalytics(userId: string, deviceId: string, range: string = "24h") {
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        OR: [{ userId }, { registration: { userId } }],
      },
      include: {
        telemetry: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    });

    if (!device) return null;

    const latest = device.telemetry[0];
    const soc = latest?.soc ?? 0;
    const temperature = latest?.temperature ?? 0;

    let healthScore = 100;
    if (soc < 20) healthScore -= 25;
    else if (soc < 40) healthScore -= 10;
    if (temperature > 50) healthScore -= 25;
    else if (temperature > 40) healthScore -= 10;
    if (device.status === "OFFLINE") healthScore -= 15;
    else if (device.status === "WARNING") healthScore -= 8;
    healthScore = Math.max(0, healthScore);

    // Reuse existing getTrend — ownership already validated above
    const [socTrend, tempTrend, voltageTrend, currentTrend] = await Promise.all([
      this.getTrend("soc", deviceId, range),
      this.getTrend("temperature", deviceId, range),
      this.getTrend("voltage", deviceId, range),
      this.getTrend("current", deviceId, range),
    ]);

    let from = new Date();
    if (range === "24h") from = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (range === "7d") from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (range === "30d") from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const alertBase = { deviceId, createdAt: { gte: from } };

    const [totalAlerts, criticalAlerts, warningAlerts, alertsByType] = await Promise.all([
      prisma.alert.count({ where: alertBase }),
      prisma.alert.count({ where: { ...alertBase, severity: AlertSeverity.CRITICAL } }),
      prisma.alert.count({ where: { ...alertBase, severity: AlertSeverity.WARNING } }),
      prisma.alert.groupBy({
        by: ["alertType"],
        where: alertBase,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    const monthlyFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [monthlyAgg, monthlyAlerts] = await Promise.all([
      prisma.telemetry.aggregate({
        where: { deviceId, recordedAt: { gte: monthlyFrom } },
        _avg: { soc: true, temperature: true, voltage: true },
        _max: { temperature: true },
      }),
      prisma.alert.count({ where: { deviceId, createdAt: { gte: monthlyFrom } } }),
    ]);

    return {
      device: {
        id: device.id,
        name: device.deviceName,
        status: device.status,
        soc,
        voltage: latest?.voltage ?? 0,
        temperature,
        current: latest?.current ?? 0,
        capacity: device.totalCapacityKWh,
        healthScore,
      },
      trends: { soc: socTrend, temperature: tempTrend, voltage: voltageTrend, current: currentTrend },
      alerts: {
        total: totalAlerts,
        critical: criticalAlerts,
        warning: warningAlerts,
        info: Math.max(0, totalAlerts - criticalAlerts - warningAlerts),
        byType: alertsByType.map((a) => ({ type: a.alertType, count: a._count.id })),
      },
      monthly: {
        avgSoc: monthlyAgg._avg.soc != null ? +monthlyAgg._avg.soc.toFixed(1) : 0,
        avgTemp: monthlyAgg._avg.temperature != null ? +monthlyAgg._avg.temperature.toFixed(1) : 0,
        maxTemp: monthlyAgg._max.temperature != null ? +monthlyAgg._max.temperature.toFixed(1) : 0,
        avgVoltage: monthlyAgg._avg.voltage != null ? +monthlyAgg._avg.voltage.toFixed(1) : 0,
        alertCount: monthlyAlerts,
        healthScore,
      },
    };
  }

  // ---------- Alert Analytics ----------
  async getAlertAnalytics(range: string = "30d") {
    let from = new Date();
    if (range === "24h") from = new Date(Date.now() - 24 * 60 * 60 * 1000);
    else if (range === "7d") from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (range === "30d") from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [bySeverity, byType] = await Promise.all([
      prisma.alert.groupBy({
        by: ["severity"],
        where: { createdAt: { gte: from } },
        _count: { id: true },
      }),
      prisma.alert.groupBy({
        by: ["alertType"],
        where: { createdAt: { gte: from } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),
    ]);

    return {
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
      byType: byType.map((t) => ({ type: t.alertType, count: t._count.id })),
    };
  }

  // ---------- Device Comparison ----------
  async getDeviceComparison() {
    const devices = await prisma.device.findMany({
      include: {
        telemetry: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
      take: 30,
      orderBy: { createdAt: "desc" },
    });

    return devices.map((d) => {
      const t = d.telemetry[0];
      const soc = t?.soc ?? 0;
      const temperature = t?.temperature ?? 0;
      const voltage = t?.voltage ?? 0;
      const current = t?.current ?? 0;

      let healthScore = 100;
      if (soc < 20) healthScore -= 25;
      else if (soc < 40) healthScore -= 10;
      if (temperature > 50) healthScore -= 25;
      else if (temperature > 40) healthScore -= 10;
      if (d.status === "OFFLINE") healthScore -= 15;
      else if (d.status === "WARNING") healthScore -= 8;

      return {
        id: d.id,
        name: d.deviceName,
        status: d.status,
        soc,
        voltage,
        temperature,
        current,
        healthScore: Math.max(0, healthScore),
      };
    });
  }

  // Get Health popup data
  async getHealthPopupData(user?: { id: string; role: string }) {
  const device = await prisma.device.findFirst({
    where: this.getDeviceWhere(user),
    include: {
      telemetry: {
        orderBy: {
          recordedAt: "desc",
        },
        take: 1,
      },
    },
  });

  const latest = device?.telemetry?.[0];

  return {
    soc: latest?.soc ?? 0,
    temperature: latest?.temperature ?? 0,
    soh: 94,
    anomalyScore: 0.08,
  };
}
}
