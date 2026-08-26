-- CreateEnum
CREATE TYPE "ForceWinReason" AS ENUM ('GAME_CUT_OUT', 'OPPONENT_UNAVAILABLE');

-- AlterTable
ALTER TABLE "GameSubmission" ADD COLUMN "forceWinReason" "ForceWinReason";
