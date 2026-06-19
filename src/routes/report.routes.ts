import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();
const ctrl = new ReportController();

router.use(authenticate);

// Fleet, device, health, audit — admin only
router.get("/fleet", authorize("ADMIN"), ctrl.getFleetReport.bind(ctrl));
router.get("/devices", authorize("ADMIN"), ctrl.getDeviceReport.bind(ctrl));
router.get("/alerts", authorize("ADMIN", "USER"), ctrl.getAlertReport.bind(ctrl));
router.get("/battery-health", authorize("ADMIN"), ctrl.getBatteryHealthReport.bind(ctrl));
router.get("/audit", authorize("ADMIN"), ctrl.getAuditReport.bind(ctrl));

// Unified CSV export (admin + user shared endpoint for admin types)
router.get("/export", authorize("ADMIN", "USER"), ctrl.exportCSV.bind(ctrl));

// User-scoped report endpoints (ownership validated inside controller)
router.get("/user-performance", authorize("ADMIN", "USER"), ctrl.getUserPerformanceReport.bind(ctrl));
router.get("/user-telemetry", authorize("ADMIN", "USER"), ctrl.getUserTelemetryReport.bind(ctrl));
router.get("/user-alerts", authorize("ADMIN", "USER"), ctrl.getUserAlertReport.bind(ctrl));
router.get("/user-export", authorize("ADMIN", "USER"), ctrl.exportUserCSV.bind(ctrl));

export default router;
