-- AlterTable
ALTER TABLE "GameSubmission" ADD COLUMN IF NOT EXISTS "isForceWin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GameSubmission" ALTER COLUMN "userScore" DROP NOT NULL;
ALTER TABLE "GameSubmission" ALTER COLUMN "opponentScore" DROP NOT NULL;
ALTER TABLE "GameSubmission" ALTER COLUMN "opponentSimScore" DROP NOT NULL;

-- AlterTable
ALTER TABLE "GameResult" ADD COLUMN IF NOT EXISTS "isForceWin" BOOLEAN NOT NULL DEFAULT false;
