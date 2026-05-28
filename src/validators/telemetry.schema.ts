import { z } from "zod";

// ---------- Single telemetry record ----------
const telemetryRecordSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID"),
  soc: z.number().min(0).max(100, "SOC must be 0–100"),
  voltage: z.number().positive("Voltage must be positive"),
  current: z.number(),
  temperature: z.number(),
  capacity: z.number().positive("Capacity must be positive"),
  speed: z.number().optional(),
  acceleration: z.number().optional(),
  recordedAt: z.string().datetime({ offset: true }).optional(),
});

// ---------- Ingest single ----------
export const ingestSchema = z.object({
  body: telemetryRecordSchema,
});

// ---------- Bulk ingest ----------
export const bulkIngestSchema = z.object({
  body: z.object({
    records: z
      .array(telemetryRecordSchema)
      .min(1, "At least one record is required")
      .max(1000, "Bulk ingest limit is 1000 records per request"),
  }),
});

// ---------- Device ID param ----------
const deviceIdParam = z.object({
  params: z.object({
    deviceId: z.string().uuid("Invalid device ID"),
  }),
});

export const latestByDeviceSchema = deviceIdParam;

// ---------- History query ----------
export const historySchema = z.object({
  params: z.object({
    deviceId: z.string().uuid("Invalid device ID"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    hours: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    interval: z.string().optional(),
  }),
});
