import { Router } from "express";
import { PackController } from "../controllers/pack.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate";
import { auditLog } from "../middleware/audit.middleware";
import {
  createPackSchema,
  listPacksSchema,
  packIdSchema,
  ingestCellsSchema,
} from "../validators/pack.schema";

const router = Router();
const ctrl = new PackController();

router.use(authenticate);

// ---------- Pack listing / creation ----------
router.get("/", authorize("ADMIN", "USER"), validate(listPacksSchema), ctrl.getPacks.bind(ctrl));
router.post("/", authorize("ADMIN"), validate(createPackSchema), auditLog("CREATE_PACK", "BatteryPack", "NEW"), ctrl.createPack.bind(ctrl));

// ---------- Pack Detail / Matrices ----------
router.get("/:packId", authorize("ADMIN", "USER"), validate(packIdSchema), ctrl.getPackById.bind(ctrl));
router.get("/:packId/battery-matrix", authorize("ADMIN", "USER"), validate(packIdSchema), ctrl.getBatteryMatrix.bind(ctrl));
router.get("/:packId/thermal-matrix", authorize("ADMIN", "USER"), validate(packIdSchema), ctrl.getThermalMatrix.bind(ctrl));

// ---------- Ingest Cells ----------
router.post("/:packId/cells", authorize("ADMIN"), validate(ingestCellsSchema), ctrl.ingestCells.bind(ctrl));

export default router;
