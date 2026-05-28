import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate";
import { reportSchema } from "../validators/analytics.schema";

const router = Router();
const ctrl = new AnalyticsController();

router.use(authenticate);
router.use(authorize("ADMIN", "USER"));

router.get("/daily", validate(reportSchema), ctrl.getDailyReport.bind(ctrl));
router.get("/export", validate(reportSchema), ctrl.exportReport.bind(ctrl));

export default router;
