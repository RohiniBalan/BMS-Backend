import { Router } from "express";
import { AlertController } from "../controllers/alert.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate";
import { auditLog } from "../middleware/audit.middleware";
import {
  listAlertsSchema,
  createAlertSchema,
  resolveAlertSchema,
  deleteAlertSchema,
  summaryAlertsSchema,
  acknowledgeAlertSchema,
} from "../validators/alert.schema";

const router = Router();
const ctrl = new AlertController();

// All alert routes require authentication
router.use(authenticate);

// Static routes FIRST

// GET /api/v1/alerts/summary
router.get("/summary", authorize("ADMIN", "USER"), validate(summaryAlertsSchema), ctrl.getSummary.bind(ctrl));

// GET /api/v1/alerts/stats
router.get("/stats", authorize("ADMIN", "USER"), ctrl.getStats.bind(ctrl));

// GET /api/v1/alerts/recent
router.get("/recent", authorize("ADMIN", "USER"), ctrl.getRecent.bind(ctrl));

// POST /api/v1/alerts/auto-check  (Admin only manual trigger)
router.post("/auto-check", authorize("ADMIN"), auditLog("TRIGGER_AUTO_CHECK", "Alert", "SYSTEM"), ctrl.autoCheck.bind(ctrl));

// GET /api/v1/alerts
router.get("/", authorize("ADMIN", "USER"), validate(listAlertsSchema), ctrl.getAlerts.bind(ctrl));

// POST /api/v1/alerts
router.post("/", authorize("ADMIN"), validate(createAlertSchema), auditLog("CREATE_ALERT", "Alert", "NEW"), ctrl.createAlert.bind(ctrl));

// Param routes AFTER static routes

// PATCH /api/v1/alerts/:id/resolve
router.patch("/:id/resolve", authorize("ADMIN", "USER"), validate(resolveAlertSchema), auditLog("RESOLVE_ALERT", "Alert", "req.params.id"), ctrl.resolveAlert.bind(ctrl));

// PATCH /api/v1/alerts/:id/acknowledge
router.patch("/:id/acknowledge", authorize("ADMIN", "USER"), validate(acknowledgeAlertSchema), auditLog("ACKNOWLEDGE_ALERT", "Alert", "req.params.id"), ctrl.acknowledgeAlert.bind(ctrl));

// DELETE /api/v1/alerts/:id
router.delete("/:id", authorize("ADMIN"), validate(deleteAlertSchema), auditLog("DELETE_ALERT", "Alert", "req.params.id"), ctrl.deleteAlert.bind(ctrl));

export default router;
