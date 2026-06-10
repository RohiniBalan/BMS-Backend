import { DeviceRepository, DeviceFilters } from "../repositories/device.repository";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { DeviceStatus } from "@prisma/client";
import { DeviceRegistrationRepository }
from "../repositories/deviceRegistration.repository";
import { BatteryType } from "@prisma/client";
import { canDeleteDevice } from "../permissions/device.permission";

const repo = new DeviceRepository();
const registrationRepo = new DeviceRegistrationRepository();

export class DeviceService {
  // ---------- List ----------
  async getDevices(query: {
    page?: string;
    limit?: string;
    status?: string;
    deviceType?: string;
    search?: string;
  },
user: { id: string; role: string }
) {
    const pagination = parsePagination(query);
    const filters: DeviceFilters = {};
    if (query.status && Object.values(DeviceStatus).includes(query.status as DeviceStatus)) {
      filters.status = query.status as DeviceStatus;
    }
    if (query.deviceType) filters.deviceType = query.deviceType;
    if (query.search) filters.search = query.search;

    let whereUserFilter = {};

if (user.role === "USER") {
  whereUserFilter = {
    userId: user.id,
  };
}
const { devices, total } = await repo.findAll(
  {
    ...filters,
    ...whereUserFilter,
  },
  pagination.skip,
  pagination.limit
);
    return { devices, pagination: buildPaginationMeta(total, pagination) };
  }

  // ---------- Single ----------
  async getDeviceById(id: string) {
    console.log("Looking for device:", id);

const device = await repo.findById(id);

console.log("Found device:", device);
    if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });
    return device;
  }

  // ---------- Create ----------
  async createDevice(body: {
    id: string;
    deviceName: string;
    deviceType: string;
    serialNumber: string;
    status?: DeviceStatus;
    totalCapacityKWh: number;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    userId?: string;
  }) {
    const existing = await repo.findBySerialNumber(body.serialNumber);
    if (existing) {
      throw Object.assign(new Error(`Device with serial number '${body.serialNumber}' already exists`), { status: 409 });
    }
    return repo.create({
  id: body.id,
  deviceName: body.deviceName,
  deviceType: body.deviceType,
  serialNumber: body.serialNumber,
  status: body.status,
  totalCapacityKWh: body.totalCapacityKWh,
  latitude: body.latitude,
  longitude: body.longitude,
  locationName: body.locationName,

  ...(body.userId && {
    user: {
      connect: {
        id: body.userId,
      },
    },
  }),
});
  }

  // ---------- Update ----------
async updateDevice(
  id: string,
  body: Partial<{
    deviceName: string;
    deviceType: string;
    serialNumber: string;
    status: DeviceStatus;
    totalCapacityKWh: number;
    latitude: number;
    longitude: number;
    locationName: string;
    dataSubscription: string;
    batteryType: BatteryType;
  }>,
  user: { id: string; role: string }
) {
  const device = await repo.findById(id);

  if (!device) {
    throw Object.assign(new Error("Device not found"), { status: 404 });
  }

  const canManage = await this.canManageDevice(id, user);

  if (!canManage) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const updatedDevice = await repo.update(id, {
    deviceName: body.deviceName,
    deviceType: body.deviceType,
    serialNumber: body.serialNumber,
    status: body.status,
    totalCapacityKWh: body.totalCapacityKWh,
    latitude: body.latitude,
    longitude: body.longitude,
    locationName: body.locationName,
  });

  await registrationRepo.updateByDeviceId(id, {
    dataSubscription: body.dataSubscription,
    batteryType: body.batteryType,
  });

  return updatedDevice;
}

  // ---------- Delete ----------
async deleteDevice(
  id: string,
  user: { id: string; role: string }
) {
  const device = await repo.findById(id);

  if (!device) {
    throw Object.assign(new Error("Device not found"), { status: 404 });
  }

  const canManage = await this.canManageDevice(id, user);

  if (!canManage) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  await registrationRepo.deleteByDeviceId(id);
  
  await repo.delete(id);

  return true;
}

  // ---------- Patch status ----------
  async patchStatus(id: string, status: DeviceStatus) {
    const device = await repo.findById(id);
    if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });
    return repo.updateStatus(id, status);
  }

  // ---------- Map ----------
  async getMapDevices() {
    const devices = await repo.findWithCoordinates();
    return devices.map((d) => ({
      id: d.id,
      deviceName: d.deviceName,
      latitude: d.latitude,
      longitude: d.longitude,
      locationName: d.locationName,
      status: d.status,
      latestSoc: d.telemetry[0]?.soc ?? null,
    }));
  }

// ---------- Register Device ----------
async registerDevice(data: {
  deviceId: string;
  userId: string;
  role: string;
  deviceName: string;
  dataSubscription: string;
  batteryType: BatteryType;
  registrationSource: string;
}) {
  const device = await repo.findById(data.deviceId);

if (!device) {
  await repo.create({
    id: data.deviceId,
    deviceName: data.deviceName,
    deviceType: "Battery",
    serialNumber: data.deviceId,
    totalCapacityKWh: 0,

    ...(data.role === "USER" && {
      user: {
        connect: {
          id: data.userId,
        },
      },
    }),
  });
}

  const existing =
    await registrationRepo.findByDeviceId(
      data.deviceId
    );

  if (existing) {
    throw Object.assign(
      new Error("Device already registered"),
      { status: 400 }
    );
  }

  // await repo.update(
  //   data.deviceId,
  //   {
  //     user: {
  //       connect: {
  //         id: data.userId,
  //       },
  //     },
  //   }
  // );

  return registrationRepo.create({
  deviceId: data.deviceId,

  userId:
    data.role === "USER"
      ? data.userId
      : null,

  registeredById: data.userId,

  deviceName: data.deviceName,
  dataSubscription: data.dataSubscription,
  batteryType: data.batteryType,
  registrationSource: data.registrationSource,
});
}

// -----------Get my devices ---------
async getMyDevices(userId: string) {
  return registrationRepo.findByUserId(userId);
}


  // --------- Assign device to user ----
async assignDevice(
  deviceId: string,
  userId: string,
  currentUserId: string
) {
  const device = await repo.findById(deviceId);

  if (!device) {
    throw Object.assign(new Error("Device not found"), { status: 404 });
  }

  const registration = await registrationRepo.findByDeviceId(deviceId);

  const canAssign =
    registration?.registeredById === currentUserId;

  if (!canAssign) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  if (device.userId) {
    throw Object.assign(new Error("Device already assigned"), { status: 400 });
  }

  const updated = await repo.update(deviceId, {
    user: {
      connect: { id: userId },
    },
  });

  await registrationRepo.updateByDeviceId(deviceId, {
    userId: userId,
  });

  return updated;
}
private async canManageDevice(
  deviceId: string,
  currentUser: { id: string; role: string }
) {
  const registration =
    await registrationRepo.findByDeviceId(deviceId);

  if (!registration) return false;

  const device = await repo.findById(deviceId);
  if (!device) return false;

  const isAdmin = currentUser.role === "ADMIN";

  const isOwner = registration.userId === currentUser.id;
  const isRegisteredBy =
    registration.registeredById === currentUser.id;

  return isAdmin || isOwner || isRegisteredBy;
}
}

