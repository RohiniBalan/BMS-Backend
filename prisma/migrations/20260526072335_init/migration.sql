-- CreateTable
CREATE TABLE "BatteryChemistry" (
    "id" TEXT NOT NULL,
    "chemistryName" TEXT NOT NULL,
    "nominalVoltage" DOUBLE PRECISION NOT NULL,
    "maxVoltage" DOUBLE PRECISION NOT NULL,
    "minVoltage" DOUBLE PRECISION NOT NULL,
    "energyDensity" INTEGER NOT NULL,
    "cycleLife" INTEGER NOT NULL,
    "safetyLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatteryChemistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChemistryConfig" (
    "id" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "chargeCutoffVoltage" DOUBLE PRECISION NOT NULL,
    "dischargeCutoffVoltage" DOUBLE PRECISION NOT NULL,
    "temperatureLimit" DOUBLE PRECISION NOT NULL,
    "firmwareVersion" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "chemistryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChemistryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BatteryChemistry_chemistryName_key" ON "BatteryChemistry"("chemistryName");

-- AddForeignKey
ALTER TABLE "ChemistryConfig" ADD CONSTRAINT "ChemistryConfig_chemistryId_fkey" FOREIGN KEY ("chemistryId") REFERENCES "BatteryChemistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
