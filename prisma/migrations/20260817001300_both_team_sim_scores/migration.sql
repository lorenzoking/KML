-- AlterTable
ALTER TABLE "GameSubmission" ADD COLUMN IF NOT EXISTS "userTeamSimScore" INTEGER;

-- AlterTable
ALTER TABLE "GameResult" ADD COLUMN IF NOT EXISTS "userTeamSimScore" INTEGER;
