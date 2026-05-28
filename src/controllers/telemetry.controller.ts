import { Request, Response, NextFunction } from "express";
import { TelemetryService } from "../services/telemetry.service";
import { sendSuccess } from "../utils/response";

const service = new TelemetryService();

export class TelemetryController {
  // POST /telemetry
  async ingest(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await service.ingest(req.body);
      res.status(201);
      return sendSuccess(res, "Telemetry recorded", record);
    } catch (err) { next(err); }
  }

  // POST /telemetry/bulk
  async ingestBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.ingestBulk(req.body.records);
      res.status(201);
      return sendSuccess(res, `${result.count} telemetry records ingested`, { count: result.count });
    } catch (err) { next(err); }
  }

  // GET /telemetry/all/latest
  async getAllLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getAllLatest();
      return sendSuccess(res, "Latest telemetry per device", data);
    } catch (err) { next(err); }
  }

  // GET /telemetry/thermal/summary
  async getThermalSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getThermalSummary();
      return sendSuccess(res, "Thermal summary", data);
    } catch (err) { next(err); }
  }

  // GET /telemetry/:deviceId/latest
  async getLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await service.getLatest(String(req.params.deviceId));
      return sendSuccess(res, "Latest telemetry", record);
    } catch (err) { next(err); }
  }

  // GET /telemetry/:deviceId/history
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { records, pagination } = await service.getHistory(
        String(req.params.deviceId),
        req.query as any
      );
      return sendSuccess(res, "Telemetry history", records, pagination);
    } catch (err) { next(err); }
  }
}
