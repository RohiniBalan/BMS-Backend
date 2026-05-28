import prisma from "../prisma/prisma";
import { Prisma } from "@prisma/client";

export interface TelemetryFilters {
  deviceId?: string;
  from?: Date;
  to?: Date;
}

export class TelemetryRepository {
  // ---------- Insert single ----------
  async create(data: Prisma.TelemetryCreateInput) {
    return prisma.telemetry.create({ data });
  }

  // ---------- Bulk insert ----------
  async createMany(records: Prisma.TelemetryCreateManyInput[]) {
    return prisma.telemetry.createMany({ data: records, skipDuplicates: false });
  }

  // ---------- Latest record for a device ----------
  async findLatestByDevice(deviceId: string) {
    return prisma.telemetry.findFirst({
      where: { deviceId },
      orderBy: { recordedAt: "desc" },
    });
  }

  // ---------- Latest record per EVERY device (DB-level, no in-memory filter) ----------
  // Uses a raw subquery via groupBy + max recordedAt, then fetches matching rows.
  async findLatestPerDevice() {
    // Step 1: get the max recordedAt per device
    const maxPerDevice = await prisma.telemetry.groupBy({
      by: ["deviceId"],
      _max: { recordedAt: true },
    });

    if (maxPerDevice.length === 0) return [];

    // Step 2: fetch the actual row matching each max timestamp
    // Use an IN clause of composite (deviceId, recordedAt) — Prisma doesn't support
    // tuple IN, so we do one findFirst per device in parallel (still one round-trip each
    // but avoids pulling all history).
    const rows = await Promise.all(
      maxPerDevice.map(({ deviceId, _max }) =>
        prisma.telemetry.findFirst({
          where: { deviceId, recordedAt: _max.recordedAt! },
          include: { device: { select: { deviceName: true, status: true } } },
        })
      )
    );
    return rows.filter(Boolean);
  }

  // ---------- History (chart data) with optional hour window and interval downsampling ----------
  async findHistory(
    deviceId: string,
    skip: number,
    take: number,
    from?: Date,
    to?: Date,
    interval?: string
  ) {
    if (interval) {
      let trunc = "hour";
      if (interval === "1m") trunc = "minute";
      else if (interval === "1d") trunc = "day";

      const queryFrom = from ? Prisma.sql`AND "recordedAt" >= ${from}` : Prisma.empty;
      const queryTo = to ? Prisma.sql`AND "recordedAt" <= ${to}` : Prisma.empty;
      const truncRaw = Prisma.raw(`'${trunc}'`);

      const rawRecords: any[] = await prisma.$queryRaw`
        SELECT 
          date_trunc(${truncRaw}, "recordedAt") as "recordedAt",
          AVG(soc) as soc,
          AVG(voltage) as voltage,
          AVG(current) as current,
          AVG(temperature) as temperature,
          AVG(capacity) as capacity,
          AVG(speed) as speed,
          AVG(acceleration) as acceleration
        FROM "Telemetry"
        WHERE "deviceId" = ${deviceId}
          ${queryFrom}
          ${queryTo}
        GROUP BY date_trunc(${truncRaw}, "recordedAt")
        ORDER BY date_trunc(${truncRaw}, "recordedAt") ASC
        LIMIT ${take} OFFSET ${skip}
      `;

      const totalRaw: any[] = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT date_trunc(${truncRaw}, "recordedAt")) as count
        FROM "Telemetry"
        WHERE "deviceId" = ${deviceId}
          ${queryFrom}
          ${queryTo}
      `;

      const records = rawRecords.map(r => ({
        id: `agg-${new Date(r.recordedAt).getTime()}`,
        soc: Number(r.soc),
        voltage: Number(r.voltage),
        current: Number(r.current),
        temperature: Number(r.temperature),
        capacity: Number(r.capacity),
        speed: r.speed != null ? Number(r.speed) : null,
        acceleration: r.acceleration != null ? Number(r.acceleration) : null,
        recordedAt: r.recordedAt,
      }));

      return { records, total: Number(totalRaw[0].count) };
    }

    const where: Prisma.TelemetryWhereInput = { deviceId };
    if (from || to) {
      where.recordedAt = {};
      if (from) (where.recordedAt as any).gte = from;
      if (to) (where.recordedAt as any).lte = to;
    }

    const [records, total] = await Promise.all([
      prisma.telemetry.findMany({
        where,
        skip,
        take,
        orderBy: { recordedAt: "asc" }, // ascending for charts
        select: {
          id: true,
          soc: true,
          voltage: true,
          current: true,
          temperature: true,
          capacity: true,
          speed: true,
          acceleration: true,
          recordedAt: true,
        },
      }),
      prisma.telemetry.count({ where }),
    ]);
    return { records, total };
  }

  // ---------- Thermal summary (aggregate from latest per device) ----------
  async thermalSummary() {
    // Get latest record per device first, then aggregate in JS (small dataset after groupBy)
    const latest = await this.findLatestPerDevice();
    if (latest.length === 0) {
      return { minTemperature: null, maxTemperature: null, averageTemperature: null, deviceCount: 0 };
    }
    const temps = latest.map((r) => r!.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    return {
      minTemperature: +min.toFixed(2),
      maxTemperature: +max.toFixed(2),
      averageTemperature: +avg.toFixed(2),
      deviceCount: latest.length,
    };
  }
}
