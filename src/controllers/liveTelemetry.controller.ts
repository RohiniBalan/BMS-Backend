import { Request, Response } from "express";
import path from "path";
import { liveTelemetryService } from "../services/liveTelemetry.service";

export class LiveTelemetryController {
  startStreaming = async (req: Request, res: Response) => {
    try {
      const filePath = path.join(
        process.cwd(),
        "uploads",
        "telemetry.xlsx"
      );

      // 1. Load Excel data
      const result = liveTelemetryService.loadExcel(filePath);

      // 2. Start streaming ONLY ONCE
      liveTelemetryService.startStreaming();

      res.json({
        success: true,
        message: "Streaming started",
        totalRows: result.totalRows,
      });

    } catch (error) {
      console.error("Streaming error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to start streaming",
      });
    }
  };

  getLatest = async (req: Request, res: Response) => {
    try {
      const data = liveTelemetryService.getLatest();

      res.json({
        success: true,
        data: data ?? {},
      });
    } catch (error) {
      res.status(500).json({
        success: false,
      });
    }
  };
}