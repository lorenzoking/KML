-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CarouselMoveType" ADD VALUE 'RE_SIGN';
ALTER TYPE "CarouselMoveType" ADD VALUE 'EXTEND';
ALTER TYPE "CarouselMoveType" ADD VALUE 'CHANGE_TEAM';

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "autopilotSeason" INTEGER,
ADD COLUMN     "isAutopilot" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LeagueSetting" ADD COLUMN     "carouselMinCoachRep" INTEGER NOT NULL DEFAULT 75,
ADD COLUMN     "startingContractYears" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_isActive_idx" ON "WaitlistEntry"("isActive");

-- CreateIndex
CREATE INDEX "WaitlistEntry_userId_idx" ON "WaitlistEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_position_key" ON "WaitlistEntry"("position");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
