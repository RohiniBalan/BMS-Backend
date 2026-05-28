import { TelemetryRepository } from "../repositories/telemetry.repository";
import { DeviceRepository } from "../repositories/device.repository";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { Prisma } from "@prisma/client";

const repo = new TelemetryRepository();
const deviceRepo = new DeviceRepository();

export class TelemetryService {
  // ---------- Single ingest ----------
  async ingest(body: {
    deviceId: string;
    soc: number;
    voltage: number;
    current: number;
    temperature: number;
    capacity: number;
    speed?: number;
    acceleration?: number;
    recordedAt?: string;
  }) {
    // Validate device exists
    const device = await deviceRepo.findById(body.deviceId);
    if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });

    const data: Prisma.TelemetryCreateInput = {
      device: { connect: { id: body.deviceId } },
      soc: body.soc,
      voltage: body.voltage,
      current: body.current,
      temperature: body.temperature,
      capacity: body.capacity,
      speed: body.speed,
      acceleration: body.acceleration,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
    };
    return repo.create(data);
  }

  // ---------- Bulk ingest ----------
  async ingestBulk(records: Array<{
    deviceId: string;
    soc: number;
    voltage: number;
    current: number;
    temperature: number;
    capacity: number;
    speed?: number;
    acceleration?: number;
    recordedAt?: string;
  }>) {
    if (records.length > 1000) {
      throw Object.assign(new Error("Bulk ingest limit is 1000 records per request"), { status: 400 });
    }

    const mapped: Prisma.TelemetryCreateManyInput[] = records.map((r) => ({
      deviceId: r.deviceId,
      soc: r.soc,
      voltage: r.voltage,
      current: r.current,
      temperature: r.temperature,
      capacity: r.capacity,
      speed: r.speed,
      acceleration: r.acceleration,
      recordedAt: r.recordedAt ? new Date(r.recordedAt) : undefined,
    }));
    return repo.createMany(mapped);
  }

  // ---------- Latest for one device ----------
  async getLatest(deviceId: string) {
    const device = await deviceRepo.findById(deviceId);
    if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });
    const record = await repo.findLatestByDevice(deviceId);
    if (!record) throw Object.assign(new Error("No telemetry found for device"), { status: 404 });
    return record;
  }

  // ---------- Latest per ALL devices ----------
  async getAllLatest() {
    return repo.findLatestPerDevice();
  }

  // ---------- History (paginated, chart-ready) ----------
  async getHistory(
    deviceId: string,
    query: { page?: string; limit?: string; hours?: string; from?: string; to?: string; interval?: string }
  ) {
    const device = await deviceRepo.findById(deviceId);
    if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });

    const pagination = parsePagination(query);
    let from: Date | undefined;
    let to: Date | undefined;

    if (query.hours) {
      const h = parseFloat(query.hours);
      from = new Date(Date.now() - h * 60 * 60 * 1000);
      to = new Date();
    } else {
      if (query.from) from = new Date(query.from);
      if (query.to) to = new Date(query.to);
    }

    const { records, total } = await repo.findHistory(deviceId, pagination.skip, pagination.limit, from, to, query.interval);
    return { records, pagination: buildPaginationMeta(total, pagination) };
  }

  // ---------- Thermal summary ----------
  async getThermalSummary() {
    return repo.thermalSummary();
  }
}
