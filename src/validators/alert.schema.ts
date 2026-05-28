import { z } from "zod";
import { AlertSeverity, AlertType } from "@prisma/client";

const severityEnum = z.nativeEnum(AlertSeverity);
const typeEnum = z.nativeEnum(AlertType);

// ---------- List / Query Alerts ----------
export const listAlertsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isResolved: z.enum(["true", "false"]).optional(),
    severity: severityEnum.optional(),
    alertType: typeEnum.optional(),
    deviceId: z.string().uuid().optional(),
  }),
});

// ---------- Create Alert (Manual or Webhook) ----------
export const createAlertSchema = z.object({
  body: z.object({
    deviceId: z.string().uuid("Invalid device ID"),
    alertType: typeEnum,
    severity: severityEnum,
    message: z.string().min(1, "Message is required"),
  }),
});

// ---------- Resolve Alert ----------
export const resolveAlertSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid alert ID"),
  }),
});

// ---------- Delete Alert ----------
export const deleteAlertSchema = resolveAlertSchema;

// ---------- Summary / Recent ----------
export const summaryAlertsSchema = z.object({
  query: z.object({
    deviceId: z.string().uuid().optional(),
  }),
});
