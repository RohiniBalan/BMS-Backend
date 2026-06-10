-- DropForeignKey
ALTER TABLE "DeviceRegistration" DROP CONSTRAINT "DeviceRegistration_userId_fkey";

-- AlterTable
ALTER TABLE "DeviceRegistration" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
