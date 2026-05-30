import { AlertRepository, AlertFilters } from "../repositories/alert.repository";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { AlertSeverity, AlertType, Prisma } from "@prisma/client";
import prisma from "../prisma/prisma";

const repo = new AlertRepository();

export class AlertService {
  // ---------- List ----------
  async getAlerts(query: {
    page?: string;
    limit?: string;
    isResolved?: string;
    severity?: string;
    alertType?: string;
    deviceId?: string;
  }) {
    const pagination = parsePagination(query);
    const filters: AlertFilters = {};

    if (query.isResolved !== undefined) filters.isResolved = query.isResolved === "true";
    if (query.severity) filters.severity = query.severity as AlertSeverity;
    if (query.alertType) filters.alertType = query.alertType as AlertType;
    if (query.deviceId) filters.deviceId = query.deviceId;

    const { alerts, total } = await repo.findAll(filters, pagination.skip, pagination.limit);
    return { alerts, pagination: buildPaginationMeta(total, pagination) };
  }

  // ---------- Recent ----------
  // async getRecent(limitStr?: string) {
  //   const limit = Math.min(50, Math.max(1, parseInt(limitStr || "10", 10)));
  //   return repo.findRecent(limit);
  // }

  async getRecent(limitStr?: string, user?: { userId: string; role: string }) {
  const limit = Math.min(50, Math.max(1, parseInt(limitStr || "10", 10)));
  return repo.findRecent(limit, user);
}

  // ---------- Summary ----------
  // async getSummary(deviceId?: string) {
  //   return repo.getSummary(deviceId);
  // }

  async getSummary(
  deviceId?: string,
  user?: { userId: string; role: string }
) {
  return repo.getSummary(deviceId, user);
}

  // ---------- Create (Manual/Webhook) ----------
  async createAlert(body: {
    deviceId: string;
    alertType: AlertType;
    severity: AlertSeverity;
    message: string;
  }) {
    // Prevent duplicate unresolved alerts of the same type for the same device
    const existing = await repo.findUnresolved(body.deviceId, body.alertType);
    if (existing) {
      return existing; // Already exists, return it without creating a new one
    }

    return repo.create({
      device: { connect: { id: body.deviceId } },
      alertType: body.alertType,
      severity: body.severity,
      message: body.message,
    });
  }

  // ---------- Resolve ----------
  async resolveAlert(id: string, userId: string) {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) throw Object.assign(new Error("Alert not found"), { status: 404 });
    if (alert.isResolved) throw Object.assign(new Error("Alert is already resolved"), { status: 400 });

    return repo.resolve(id, userId);
  }

  // ---------- Delete ----------
  async deleteAlert(id: string) {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) throw Object.assign(new Error("Alert not found"), { status: 404 });
    await repo.delete(id);
    return true;
  }

  // ---------- Auto Check Logic ----------
  async runAutoCheck() {
    const latestData = await repo.getAutoCheckData();
    const now = new Date();
    const createdAlerts: any[] = [];

    // Helper to generate alert internally
    const emitAlert = async (deviceId: string, type: AlertType, severity: AlertSeverity, message: string) => {
      const existing = await repo.findUnresolved(deviceId, type);
      if (!existing) {
        const a = await repo.create({
          device: { connect: { id: deviceId } },
          alertType: type,
          severity,
          message,
        });
        createdAlerts.push(a);
      }
    };

    // Fetch all ThermalSafetyConfigs to map them to devices by deviceType -> vehicleName
    const configs = await prisma.thermalSafetyConfig.findMany();
    const configMap = new Map<string, any>();
    for (const c of configs) {
      configMap.set(c.vehicleName, c);
    }

    for (const record of latestData) {
      if (!record || !record.device) continue;
      const deviceId = record.device.id;
      const deviceType = record.device.deviceType;

      // 1. Load device thermal config (fallback to defaults)
      const config = configMap.get(deviceType);
      const otpThreshold = config?.otpThreshold ?? 60.0;
      const utpThreshold = config?.utpThreshold ?? 0.0; // Assuming 0 as fallback, or another safe value

      // Rule 1: temperature > otpThreshold -> HIGH_TEMPERATURE (CRITICAL)
      if (record.temperature > otpThreshold) {
        await emitAlert(
          deviceId,
          AlertType.HIGH_TEMPERATURE,
          AlertSeverity.CRITICAL,
          `Temperature ${record.temperature}°C exceeded OTP threshold ${otpThreshold}°C`
        );
      }

      // Rule: temperature < utpThreshold -> warning (future-safe)
      if (record.temperature < utpThreshold) {
        // Option B: Keep future-safe logic but skip alert creation until UNDER_TEMPERATURE enum exists.
        // await emitAlert(
        //   deviceId,
        //   AlertType.UNDER_TEMPERATURE,
        //   AlertSeverity.WARNING,
        //   `Temperature ${record.temperature}°C is below UTP threshold ${utpThreshold}°C`
        // );
      }

      // Rule 2: SOC < 20 -> LOW_BATTERY (WARNING)
      if (record.soc < 20) {
        await emitAlert(
          deviceId,
          AlertType.LOW_BATTERY,
          AlertSeverity.WARNING,
          `Battery SOC is extremely low: ${record.soc}%`
        );
      }

      // Rule 4: Last telemetry > 5 minutes -> CONNECTION_LOST (CRITICAL)
      const diffMinutes = (now.getTime() - record.recordedAt.getTime()) / (1000 * 60);
      if (diffMinutes > 5) {
        await emitAlert(
          deviceId,
          AlertType.CONNECTION_LOST,
          AlertSeverity.CRITICAL,
          `No telemetry received for ${Math.floor(diffMinutes)} minutes`
        );
      }

      // Rule 3: Voltage deviation > 0.3 -> CELL_IMBALANCE (WARNING)
      // We check CellTelemetry for this device's pack.
      const pack = await prisma.batteryPack.findUnique({
        where: { deviceId },
        include: { cells: { orderBy: { recordedAt: "desc" }, take: 100 } }, // naive assumption to get recent cells
      });

      if (pack && pack.cells.length > 0) {
        // Group by cellId to find latest per cell, then calculate min/max
        const cellMap = new Map<string, number>();
        for (const c of pack.cells) {
          if (!cellMap.has(c.cellId)) cellMap.set(c.cellId, c.voltage);
        }
        const voltages = Array.from(cellMap.values());
        if (voltages.length > 1) {
          const maxV = Math.max(...voltages);
          const minV = Math.min(...voltages);
          const deviation = maxV - minV;
          
          if (deviation > 0.3) {
            await emitAlert(
              deviceId,
              AlertType.CELL_IMBALANCE,
              AlertSeverity.WARNING,
              `Cell voltage deviation is ${deviation.toFixed(3)}V (> 0.3V)`
            );
          }
        }
      }
    }

    return { checkedDevices: latestData.length, alertsGenerated: createdAlerts.length };
  }
}
