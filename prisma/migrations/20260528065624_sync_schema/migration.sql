/*
  Warnings:

  - You are about to drop the column `createdById` on the `BatteryChemistry` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `ChemistryConfig` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SafetyLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "SocEstimationMethod" AS ENUM ('COULOMB_COUNTING', 'EKF', 'LSTM');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'WARNING');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('HIGH_TEMPERATURE', 'LOW_BATTERY', 'CELL_IMBALANCE', 'CONNECTION_LOST', 'OVERVOLTAGE', 'UNDERVOLTAGE');

-- DropForeignKey
ALTER TABLE "BatteryChemistry" DROP CONSTRAINT "BatteryChemistry_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ChemistryConfig" DROP CONSTRAINT "ChemistryConfig_createdById_fkey";

-- AlterTable
ALTER TABLE "BatteryChemistry" DROP COLUMN "createdById";

-- AlterTable
ALTER TABLE "ChemistryConfig" DROP COLUMN "createdById",
ADD COLUMN     "socEstimationMethod" "SocEstimationMethod";

-- AlterTable
ALTER TABLE "ThermalSafetyConfig" ADD COLUMN     "otpThreshold" DOUBLE PRECISION,
ADD COLUMN     "riseRateThreshold" DOUBLE PRECISION,
ADD COLUMN     "utpThreshold" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ONLINE',
    "totalCapacityKWh" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Telemetry" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "soc" DOUBLE PRECISION NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "speed" DOUBLE PRECISION,
    "acceleration" DOUBLE PRECISION,

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatteryPack" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "totalColumns" INTEGER NOT NULL,
    "capacityFade" DOUBLE PRECISION,
    "resistanceRise" DOUBLE PRECISION,
    "coulombEfficiency" DOUBLE PRECISION,
    "icaMetrics" JSONB,

    CONSTRAINT "BatteryPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CellTelemetry" (
    "id" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "colIndex" INTEGER NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "soc" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CellTelemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedById" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BatteryPack_deviceId_key" ON "BatteryPack"("deviceId");

-- AddForeignKey
ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatteryPack" ADD CONSTRAINT "BatteryPack_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellTelemetry" ADD CONSTRAINT "CellTelemetry_packId_fkey" FOREIGN KEY ("packId") REFERENCES "BatteryPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
