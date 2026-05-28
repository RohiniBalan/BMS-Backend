import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate";
import { dashboardSummarySchema } from "../validators/analytics.schema";

const router = Router();
const ctrl = new AnalyticsController();

router.use(authenticate);
router.use(authorize("ADMIN", "USER"));

router.get("/summary", validate(dashboardSummarySchema), ctrl.getDashboardSummary.bind(ctrl));
router.get("/soc-distribution", ctrl.getSocDistribution.bind(ctrl));

export default router;
