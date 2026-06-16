import { AlertRepository } from "../repositories/alert.repository";
import { DeviceRepository } from "../repositories/device.repository";
import { AlertSeverity, AlertType, DeviceStatus } from "@prisma/client";

const alertRepo = new AlertRepository();
const deviceRepo = new DeviceRepository();

const STALE_MINUTES = 5;
const INTERVAL_MS = 60 * 1000;

async function checkOfflineDevices() {
  const staleDevices = await deviceRepo.findStaleDevices(STALE_MINUTES);

  for (const device of staleDevices) {
    await deviceRepo.updateStatus(device.id, DeviceStatus.OFFLINE);

    const existing = await alertRepo.findUnresolved(device.id, AlertType.CONNECTION_LOST);
    if (!existing) {
      await alertRepo.create({
        device: { connect: { id: device.id } },
        alertType: AlertType.CONNECTION_LOST,
        severity: AlertSeverity.CRITICAL,
        message: `No telemetry received for over ${STALE_MINUTES} minutes`,
      });
    }
  }
}

export function startDeviceScheduler() {
  checkOfflineDevices().catch(console.error);
  setInterval(() => checkOfflineDevices().catch(console.error), INTERVAL_MS);
}
