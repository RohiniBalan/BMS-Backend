import { Request, Response, NextFunction } from "express";
import { PackService } from "../services/pack.service";
import { sendSuccess } from "../utils/response";

const service = new PackService();

export class PackController {
  async createPack(req: Request, res: Response, next: NextFunction) {
    try {
      const pack = await service.createPack(req.body);
      res.status(201);
      return sendSuccess(res, "Battery pack created", pack);
    } catch (err) { next(err); }
  }

  async getPacks(req: Request, res: Response, next: NextFunction) {
    try {
      const { packs, pagination } = await service.getPacks(req.query);
      return sendSuccess(res, "Battery packs retrieved", packs, pagination);
    } catch (err) { next(err); }
  }

  async getPackById(req: Request, res: Response, next: NextFunction) {
    try {
      const pack = await service.getPackById(String(req.params.packId));
      return sendSuccess(res, "Battery pack retrieved", pack);
    } catch (err) { next(err); }
  }

  async ingestCells(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.ingestCells(String(req.params.packId), req.body.cells);
      res.status(201);
      return sendSuccess(res, "Cells telemetry ingested", result);
    } catch (err) { next(err); }
  }

  async getBatteryMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const matrix = await service.getBatteryMatrix(String(req.params.packId));
      return sendSuccess(res, "Battery matrix retrieved", matrix);
    } catch (err) { next(err); }
  }

  async getThermalMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const matrix = await service.getThermalMatrix(String(req.params.packId));
      return sendSuccess(res, "Thermal matrix retrieved", matrix);
    } catch (err) { next(err); }
  }
}
