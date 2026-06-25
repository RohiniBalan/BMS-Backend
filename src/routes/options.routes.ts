import { Router } from "express";
import { OptionsController } from "../controllers/options.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new OptionsController();

router.use(authenticate);
router.get("/", ctrl.getDropdownOptions.bind(ctrl));

export default router;
