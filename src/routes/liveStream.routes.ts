import { Router } from "express";
import { liveTelemetryService } from "../services/liveTelemetry.service";
import path from "path";

const router = Router();

let initialized = false;

router.get("/stream", (req, res) => {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // AUTO START STREAM ON FIRST CONNECTION
  if (!initialized) {
    const filePath = path.join(process.cwd(), "uploads", "telemetry.xlsx");

    const result = liveTelemetryService.loadExcel(filePath);
    console.log("📊 Excel loaded:", result.totalRows);

    liveTelemetryService.startStreaming();

    initialized = true;
    console.log("🚀 Streaming auto-started");
  }

  const send = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  liveTelemetryService.subscribe(send);

  console.log("Client connected");

  req.on("close", () => {
    liveTelemetryService.unsubscribe(send);
    console.log("Client disconnected");
  });
});

export default router;