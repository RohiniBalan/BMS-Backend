-- DropForeignKey
ALTER TABLE "DeviceRegistration" DROP CONSTRAINT "DeviceRegistration_deviceId_fkey";

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
