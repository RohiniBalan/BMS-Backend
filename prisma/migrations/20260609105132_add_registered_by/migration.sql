-- AlterTable
ALTER TABLE "DeviceRegistration" ADD COLUMN     "registeredById" TEXT;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
