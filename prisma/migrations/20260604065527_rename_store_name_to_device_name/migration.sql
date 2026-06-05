/*
  Warnings:

  - You are about to drop the column `storeName` on the `DeviceRegistration` table. All the data in the column will be lost.
  - Added the required column `deviceName` to the `DeviceRegistration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeviceRegistration" DROP COLUMN "storeName",
ADD COLUMN     "deviceName" TEXT NOT NULL;
