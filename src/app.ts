import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";

import passport from "./config/passport";

import authRoutes from "./routes/auth.routes";
import batteryRoutes from "./routes/battery.routes";
import thermalRoutes from "./routes/thermalSafety.routes";
import deviceRoutes from "./routes/device.routes";
import telemetryRoutes from "./routes/telemetry.routes";
import alertRoutes from "./routes/alert.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import analyticsRoutes from "./routes/analytics.routes";
import reportRoutes from "./routes/report.routes";
import packRoutes from "./routes/pack.routes";
import liveTelemetryRoutes from "./routes/liveTelemetry.routes";
import liveStreamRoutes from "./routes/liveStream.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Core middleware
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(
  session({
    secret: "microsoft-secret",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/devices", deviceRoutes);
app.use("/api/v1/telemetry", telemetryRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/packs", packRoutes);
app.use("/api/v1", batteryRoutes);
app.use("/api/v1", thermalRoutes);
app.use("/api/v1/live-telemetry", liveTelemetryRoutes);
app.use("/api/v1/live", liveStreamRoutes);

app.get("/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend reachable"
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;