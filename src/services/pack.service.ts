import { PackRepository } from "../repositories/pack.repository";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";

const repo = new PackRepository();

export class PackService {
  async createPack(data: {
    deviceId: string;
    totalRows: number;
    totalColumns: number;
    capacityFade?: number;
    resistanceRise?: number;
    coulombEfficiency?: number;
  }) {
    return repo.create({
      device: { connect: { id: data.deviceId } },
      totalRows: data.totalRows,
      totalColumns: data.totalColumns,
      capacityFade: data.capacityFade,
      resistanceRise: data.resistanceRise,
      coulombEfficiency: data.coulombEfficiency,
    });
  }

  async getPacks(query: { page?: string; limit?: string; deviceId?: string }) {
    const pagination = parsePagination(query);
    const { packs, total } = await repo.findAll(pagination.skip, pagination.limit, query.deviceId);
    return { packs, pagination: buildPaginationMeta(total, pagination) };
  }

  async getPackById(packId: string) {
    const pack = await repo.findById(packId);
    if (!pack) throw Object.assign(new Error("Battery Pack not found"), { status: 404 });
    return pack;
  }

  async ingestCells(packId: string, cells: Array<{
    cellId: string;
    rowIndex: number;
    colIndex: number;
    voltage: number;
    temperature: number;
    soc: number;
    recordedAt?: string;
  }>) {
    // Verify pack exists
    await this.getPackById(packId);

    const mapped = cells.map((c) => ({
      packId,
      cellId: c.cellId,
      rowIndex: c.rowIndex,
      colIndex: c.colIndex,
      voltage: c.voltage,
      temperature: c.temperature,
      soc: c.soc,
      recordedAt: c.recordedAt ? new Date(c.recordedAt) : undefined,
    }));

    return repo.ingestCells(mapped);
  }

  private buildMatrix(cells: any[], rows: number, cols: number, field: "voltage" | "temperature") {
    // Initialize empty sparse matrix with nulls
    const matrix: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

    for (const c of cells) {
      if (c.rowIndex >= 0 && c.rowIndex < rows && c.colIndex >= 0 && c.colIndex < cols) {
        matrix[c.rowIndex][c.colIndex] = Number(c[field]);
      }
    }

    return matrix;
  }

  async getBatteryMatrix(packId: string) {
    const pack = await this.getPackById(packId);
    const latestCells = await repo.getLatestCellTelemetry(packId);

    return {
      packId,
      rows: pack.totalRows,
      cols: pack.totalColumns,
      batteryMatrix: this.buildMatrix(latestCells, pack.totalRows, pack.totalColumns, "voltage"),
    };
  }

  async getThermalMatrix(packId: string) {
    const pack = await this.getPackById(packId);
    const latestCells = await repo.getLatestCellTelemetry(packId);

    return {
      packId,
      rows: pack.totalRows,
      cols: pack.totalColumns,
      thermalMatrix: this.buildMatrix(latestCells, pack.totalRows, pack.totalColumns, "temperature"),
    };
  }
}
