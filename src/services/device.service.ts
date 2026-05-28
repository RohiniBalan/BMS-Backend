import { DeviceRepository, DeviceFilters } from "../repositories/device.repository";
import { parsePagination, buildPaginationMeta } from "../utils/pagination";
import { DeviceStatus } from "@prisma/client";

const repo = new DeviceRepository();

export class DeviceService {
  // ---------- List ----------
  async getDevices(query: {
    page?: string;
    limit?: string;
    status?: string;
    deviceType?: string;
    search?: string;
  }) {
    const pagination = parsePagination(query);
    const filters: DeviceFilters = {};
    if (query.status && Object.values(DeviceStatus).includes(query.status as DeviceStatus)) {
      filters.status = query.status as DeviceStatus;
    }
    if (query.deviceType) filters.deviceType = query.deviceType;
    if (query.search) filters.search = query.search;

    const { devices, total } = await repo.findAll(filters, pagination.skip, pagination.limit);
    return { devices, pagination: buildPaginationMeta(total, pagination) };
  }

  // ---------- Single ----------
  async getDeviceById(id: string) {
    const device = await repo.findById(id);
    if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });
    return device;
  }

  // ---------- Create ----------
  async createDevice(body: {
    deviceName: string;
    deviceType: string;
    serialNumber: string;
    status?: DeviceStatus;
    totalCapacityKWh: number;
    latitude?: number;
    longitude?: number;
    locationName?: string;
  }) {
    const existing = await repo.findBySerialNumber(body.serialNumber);
    if (existing) {
      throw Object.assign(new Error(`Device with serial number '${body.serialNumber}' already exists`), { status: 409 });
    }
    return repo.create(body);
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
    }>
  ) {
    const device = await repo.findById(id);
    if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });
    return repo.update(id, body);
  }

  // ---------- Delete ----------
  async deleteDevice(id: string) {
    const device = await repo.findById(id);
    if (!device) throw Object.assign(new Error("Device not found"), { status: 404 });
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
}
