import { AlertSeverity, DeviceStatus } from "@prisma/client";
import { ReportRepository } from "../repositories/report.repository";

const repo = new ReportRepository();

export class ReportService {
  getFleetReport() {
    return repo.getFleetReport();
  }

  getDeviceReport(filters: { deviceId?: string; status?: DeviceStatus }) {
    return repo.getDeviceReport(filters);
  }

  getAlertReport(filters: {
    from?: Date;
    to?: Date;
    deviceId?: string;
    severity?: AlertSeverity;
  }) {
    return repo.getAlertReport(filters);
  }

  getBatteryHealthReport() {
    return repo.getBatteryHealthReport();
  }

  getAuditReport(filters: { from?: Date; to?: Date }) {
    return repo.getAuditReport(filters);
  }

  getUserPerformanceReport(userId: string, deviceId: string, from?: Date, to?: Date) {
    return repo.getUserPerformanceReport(userId, deviceId, from, to);
  }

  getUserTelemetryReport(userId: string, deviceId: string, from?: Date, to?: Date, limit?: number) {
    return repo.getUserTelemetryReport(userId, deviceId, from, to, limit);
  }

  getUserAlertReport(userId: string, deviceId: string, from?: Date, to?: Date, severity?: AlertSeverity) {
    return repo.getUserAlertReport(userId, deviceId, from, to, severity);
  }
}
