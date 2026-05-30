import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate";
import { trendSchema, fleetSummarySchema } from "../validators/analytics.schema";

const router = Router();
const ctrl = new AnalyticsController();

// All routes require authentication
router.use(authenticate);
// Viewers and Admins can access analytics
router.use(authorize("ADMIN", "USER"));

// ---------- Analytics ----------
router.get("/soc-trend", validate(trendSchema), ctrl.getSocTrend.bind(ctrl));
router.get("/temperature-trend", validate(trendSchema), ctrl.getTemperatureTrend.bind(ctrl));
router.get("/fleet-summary", validate(fleetSummarySchema), ctrl.getFleetSummary.bind(ctrl));
router.get(
  "/health-popup",
  ctrl.getHealthPopupData.bind(ctrl)
);

export default router;
