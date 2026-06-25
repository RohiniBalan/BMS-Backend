import { Router } from "express";
import { AuditController } from "../controllers/audit.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();
const ctrl = new AuditController();

router.use(authenticate);
router.use(authorize("ADMIN"));

// GET /api/v1/audit/stats
router.get("/stats", ctrl.getStats.bind(ctrl));

// GET /api/v1/audit/filters
router.get("/filters", ctrl.getFilters.bind(ctrl));

// GET /api/v1/audit/export
router.get("/export", ctrl.exportCSV.bind(ctrl));

// GET /api/v1/audit
router.get("/", ctrl.getLogs.bind(ctrl));

export default router;
