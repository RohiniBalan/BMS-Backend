import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { sendSuccess } from "../utils/response";
import { stringify } from "csv-stringify"; // need to check if available, otherwise manual
// Since we don't know if csv-stringify is installed, we will build a manual CSV stringifier for safety.
import { Readable } from "stream";

const service = new AnalyticsService();

export class AnalyticsController {
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getDashboardSummary(req.query.deviceId as string);
      return sendSuccess(res, "Dashboard summary retrieved", data);
    } catch (err) { next(err); }
  }

  async getSocDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getSocDistribution();
      return sendSuccess(res, "SOC distribution retrieved", data);
    } catch (err) { next(err); }
  }

  async getSocTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getSocTrend(req.query.deviceId as string, req.query.range as string);
      return sendSuccess(res, "SOC trend retrieved", data);
    } catch (err) { next(err); }
  }

  async getTemperatureTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getTemperatureTrend(req.query.deviceId as string, req.query.range as string);
      return sendSuccess(res, "Temperature trend retrieved", data);
    } catch (err) { next(err); }
  }

  async getFleetSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getFleetSummary(req.query.range as string);
      return sendSuccess(res, "Fleet summary retrieved", data);
    } catch (err) { next(err); }
  }

  async getDailyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getDailyReport(
        req.query.deviceId as string,
        req.query.from as string,
        req.query.to as string
      );
      return sendSuccess(res, "Daily report retrieved", data);
    } catch (err) { next(err); }
  }

  async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getDailyReport(
        req.query.deviceId as string,
        req.query.from as string,
        req.query.to as string
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="report.csv"');

      // Manual CSV stringifier for stream response
      const header = "Date,Device Name,SOC,Voltage,Current,Temperature,Capacity\n";
      
      const readable = new Readable({
        read() {} // required, but we push manually
      });
      
      readable.pipe(res);
      readable.push(header);

      for (const row of data) {
        const dateStr = row.recordedAt.toISOString();
        const devName = row.device?.deviceName || "Unknown";
        const line = `${dateStr},"${devName}",${row.soc},${row.voltage},${row.current},${row.temperature},${row.capacity}\n`;
        readable.push(line);
      }
      
      readable.push(null); // end stream
    } catch (err) {
      next(err);
    }
  }

  // Get Health popup data
  async getHealthPopupData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;

    const data = await service.getHealthPopupData(user);

    return sendSuccess(
      res,
      "Health popup data retrieved",
      data
    );
  } catch (err) {
    next(err);
  }
}
}
