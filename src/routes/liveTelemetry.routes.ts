import { Router } from "express";
import { LiveTelemetryController } from "../controllers/liveTelemetry.controller";

const router = Router();

const controller = new LiveTelemetryController();

router.get("/start", controller.startStreaming);

router.get("/latest", controller.getLatest);

export default router;