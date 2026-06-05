import { Request, Response, NextFunction } from "express";
import { DeviceService } from "../services/device.service";
import { sendSuccess } from "../utils/response";
import { DeviceStatus } from "@prisma/client";

const service = new DeviceService();

export class DeviceController {
  // GET /devices
  async getDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

const { devices, pagination } = await service.getDevices(
  req.query as any,
  user
);
      return sendSuccess(res, "Devices retrieved", devices, pagination);
    } catch (err) { next(err); }
  }

  // GET /devices/map  (registered BEFORE /:id)
  async getMap(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getMapDevices();
      return sendSuccess(res, "Map data retrieved", data);
    } catch (err) { next(err); }
  }

  // GET /devices/:id
  async getDeviceById(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await service.getDeviceById(String(req.params.id));
      return sendSuccess(res, "Device retrieved", device);
    } catch (err) { next(err); }
  }

  // POST /devices
  async createDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await service.createDevice(req.body);
      res.status(201);
      return sendSuccess(res, "Device created", device);
    } catch (err) { next(err); }
  }

  // PUT /devices/:id
  async updateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await service.updateDevice(String(req.params.id), req.body);
      return sendSuccess(res, "Device updated", device);
    } catch (err) { next(err); }
  }

  // DELETE /devices/:id
  async deleteDevice(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteDevice(String(req.params.id));
      return sendSuccess(res, "Device deleted");
    } catch (err) { next(err); }
  }

  // PATCH /devices/:id/status
  async patchStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const device = await service.patchStatus(String(req.params.id), req.body.status as DeviceStatus);
      return sendSuccess(res, "Device status updated", device);
    } catch (err) { next(err); }
  }

  // Register device
async registerDevice(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;

    const result =
      await service.registerDevice({
        deviceId: req.body.deviceId,
        deviceName: req.body.deviceName,
        dataSubscription:
          req.body.dataSubscription,
        batteryType:
          req.body.batteryType,
        userId: user.id,
        registrationSource:
          (req as any).clientType,
      });

    return sendSuccess(
      res,
      "Device registered successfully",
      result
    );
  } catch (err) {
    next(err);
  }
}

// --------- Get My Devices ----------
async getMyDevices(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;

    const devices =
      await service.getMyDevices(user.id);

    return sendSuccess(
      res,
      "Devices retrieved",
      devices
    );
  } catch (err) {
    next(err);
  }
}
}
