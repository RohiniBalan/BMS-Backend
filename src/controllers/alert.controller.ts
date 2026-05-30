import { Request, Response, NextFunction } from "express";
import { AlertService } from "../services/alert.service";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

const service = new AlertService();

export class AlertController {
  // GET /alerts
  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { alerts, pagination } = await service.getAlerts(req.query as any);
      return sendSuccess(res, "Alerts retrieved", alerts, pagination);
    } catch (err) { next(err); }
  }

  // GET /alerts/recent
  // async getRecent(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const alerts = await service.getRecent(req.query.limit as string);
  //     return sendSuccess(res, "Recent alerts retrieved", alerts);
  //   } catch (err) { next(err); }
  // }

  async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
const role = req.user!.role;

const alerts = await service.getRecent(
  req.query.limit as string,
  { userId, role }
);
      return sendSuccess(res, "Recent alerts retrieved", alerts);
    } catch (err) { next(err); }
  }


  // GET /alerts/summary
  // async getSummary(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const summary = await service.getSummary(req.query.deviceId as string);
  //     return sendSuccess(res, "Alert summary retrieved", summary);
  //   } catch (err) { next(err); }
  // }

  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const summary = await service.getSummary(
      req.query.deviceId as string,
      { userId, role }
    );

    return sendSuccess(res, "Alert summary retrieved", summary);
  } catch (err) {
    next(err);
  }
}

  // POST /alerts
  async createAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await service.createAlert(req.body);
      res.status(201);
      return sendSuccess(res, "Alert created", alert);
    } catch (err) { next(err); }
  }

  // PATCH /alerts/:id/resolve
  async resolveAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const alert = await service.resolveAlert(String(req.params.id), userId);
      return sendSuccess(res, "Alert resolved", alert);
    } catch (err) { next(err); }
  }

  // DELETE /alerts/:id
  async deleteAlert(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteAlert(String(req.params.id));
      return sendSuccess(res, "Alert deleted");
    } catch (err) { next(err); }
  }

  // POST /alerts/auto-check
  async autoCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.runAutoCheck();
      return sendSuccess(res, "Auto-check completed", result);
    } catch (err) { next(err); }
  }
}
