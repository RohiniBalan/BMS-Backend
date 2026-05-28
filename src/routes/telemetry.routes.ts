import { Router } from "express";
import { TelemetryController } from "../controllers/telemetry.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate";
import {
  ingestSchema,
  bulkIngestSchema,
  latestByDeviceSchema,
  historySchema,
} from "../validators/telemetry.schema";

const router = Router();
const ctrl = new TelemetryController();

// All telemetry routes require authentication
router.use(authenticate);

// Static routes FIRST (before param routes to avoid collisions)

// GET /api/v1/telemetry/all/latest
router.get("/all/latest", authorize("ADMIN", "USER"), ctrl.getAllLatest.bind(ctrl));

// GET /api/v1/telemetry/thermal/summary
router.get("/thermal/summary", authorize("ADMIN", "USER"), ctrl.getThermalSummary.bind(ctrl));

// POST /api/v1/telemetry  (single ingest)
router.post("/", authorize("ADMIN"), validate(ingestSchema), ctrl.ingest.bind(ctrl));

// POST /api/v1/telemetry/bulk
router.post("/bulk", authorize("ADMIN"), validate(bulkIngestSchema), ctrl.ingestBulk.bind(ctrl));

// Param routes AFTER static routes

// GET /api/v1/telemetry/:deviceId/latest
router.get("/:deviceId/latest", authorize("ADMIN", "USER"), validate(latestByDeviceSchema), ctrl.getLatest.bind(ctrl));

// GET /api/v1/telemetry/:deviceId/history
router.get("/:deviceId/history", authorize("ADMIN", "USER"), validate(historySchema), ctrl.getHistory.bind(ctrl));

export default router;
