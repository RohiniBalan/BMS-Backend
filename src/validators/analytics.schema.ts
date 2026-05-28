import { z } from "zod";

// ---------- Dashboard ----------
// (Usually no query params needed for general dashboard summary, but we allow optional deviceId)
export const dashboardSummarySchema = z.object({
  query: z.object({
    deviceId: z.string().uuid().optional(),
  }),
});

// ---------- Analytics ----------
export const trendSchema = z.object({
  query: z.object({
    deviceId: z.string().uuid("Invalid device ID").optional(),
    range: z.enum(["24h", "7d", "30d"]).default("24h"),
  }),
});

export const fleetSummarySchema = z.object({
  query: z.object({
    range: z.enum(["24h", "7d", "30d"]).default("24h"),
  }),
});

// ---------- Reports ----------
export const reportSchema = z.object({
  query: z.object({
    deviceId: z.string().uuid().optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  }),
});
