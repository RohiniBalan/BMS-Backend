import * as XLSX from "xlsx";
import { AlertService } from "./alert.service";

const alertService = new AlertService();

export class LiveTelemetryService {
  private clients: ((data: any) => void)[] = [];
  private rows: any[] = [];
  private currentIndex = 0;
  private interval: NodeJS.Timeout | null = null;
  private latestData: any = null;

  loadExcel(filePath: string) {
    const workbook = XLSX.readFile(filePath);

    const sheetName = workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];

    this.rows = XLSX.utils.sheet_to_json(sheet);

    // Remove non-data rows
    this.rows = this.rows.filter(
      (row) =>
        row.__EMPTY_1 !== "Voltage (V)" &&
        row.__EMPTY_2 !== "Current (A)" &&
        row.__EMPTY_3 !== "Temperature (°C)" &&
        row.__EMPTY_4 !== "SOC (%)" &&
        typeof row.__EMPTY_1 === "number",
    );

    this.currentIndex = 0;

    return {
      totalRows: this.rows.length,
    };
  }

  startStreaming() {
    if (this.interval){ 
      return;
    }
    if (!this.rows.length) {
    console.error("No Excel data loaded!");
    return;
  }

    this.interval = setInterval(() => {
      if (this.currentIndex >= this.rows.length) {
        this.stopStreaming();
        return;
      }

      const row = this.rows[this.currentIndex];

      this.latestData = {
        time: this.currentIndex * 5,

        voltage: Number(row.__EMPTY_1) || 0,

        current: Number(row.__EMPTY_2) || 0,

        temperature: Number(row.__EMPTY_3) || 0,

        soc: Number(row.__EMPTY_4) || 0,
      };

      const alerts = alertService.checkLiveAlerts(this.latestData);

      const payload = {
  ...this.latestData,
  alerts,
};

// send to all connected frontend clients
this.clients.forEach((cb) => cb(payload));

      this.currentIndex++;
    }, 5000);
  }
  stopStreaming() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getLatest() {
    return this.latestData;
  }

  subscribe(callback: (data: any) => void) {
  this.clients.push(callback);

  // send last known data immediately
  if (this.latestData) {
    callback({
      ...this.latestData,
      alerts: alertService.checkLiveAlerts(this.latestData),
    });
  }
}

unsubscribe(callback: (data: any) => void) {
  this.clients = this.clients.filter(cb => cb !== callback);
}
}

export const liveTelemetryService = new LiveTelemetryService();
