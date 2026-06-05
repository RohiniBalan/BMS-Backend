/*
  Warnings:

  - Changed the type of `batteryType` on the `DeviceRegistration` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BatteryType" AS ENUM ('LITHIUM_IRON', 'LITHIUM_IRON_PHOSPHATE', 'NICKEL_METAL_HYDRIDE', 'LEAD_ACID_BATTERIES');

-- AlterTable
ALTER TABLE "DeviceRegistration" DROP COLUMN "batteryType",
ADD COLUMN     "batteryType" "BatteryType" NOT NULL;
