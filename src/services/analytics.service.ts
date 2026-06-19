import { AnalyticsRepository } from "../repositories/analytics.repository";

const repo = new AnalyticsRepository();

export class AnalyticsService {
  async getDashboardSummary(deviceId?: string) {
    return repo.getDashboardSummary(deviceId);
  }

  async getSocDistribution() {
    return repo.getSocDistribution();
  }

  async getSocTrend(deviceId?: string, range?: string) {
    return repo.getTrend("soc", deviceId, range);
  }

  async getTemperatureTrend(deviceId?: string, range?: string) {
    return repo.getTrend("temperature", deviceId, range);
  }

  async getVoltageTrend(deviceId?: string, range?: string) {
    return repo.getTrend("voltage", deviceId, range);
  }

  async getCurrentTrend(deviceId?: string, range?: string) {
    return repo.getTrend("current", deviceId, range);
  }

  async getAlertAnalytics(range?: string) {
    return repo.getAlertAnalytics(range);
  }

  async getDeviceComparison() {
    return repo.getDeviceComparison();
  }

  async getUserDeviceAnalytics(userId: string, deviceId: string, range?: string) {
    return repo.getUserDeviceAnalytics(userId, deviceId, range);
  }

  async getFleetSummary(range?: string) {
    return repo.getFleetSummary(range);
  }

  async getDailyReport(deviceId?: string, from?: string, to?: string) {
    // Basic alias to getReportData
    return repo.getReportData(deviceId, from, to);
  }

  async getHealthPopupData(user?: { id: string; role: string }) {
  return repo.getHealthPopupData(user);
}
}
