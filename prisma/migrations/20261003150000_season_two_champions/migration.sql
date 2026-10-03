-- CreateTable
CREATE TABLE "SeasonTitle" (
    "id" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "championFranchiseId" TEXT NOT NULL,
    "runnerUpFranchiseId" TEXT,
    "championScore" INTEGER NOT NULL,
    "runnerUpScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonTitle_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "MaddenPlayerStat" ADD COLUMN "seasonNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "MaddenTeamWeekStat" ADD COLUMN "seasonNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "MaddenGame" ADD COLUMN "seasonNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "SeasonTitle_seasonNumber_key" ON "SeasonTitle"("seasonNumber");

-- AddForeignKey
ALTER TABLE "SeasonTitle" ADD CONSTRAINT "SeasonTitle_championFranchiseId_fkey" FOREIGN KEY ("championFranchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonTitle" ADD CONSTRAINT "SeasonTitle_runnerUpFranchiseId_fkey" FOREIGN KEY ("runnerUpFranchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "MaddenPlayerStat_rosterId_weekIndex_category_key";

-- CreateIndex
CREATE UNIQUE INDEX "MaddenPlayerStat_rosterId_weekIndex_category_seasonNumber_key" ON "MaddenPlayerStat"("rosterId", "weekIndex", "category", "seasonNumber");

-- CreateIndex
CREATE INDEX "MaddenPlayerStat_seasonNumber_weekIndex_category_idx" ON "MaddenPlayerStat"("seasonNumber", "weekIndex", "category");

-- DropIndex
DROP INDEX "MaddenTeamWeekStat_maddenTeamId_weekIndex_key";

-- CreateIndex
CREATE UNIQUE INDEX "MaddenTeamWeekStat_maddenTeamId_weekIndex_seasonNumber_key" ON "MaddenTeamWeekStat"("maddenTeamId", "weekIndex", "seasonNumber");

-- CreateIndex
CREATE INDEX "MaddenTeamWeekStat_seasonNumber_weekIndex_idx" ON "MaddenTeamWeekStat"("seasonNumber", "weekIndex");

-- CreateIndex
CREATE INDEX "MaddenGame_seasonNumber_weekIndex_idx" ON "MaddenGame"("seasonNumber", "weekIndex");

-- DropIndex
DROP INDEX "MaddenPlayerStat_weekIndex_category_idx";
DROP INDEX "MaddenTeamWeekStat_weekIndex_idx";
DROP INDEX "MaddenGame_weekIndex_idx";
