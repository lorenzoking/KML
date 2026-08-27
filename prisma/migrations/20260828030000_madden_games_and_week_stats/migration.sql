-- CreateTable
CREATE TABLE "MaddenTeamWeekStat" (
    "id" TEXT NOT NULL,
    "maddenTeamId" TEXT NOT NULL,
    "weekIndex" INTEGER NOT NULL,
    "offPassYds" INTEGER NOT NULL DEFAULT 0,
    "offRushYds" INTEGER NOT NULL DEFAULT 0,
    "offPassTDs" INTEGER NOT NULL DEFAULT 0,
    "offRushTDs" INTEGER NOT NULL DEFAULT 0,
    "offPtsPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defTotalYds" INTEGER NOT NULL DEFAULT 0,
    "defSacks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defPtsPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaddenTeamWeekStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaddenGame" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "weekIndex" INTEGER NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "isGameOfTheWeek" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaddenGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaddenTeamWeekStat_maddenTeamId_weekIndex_key" ON "MaddenTeamWeekStat"("maddenTeamId", "weekIndex");

-- CreateIndex
CREATE INDEX "MaddenTeamWeekStat_weekIndex_idx" ON "MaddenTeamWeekStat"("weekIndex");

-- CreateIndex
CREATE UNIQUE INDEX "MaddenGame_scheduleId_key" ON "MaddenGame"("scheduleId");

-- CreateIndex
CREATE INDEX "MaddenGame_weekIndex_idx" ON "MaddenGame"("weekIndex");

-- AddForeignKey
ALTER TABLE "MaddenTeamWeekStat" ADD CONSTRAINT "MaddenTeamWeekStat_maddenTeamId_fkey" FOREIGN KEY ("maddenTeamId") REFERENCES "MaddenTeam"("maddenTeamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaddenGame" ADD CONSTRAINT "MaddenGame_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "MaddenTeam"("maddenTeamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaddenGame" ADD CONSTRAINT "MaddenGame_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "MaddenTeam"("maddenTeamId") ON DELETE CASCADE ON UPDATE CASCADE;
