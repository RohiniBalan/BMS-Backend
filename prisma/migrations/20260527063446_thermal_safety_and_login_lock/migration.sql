/*
  Warnings:

  - A unique constraint covering the columns `[phoneNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lockUntil` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockUntil" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "ThermalSafety" (
    "id" SERIAL NOT NULL,
    "parameterName" TEXT NOT NULL,
    "thresholdValue" DOUBLE PRECISION NOT NULL,
    "actionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThermalSafety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThermalSafetyConfig" (
    "id" SERIAL NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "customThreshold" DOUBLE PRECISION NOT NULL,
    "coolingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "firmwareVersion" TEXT,
    "thermalSafetyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThermalSafetyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- AddForeignKey
ALTER TABLE "ThermalSafetyConfig" ADD CONSTRAINT "ThermalSafetyConfig_thermalSafetyId_fkey" FOREIGN KEY ("thermalSafetyId") REFERENCES "ThermalSafety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
