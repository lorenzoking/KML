-- DropIndex
DROP INDEX "LeagueMembership_franchiseId_seasonId_key";

-- DropIndex
DROP INDEX "LeagueMembership_userId_seasonId_key";

-- AlterTable
ALTER TABLE "LeagueMembership" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "endedWeek" INTEGER,
ADD COLUMN     "startedWeek" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "LeagueMembership_userId_seasonId_idx" ON "LeagueMembership"("userId", "seasonId");

-- CreateIndex
CREATE INDEX "LeagueMembership_franchiseId_seasonId_idx" ON "LeagueMembership"("franchiseId", "seasonId");

-- CreateIndex
CREATE INDEX "LeagueMembership_isActive_idx" ON "LeagueMembership"("isActive");
