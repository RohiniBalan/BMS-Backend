import { Router } from "express";
import { BatteryController } from "../controllers/battery.controller";
import {authenticate} from "../middleware/auth.middleware";
import {authorize} from "../middleware/role.middleware"

const router = Router();
const controller = new BatteryController();

// Chemistry Routes
// ==================
// PUBLIC ROUTES
// ==================
router.get("/chemistries", authenticate,  controller.getChemistries.bind(controller));
router.get("/chemistries/:id", authenticate, controller.getChemistryById.bind(controller));

// ==================
// ADMIN ROUTES
// ==================
router.post("/chemistries", authenticate, authorize("ADMIN"), controller.createChemistry.bind(controller));
router.put("/chemistries/:id", authenticate, authorize("ADMIN"), controller.updateChemistry.bind(controller));
router.delete("/chemistries/:id", authenticate, authorize("ADMIN"), controller.deleteChemistry.bind(controller));

// Configuration Routes
// ==================
// PUBLIC ROUTES
// ==================
router.get("/configs",authenticate, controller.getConfigs.bind(controller));
router.get("/configs/:id",authenticate, controller.getConfigById.bind(controller));

// ==================
// ADMIN ROUTES
// ==================
router.post("/configs", authenticate, authorize("ADMIN"), controller.createConfig.bind(controller));
router.put("/configs/:id", authenticate, authorize("ADMIN"), controller.updateConfig.bind(controller));
router.delete("/configs/:id", authenticate, authorize("ADMIN"), controller.deleteConfig.bind(controller));

// Backward-compatible Root Routes
router.get("/", controller.getAll.bind(controller));
router.post("/", controller.create.bind(controller));

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy 🚀",
    timestamp: new Date().toISOString()
  });
});

export default router;