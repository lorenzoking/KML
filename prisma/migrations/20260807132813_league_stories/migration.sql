-- CreateEnum
CREATE TYPE "StoryCategory" AS ENUM ('FEATURE', 'GAME_OF_WEEK', 'PLAYER_OF_WEEK', 'COACHING', 'DRAFT', 'LEAGUE');

-- CreateTable
CREATE TABLE "LeagueStory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seasonId" TEXT,
    "week" INTEGER,
    "category" "StoryCategory" NOT NULL DEFAULT 'LEAGUE',
    "title" TEXT NOT NULL,
    "eyebrow" TEXT,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueStory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueStory_slug_key" ON "LeagueStory"("slug");

-- CreateIndex
CREATE INDEX "LeagueStory_isPublished_isFeatured_idx" ON "LeagueStory"("isPublished", "isFeatured");

-- CreateIndex
CREATE INDEX "LeagueStory_category_idx" ON "LeagueStory"("category");

-- CreateIndex
CREATE INDEX "LeagueStory_seasonId_week_idx" ON "LeagueStory"("seasonId", "week");

-- CreateIndex
CREATE INDEX "LeagueStory_sortOrder_idx" ON "LeagueStory"("sortOrder");

-- AddForeignKey
ALTER TABLE "LeagueStory" ADD CONSTRAINT "LeagueStory_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueStory" ADD CONSTRAINT "LeagueStory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
