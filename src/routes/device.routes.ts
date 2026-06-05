import { Router } from "express";
import { DeviceController } from "../controllers/device.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate";
import {
  createDeviceSchema,
  updateDeviceSchema,
  patchStatusSchema,
  deviceIdSchema,
  listDevicesSchema,
  registerDeviceSchema, 
} from "../validators/device.schema";
import { detectClient } from "../middleware/client.middleware";

const router = Router();
const ctrl = new DeviceController();

// All device routes require authentication
router.use(authenticate);

// GET /api/v1/devices/map  — must be BEFORE /:id to avoid "map" being treated as an ID
router.get("/map", authorize("ADMIN", "USER"), ctrl.getMap.bind(ctrl));

// GET /api/v1/devices
router.get("/", authorize("ADMIN", "USER"), validate(listDevicesSchema), ctrl.getDevices.bind(ctrl));

// POST /api/v1/devices
router.post("/", authorize("ADMIN"), validate(createDeviceSchema), ctrl.createDevice.bind(ctrl));

// POST /api/v1/devices/register
router.post(
  "/register",
  authorize("ADMIN", "USER"),
  detectClient,
  validate(registerDeviceSchema),
  ctrl.registerDevice.bind(ctrl)
);

// GET /api/v1/devices/my-devices
router.get(
  "/my-devices",
  authorize("USER", "ADMIN"),
  ctrl.getMyDevices.bind(ctrl)
);

// GET /api/v1/devices/:id
router.get("/:id", authorize("ADMIN", "USER"), validate(deviceIdSchema), ctrl.getDeviceById.bind(ctrl));

// PUT /api/v1/devices/:id
router.put("/:id", authorize("ADMIN"), validate(updateDeviceSchema), ctrl.updateDevice.bind(ctrl));

// DELETE /api/v1/devices/:id
router.delete("/:id", authorize("ADMIN"), validate(deviceIdSchema), ctrl.deleteDevice.bind(ctrl));

// PATCH /api/v1/devices/:id/status
router.patch("/:id/status", authorize("ADMIN"), validate(patchStatusSchema), ctrl.patchStatus.bind(ctrl));

export default router;
