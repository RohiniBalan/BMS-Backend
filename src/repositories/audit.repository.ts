import prisma from "../prisma/prisma";

export interface AuditLogFilters {
  page: number;
  limit: number;
  search?: string;
  entity?: string;
  action?: string;
  userId?: string;
  from?: Date;
  to?: Date;
}

export class AuditRepository {
  async getLogs(filters: AuditLogFilters) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: "insensitive" } },
        { entity: { contains: filters.search, mode: "insensitive" } },
        { entityId: { contains: filters.search, mode: "insensitive" } },
        { user: { fullName: { contains: filters.search, mode: "insensitive" } } },
        { user: { email: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    if (filters.entity) where.entity = { equals: filters.entity, mode: "insensitive" };
    if (filters.action) where.action = { equals: filters.action, mode: "insensitive" };
    if (filters.userId) where.userId = filters.userId;

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          user: { select: { fullName: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit) || 1,
    };
  }

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [total, todayCount, activeUsersGroups, failedCount, criticalCount] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.auditLog.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.auditLog.count({
        where: {
          OR: [
            { action: { contains: "FAILED", mode: "insensitive" } },
            { action: { contains: "ERROR", mode: "insensitive" } },
            { action: { contains: "DENIED", mode: "insensitive" } },
          ],
        },
      }),
      prisma.auditLog.count({
        where: {
          OR: [
            { action: { contains: "DELETE", mode: "insensitive" } },
            { action: { contains: "REMOVE", mode: "insensitive" } },
            { action: { contains: "FAILED", mode: "insensitive" } },
            { action: { contains: "BLOCK", mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return {
      totalActivities: total,
      todayActivities: todayCount,
      activeUsers: activeUsersGroups.length,
      failedActions: failedCount,
      criticalEvents: criticalCount,
    };
  }

  async getDistinctValues() {
    const [entityRows, actionRows] = await Promise.all([
      prisma.auditLog.findMany({
        distinct: ["entity"],
        select: { entity: true },
        orderBy: { entity: "asc" },
      }),
      prisma.auditLog.findMany({
        distinct: ["action"],
        select: { action: true },
        orderBy: { action: "asc" },
      }),
    ]);

    return {
      entities: entityRows.map((r) => r.entity),
      actions: actionRows.map((r) => r.action),
    };
  }

  async exportLogs(filters: Omit<AuditLogFilters, "page" | "limit">) {
    return this.getLogs({ ...filters, page: 1, limit: 10000 });
  }
}
