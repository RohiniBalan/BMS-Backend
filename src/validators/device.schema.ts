import { z } from "zod";
import { DeviceStatus } from "@prisma/client";

const deviceStatusEnum = z.nativeEnum(DeviceStatus);

const batteryTypeEnum = z.enum([
  "LITHIUM_IRON",
  "LITHIUM_IRON_PHOSPHATE",
  "NICKEL_METAL_HYDRIDE",
  "LEAD_ACID_BATTERIES",
]);

// ---------- Create Device ----------
export const createDeviceSchema = z.object({
  body: z.object({
    deviceName: z.string().min(1, "Device name is required"),
    deviceType: z.string().min(1, "Device type is required"),
    serialNumber: z.string().min(1, "Serial number is required"),
    status: deviceStatusEnum.optional(),
    totalCapacityKWh: z.number().positive("Capacity must be positive"),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationName: z.string().optional(),
  }),
});

// ---------- Update Device ----------
export const updateDeviceSchema = z.object({
  params: z.object({
  id: z.string().min(1),
}),
  body: z.object({
    deviceName: z.string().min(1).optional(),
    deviceType: z.string().min(1).optional(),
    serialNumber: z.string().min(1).optional(),
    status: deviceStatusEnum.optional(),
    totalCapacityKWh: z.number().positive().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationName: z.string().optional(),
  }),
});

// ---------- Patch Status ----------
export const patchStatusSchema = z.object({
  params: z.object({
  id: z.string().min(1),
}),
  body: z.object({
    status: deviceStatusEnum,
  }),
});

// ---------- Get by ID ----------
export const deviceIdSchema = z.object({
  params: z.object({
  id: z.string().min(1),
}),
});

// ---------- List Devices (query) ----------
export const listDevicesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: deviceStatusEnum.optional(),
    deviceType: z.string().optional(),
    search: z.string().optional(),
  }),
});

// ---------- Register Device ----------
export const registerDeviceSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1, "Device ID is required"),
    deviceName: z.string().min(1),

    dataSubscription: z.string().min(1),

    batteryType: batteryTypeEnum,
  }),
});