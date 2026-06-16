ALTER TABLE "Alert"
ADD COLUMN "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN "acknowledgedById" TEXT;

ALTER TABLE "Alert"
ADD CONSTRAINT "Alert_acknowledgedById_fkey"
FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
