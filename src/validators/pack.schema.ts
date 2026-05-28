import { z } from "zod";

export const createPackSchema = z.object({
  body: z.object({
    deviceId: z.string().uuid("Invalid device ID"),
    totalRows: z.number().int().min(1),
    totalColumns: z.number().int().min(1),
    capacityFade: z.number().optional(),
    resistanceRise: z.number().optional(),
    coulombEfficiency: z.number().optional(),
  }),
});

export const listPacksSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    deviceId: z.string().uuid().optional(),
  }),
});

export const packIdSchema = z.object({
  params: z.object({
    packId: z.string().uuid("Invalid pack ID"),
  }),
});

export const ingestCellsSchema = z.object({
  params: z.object({
    packId: z.string().uuid("Invalid pack ID"),
  }),
  body: z.object({
    cells: z.array(z.object({
      cellId: z.string().min(1),
      rowIndex: z.number().int().min(0),
      colIndex: z.number().int().min(0),
      voltage: z.number(),
      temperature: z.number(),
      soc: z.number().min(0).max(100),
      recordedAt: z.string().datetime({ offset: true }).optional(),
    })).min(1).max(5000), // Arbitrary safe limit for bulk ingest
  }),
});
