import { Request, Response, NextFunction } from "express";
import { AlertSeverity, DeviceStatus } from "@prisma/client";
import { ReportService } from "../services/report.service";
import { sendSuccess } from "../utils/response";

const service = new ReportService();

function csvRow(...fields: (string | number | boolean | null | undefined)[]): string {
  return fields
    .map((f) => {
      const v = f == null ? "" : String(f);
      return `"${v.replace(/"/g, '""')}"`;
    })
    .join(",");
}

export class ReportController {
  // GET /reports/fleet
  async getFleetReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getFleetReport();
      return sendSuccess(res, "Fleet report retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /reports/devices?deviceId=&status=
  async getDeviceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceId, status } = req.query;
      const data = await service.getDeviceReport({
        deviceId: deviceId as string | undefined,
        status: status ? (status as DeviceStatus) : undefined,
      });
      return sendSuccess(res, "Device report retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /reports/alerts?from=&to=&deviceId=&severity=
  async getAlertReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, deviceId, severity } = req.query;
      const data = await service.getAlertReport({
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        deviceId: deviceId as string | undefined,
        severity: severity ? (severity as AlertSeverity) : undefined,
      });
      return sendSuccess(res, "Alert report retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /reports/battery-health
  async getBatteryHealthReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getBatteryHealthReport();
      return sendSuccess(res, "Battery health report retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /reports/audit?from=&to=
  async getAuditReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      const data = await service.getAuditReport({
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      });
      return sendSuccess(res, "Audit report retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /reports/user-performance?deviceId=&from=&to=
  async getUserPerformanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { deviceId, from, to } = req.query;
      if (!deviceId) { res.status(400); return sendSuccess(res, "deviceId required", null); }
      const data = await service.getUserPerformanceReport(
        user.id, deviceId as string,
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined,
      );
      if (!data) { res.status(403); return sendSuccess(res, "Device not found or not assigned to you", null); }
      return sendSuccess(res, "User performance report retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /reports/user-telemetry?deviceId=&from=&to=&limit=
  async getUserTelemetryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { deviceId, from, to, limit } = req.query;
      if (!deviceId) { res.status(400); return sendSuccess(res, "deviceId required", null); }
      const data = await service.getUserTelemetryReport(
        user.id, deviceId as string,
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined,
        limit ? Number(limit) : 100,
      );
      if (!data) { res.status(403); return sendSuccess(res, "Device not found or not assigned to you", null); }
      return sendSuccess(res, "User telemetry report retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /reports/user-alerts?deviceId=&from=&to=&severity=
  async getUserAlertReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { deviceId, from, to, severity } = req.query;
      if (!deviceId) { res.status(400); return sendSuccess(res, "deviceId required", null); }
      const data = await service.getUserAlertReport(
        user.id, deviceId as string,
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined,
        severity ? (severity as AlertSeverity) : undefined,
      );
      if (!data) { res.status(403); return sendSuccess(res, "Device not found or not assigned to you", null); }
      return sendSuccess(res, "User alert report retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /reports/user-export?type=performance|telemetry|alerts&deviceId=&from=&to=&severity=
  async exportUserCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { type = "performance", deviceId, from, to, severity } = req.query;
      if (!deviceId) { res.status(400).send("deviceId required"); return; }

      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;
      let csvContent = "";

      if (type === "performance") {
        const d = await service.getUserPerformanceReport(user.id, deviceId as string, fromDate, toDate);
        if (!d) { res.status(403).send("Unauthorized"); return; }
        csvContent =
          "Metric,Value\n" +
          [
            csvRow("Device Name", d.device.name),
            csvRow("Device Type", d.device.type),
            csvRow("Status", d.device.status),
            csvRow("Battery Type", d.device.batteryType),
            csvRow("Capacity (kWh)", d.device.capacity),
            csvRow("Current SOC (%)", d.current.soc),
            csvRow("Current Voltage (V)", d.current.voltage),
            csvRow("Current Temperature (°C)", d.current.temperature),
            csvRow("Health Score", d.healthScore),
            csvRow("Avg SOC (%)", d.periodStats.avgSOC),
            csvRow("Avg Voltage (V)", d.periodStats.avgVoltage),
            csvRow("Avg Temperature (°C)", d.periodStats.avgTemperature),
            csvRow("Avg Current (A)", d.periodStats.avgCurrent),
            csvRow("Max Temperature (°C)", d.periodStats.maxTemperature),
            csvRow("Min SOC (%)", d.periodStats.minSOC),
            csvRow("Total Readings", d.periodStats.totalReadings),
            csvRow("Critical Alerts", d.alertSummary.critical),
            csvRow("Warning Alerts", d.alertSummary.warning),
            csvRow("Info Alerts", d.alertSummary.info),
          ].join("\n");

      } else if (type === "telemetry") {
        const d = await service.getUserTelemetryReport(user.id, deviceId as string, fromDate, toDate, 500);
        if (!d) { res.status(403).send("Unauthorized"); return; }
        const header = csvRow("Time", "SOC (%)", "Voltage (V)", "Current (A)", "Temperature (°C)", "Capacity (kWh)");
        csvContent = header + "\n" + d.records.map((r) =>
          csvRow(r.time, r.soc, r.voltage, r.current, r.temperature, r.capacity)
        ).join("\n");

      } else if (type === "alerts") {
        const d = await service.getUserAlertReport(
          user.id, deviceId as string, fromDate, toDate,
          severity ? (severity as AlertSeverity) : undefined,
        );
        if (!d) { res.status(403).send("Unauthorized"); return; }
        const header = csvRow("Date", "Alert Type", "Severity", "Message", "Resolved", "Acknowledged");
        csvContent = header + "\n" + d.alerts.map((a: any) =>
          csvRow(a.createdAt, a.alertType, a.severity, a.message, a.isResolved, a.isAcknowledged)
        ).join("\n");
      }

      const filename = `my-battery-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (err) { next(err); }
  }

  // GET /reports/export?type=fleet|devices|alerts|battery-health|audit&from=&to=&deviceId=&severity=
  async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { type = "devices", from, to, deviceId, severity, status } = req.query;

      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      let csvContent = "";

      if (type === "fleet") {
        const d = await service.getFleetReport();
        csvContent =
          "Metric,Value\n" +
          [
            csvRow("Total Devices", d.totalDevices),
            csvRow("Online Devices", d.onlineDevices),
            csvRow("Offline Devices", d.offlineDevices),
            csvRow("Warning Devices", d.warningDevices),
            csvRow("Critical Alerts (Active)", d.criticalAlerts),
            csvRow("Warning Alerts (Active)", d.warningAlerts),
            csvRow("Total Active Alerts", d.totalActiveAlerts),
            csvRow("Total Capacity (MWh)", d.totalCapacityMWh),
            csvRow("Average SOC (%)", d.avgSOC),
            csvRow("Average Temperature (°C)", d.avgTemperature),
            csvRow("Average Voltage (V)", d.avgVoltage),
            csvRow("Fleet Health Score (%)", d.fleetHealthScore),
          ].join("\n");

      } else if (type === "devices") {
        const rows = await service.getDeviceReport({
          deviceId: deviceId as string | undefined,
          status: status ? (status as DeviceStatus) : undefined,
        });
        const header = csvRow("Device Name", "Type", "Status", "SOC (%)", "Voltage (V)", "Temp (°C)", "Current (A)", "Capacity (kWh)", "Health Score", "Battery Type", "Assigned To", "Active Alerts", "Last Seen");
        csvContent = header + "\n" + rows.map((r) =>
          csvRow(r.name, r.type, r.status, r.soc, r.voltage, r.temperature, r.current, r.capacity, r.healthScore, r.batteryType, r.assignedTo, r.activeAlerts, r.lastSeen)
        ).join("\n");

      } else if (type === "alerts") {
        const rows = await service.getAlertReport({
          from: fromDate, to: toDate,
          deviceId: deviceId as string | undefined,
          severity: severity ? (severity as AlertSeverity) : undefined,
        });
        const header = csvRow("Date", "Device", "Alert Type", "Severity", "Message", "Resolved", "Acknowledged", "Resolved By", "Acknowledged By");
        csvContent = header + "\n" + rows.map((r) =>
          csvRow(
            new Date(r.createdAt).toISOString(),
            r.device?.deviceName,
            r.alertType,
            r.severity,
            r.message,
            r.isResolved,
            r.isAcknowledged,
            (r as any).resolvedBy?.fullName,
            (r as any).acknowledgedBy?.fullName,
          )
        ).join("\n");

      } else if (type === "battery-health") {
        const rows = await service.getBatteryHealthReport();
        const header = csvRow("Device Name", "Status", "SOC (%)", "Voltage (V)", "Temp (°C)", "Health Score", "Total Alerts");
        csvContent = header + "\n" + rows.map((r) =>
          csvRow(r.name, r.status, r.soc, r.voltage, r.temperature, r.healthScore, r.totalAlerts)
        ).join("\n");

      } else if (type === "audit") {
        const rows = await service.getAuditReport({ from: fromDate, to: toDate });
        const header = csvRow("Date", "User", "Email", "Role", "Action", "Entity", "Entity ID", "IP Address");
        csvContent = header + "\n" + rows.map((r) =>
          csvRow(
            new Date(r.createdAt).toISOString(),
            (r as any).user?.fullName,
            (r as any).user?.email,
            (r as any).user?.role,
            r.action,
            r.entity,
            r.entityId,
            r.ipAddress,
          )
        ).join("\n");
      }

      const filename = `bms-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (err) { next(err); }
  }
}
