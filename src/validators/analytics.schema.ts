import { z } from "zod";

// ---------- Dashboard ----------
// (Usually no query params needed for general dashboard summary, but we allow optional deviceId)
export const dashboardSummarySchema = z.object({
  query: z.object({
    deviceId: z.string().min(1, "Device ID is required").optional(),
  }),
});

// ---------- Analytics ----------
export const trendSchema = z.object({
  query: z.object({
    deviceId: z.string().min(1, "Device ID is required").optional(),
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
    deviceId: z.string().min(1, "Device ID is required").optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  }),
});
