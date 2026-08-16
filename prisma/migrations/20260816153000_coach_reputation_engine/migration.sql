-- AlterTable
ALTER TABLE "GameSubmission" ADD COLUMN IF NOT EXISTS "isPrimetime" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GameResult" ADD COLUMN IF NOT EXISTS "isPrimetime" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ReputationAdjustment" ADD COLUMN IF NOT EXISTS "isAutomatic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ReputationAdjustment" ADD COLUMN IF NOT EXISTS "submissionId" TEXT;
ALTER TABLE "ReputationAdjustment" ADD COLUMN IF NOT EXISTS "ruleKey" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReputationAdjustment_submissionId_idx" ON "ReputationAdjustment"("submissionId");
CREATE INDEX IF NOT EXISTS "ReputationAdjustment_userId_seasonId_ruleKey_idx" ON "ReputationAdjustment"("userId", "seasonId", "ruleKey");

-- Baseline coaching reputation follows the coach at 85 (B).
UPDATE "LeagueSetting" SET "startingRepScore" = 85 WHERE "key" = 'default' AND "startingRepScore" = 75;
