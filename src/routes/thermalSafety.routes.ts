import { Router } from "express";
import {ThermalSafetyController} from "../controllers/thermalSafety.controller"
import {authenticate} from "../middleware/auth.middleware";
import {authorize} from "../middleware/role.middleware";

const router = Router();
const controller =new ThermalSafetyController();

// Thermal Safety Routes
// ==================
// PUBLIC ROUTES
// ==================
router.get("/thermal-safety", authenticate, controller.getAllThermalSafety.bind(controller));
router.get(
  "/thermal-safety/:id",
  authenticate,
  controller.getThermalSafetyById.bind(controller),
);

// ==================
// ADMIN ROUTES
// ==================
router.post("/thermal-safety", authenticate, authorize("ADMIN"), controller.createThermalSafety.bind(controller));
router.put(
  "/thermal-safety/:id",
  authenticate,
  authorize("ADMIN"),
  controller.updateThermalSafety.bind(controller),
);
router.delete(
  "/thermal-safety/:id",
  authenticate,
  authorize("ADMIN"),
  controller.deleteThermalSafety.bind(controller),
);

// Thermal Safety Config Routes
// ==================
// PUBLIC ROUTES
// ==================
router.get("/thermal-configs", authenticate, controller.getAllThermalSafetyConfigs.bind(controller));
router.get("/thermal-configs/:id", authenticate, controller.getThermalSafetyConfigById.bind(controller));

// ==================
// ADMIN ROUTES
// ==================
router.post("/thermal-configs", authenticate, authorize("ADMIN"), controller.createThermalSafetyConfig.bind(controller));
router.put("/thermal-configs/:id", authenticate, authorize("ADMIN"), controller.updateThermalSafetyConfig.bind(controller));
router.delete("/thermal-configs/:id", authenticate, authorize("ADMIN"), controller.deleteThermalSafetyConfig.bind(controller));

// Backward Compatible Routes

router.get(
  "/",
  controller.getAllThermalSafety.bind(controller)
);

router.post(
  "/",
  controller.createThermalSafety.bind(controller)
);


// Health Check

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Thermal Safety API is healthy 🚀",
    timestamp: new Date().toISOString(),
  });
});


export default router;
