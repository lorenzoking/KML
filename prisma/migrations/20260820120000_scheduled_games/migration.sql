-- CreateTable
CREATE TABLE IF NOT EXISTS "ScheduledGame" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "isPrimetime" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ScheduledGame_seasonId_week_homeTeamId_key" ON "ScheduledGame"("seasonId", "week", "homeTeamId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ScheduledGame_seasonId_week_awayTeamId_key" ON "ScheduledGame"("seasonId", "week", "awayTeamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ScheduledGame_seasonId_week_idx" ON "ScheduledGame"("seasonId", "week");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ScheduledGame_homeTeamId_idx" ON "ScheduledGame"("homeTeamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ScheduledGame_awayTeamId_idx" ON "ScheduledGame"("awayTeamId");

-- AddForeignKey
ALTER TABLE "ScheduledGame" DROP CONSTRAINT IF EXISTS "ScheduledGame_seasonId_fkey";
ALTER TABLE "ScheduledGame" ADD CONSTRAINT "ScheduledGame_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduledGame" DROP CONSTRAINT IF EXISTS "ScheduledGame_homeTeamId_fkey";
ALTER TABLE "ScheduledGame" ADD CONSTRAINT "ScheduledGame_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Franchise"("id") ON UPDATE CASCADE;

ALTER TABLE "ScheduledGame" DROP CONSTRAINT IF EXISTS "ScheduledGame_awayTeamId_fkey";
ALTER TABLE "ScheduledGame" ADD CONSTRAINT "ScheduledGame_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Franchise"("id") ON UPDATE CASCADE;
