import prisma from "../prisma/prisma";
import { Prisma } from "@prisma/client";

export class PackRepository {
  // ---------- Create Pack ----------
  async create(data: Prisma.BatteryPackCreateInput) {
    return prisma.batteryPack.create({ data });
  }

  // ---------- List Packs ----------
  async findAll(skip: number, take: number, deviceId?: string) {
    const where: Prisma.BatteryPackWhereInput = {};
    if (deviceId) where.deviceId = deviceId;

    const [packs, total] = await Promise.all([
      prisma.batteryPack.findMany({
        where,
        skip,
        take,
        include: { device: { select: { deviceName: true } } },
      }),
      prisma.batteryPack.count({ where }),
    ]);

    return { packs, total };
  }

  // ---------- Find by ID ----------
  async findById(id: string) {
    return prisma.batteryPack.findUnique({
      where: { id },
      include: { device: { select: { deviceName: true } } },
    });
  }

  // ---------- Ingest Cells ----------
  async ingestCells(cells: Prisma.CellTelemetryCreateManyInput[]) {
    return prisma.cellTelemetry.createMany({ data: cells });
  }

  // ---------- Latest Cell Telemetry Matrix Data ----------
  async getLatestCellTelemetry(packId: string) {
    // Optimization: Avoid N+1 queries.
    // Step 1: get max recordedAt per cellId for this pack
    const maxPerCell = await prisma.cellTelemetry.groupBy({
      by: ["cellId"],
      where: { packId },
      _max: { recordedAt: true },
    });

    if (maxPerCell.length === 0) return [];

    // Step 2: fetch the actual rows matching cellId + recordedAt
    // Doing Promise.all for a matrix (e.g. 100 cells) might be 100 queries.
    // An alternative is querying where cellId IN (...) and filtering in JS to find exact match.
    // Let's do a batched IN query which is far more optimal for a matrix.
    const cellIds = maxPerCell.map(m => m.cellId);
    
    // Fetch all records for those cellIds in the last say 24h, or just fetch all and filter in JS if it's small, 
    // but a better approach in Prisma without raw is to just use a raw query or fetch recent.
    // Wait, let's use Prisma.$queryRaw for true batching since Prisma doesn't support tuple IN clauses natively.

    const rawRecords: any[] = await prisma.$queryRaw`
      SELECT t.* 
      FROM "CellTelemetry" t
      INNER JOIN (
        SELECT "cellId", MAX("recordedAt") as "maxAt"
        FROM "CellTelemetry"
        WHERE "packId" = ${packId}
        GROUP BY "cellId"
      ) grouped
      ON t."cellId" = grouped."cellId" AND t."recordedAt" = grouped."maxAt"
      WHERE t."packId" = ${packId}
    `;

    return rawRecords;
  }
}
