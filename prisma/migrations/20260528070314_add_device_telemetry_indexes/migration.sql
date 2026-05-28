-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE INDEX "Telemetry_deviceId_recordedAt_idx" ON "Telemetry"("deviceId", "recordedAt");

-- CreateIndex
CREATE INDEX "Telemetry_recordedAt_idx" ON "Telemetry"("recordedAt");
