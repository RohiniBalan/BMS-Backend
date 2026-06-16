import { TelemetryRepository } from "../repositories/telemetry.repository";
import { DeviceRepository } from "../repositories/device.repository";
import { AlertRepository } from "../repositories/alert.repository";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { AlertSeverity, AlertType, DeviceStatus, Prisma } from "@prisma/client";
import prisma from "../prisma/prisma";

const repo = new TelemetryRepository();
const deviceRepo = new DeviceRepository();
const alertRepo = new AlertRepository();

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
    const telemetry = await repo.create(data);

    await this.processAlerts(body.deviceId, device.deviceType, body.soc, body.voltage, body.temperature);

    return telemetry;
  }

  // ---------- Alert processing pipeline (called after each ingest) ----------
  private async processAlerts(
    deviceId: string,
    deviceType: string,
    soc: number,
    voltage: number,
    temperature: number,
  ) {
    // Load temperature threshold from ThermalSafetyConfig (fallback: 70°C)
    const thermalConfig = await prisma.thermalSafetyConfig.findFirst({
      where: { vehicleName: { equals: deviceType, mode: "insensitive" } },
      select: { otpThreshold: true },
    });
    const tempThreshold = thermalConfig?.otpThreshold ?? 70;

    // Load voltage thresholds from ChemistryConfig (fallback: 4.2V / 2.5V)
    const chemConfig = await prisma.chemistryConfig.findFirst({
      where: { vehicleModel: { equals: deviceType, mode: "insensitive" } },
      select: { chargeCutoffVoltage: true, dischargeCutoffVoltage: true },
    });
    const maxVoltage = chemConfig?.chargeCutoffVoltage ?? 4.2;
    const minVoltage = chemConfig?.dischargeCutoffVoltage ?? 2.5;

    type Rule = {
      type: AlertType;
      severity: AlertSeverity;
      message: string;
      triggered: boolean;
    };

    const rules: Rule[] = [
      {
        type: AlertType.HIGH_TEMPERATURE,
        severity: AlertSeverity.CRITICAL,
        message: `Temperature ${temperature}°C exceeded threshold ${tempThreshold}°C`,
        triggered: temperature > tempThreshold,
      },
      {
        type: AlertType.LOW_BATTERY,
        severity: AlertSeverity.WARNING,
        message: `Battery SOC is low: ${soc}%`,
        triggered: soc < 20,
      },
      {
        type: AlertType.OVERVOLTAGE,
        severity: AlertSeverity.CRITICAL,
        message: `Voltage ${voltage}V exceeded configured limit ${maxVoltage}V`,
        triggered: voltage > maxVoltage,
      },
      {
        type: AlertType.UNDERVOLTAGE,
        severity: AlertSeverity.WARNING,
        message: `Voltage ${voltage}V below configured limit ${minVoltage}V`,
        triggered: voltage < minVoltage,
      },
    ];

    for (const rule of rules) {
      if (rule.triggered) {
        // Create only if no unresolved alert of the same type already exists
        const existing = await alertRepo.findUnresolved(deviceId, rule.type);
        if (!existing) {
          await alertRepo.create({
            device: { connect: { id: deviceId } },
            alertType: rule.type,
            severity: rule.severity,
            message: rule.message,
          });
        }
      } else {
        // Values returned to normal — auto-resolve the alert
        await alertRepo.resolveByDeviceAndType(deviceId, rule.type);
      }
    }

    // Telemetry arrived → device is reachable; resolve any CONNECTION_LOST alert
    await alertRepo.resolveByDeviceAndType(deviceId, AlertType.CONNECTION_LOST);

    // Update device status: WARNING if any active alerts remain, else ONLINE
    const activeAlertCount = await prisma.alert.count({
      where: { deviceId, isResolved: false },
    });
    await deviceRepo.updateStatus(
      deviceId,
      activeAlertCount > 0 ? DeviceStatus.WARNING : DeviceStatus.ONLINE,
    );
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
