import { Request, Response, NextFunction } from "express";
import { AuditRepository } from "../repositories/audit.repository";
import { sendSuccess } from "../utils/response";

const repo = new AuditRepository();

function csvRow(...fields: (string | number | boolean | null | undefined)[]): string {
  return fields
    .map((f) => `"${String(f ?? "").replace(/"/g, '""')}"`)
    .join(",");
}

export class AuditController {
  // GET /api/v1/audit?page=&limit=&search=&entity=&action=&userId=&from=&to=
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = "1", limit = "30", search, entity, action, userId, from, to } = req.query;

      const result = await repo.getLogs({
        page: Number(page),
        limit: Number(limit),
        search: search as string | undefined,
        entity: entity as string | undefined,
        action: action as string | undefined,
        userId: userId as string | undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      });

      return sendSuccess(res, "Audit logs retrieved", result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/audit/stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await repo.getStats();
      return sendSuccess(res, "Audit stats retrieved", data);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/audit/filters
  async getFilters(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await repo.getDistinctValues();
      return sendSuccess(res, "Audit filter options retrieved", data);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/audit/export
  async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, entity, action, userId, from, to } = req.query;

      const result = await repo.exportLogs({
        search: search as string | undefined,
        entity: entity as string | undefined,
        action: action as string | undefined,
        userId: userId as string | undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      });

      const header = csvRow("Date", "User", "Email", "Role", "Module", "Action", "Entity ID", "IP Address");
      const rows = result.data.map((log: any) =>
        csvRow(
          new Date(log.createdAt).toISOString(),
          log.user?.fullName ?? "—",
          log.user?.email ?? "—",
          log.user?.role ?? "—",
          log.entity,
          log.action,
          log.entityId,
          log.ipAddress ?? "—",
        ),
      );

      const csv = [header, ...rows].join("\n");
      const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(csv);
    } catch (err) {
      next(err);
    }
  }
}
