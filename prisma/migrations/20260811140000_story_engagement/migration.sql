-- CreateTable
CREATE TABLE "LeagueStoryLike" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueStoryLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueStoryComment" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueStoryComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeagueStoryLike_userId_idx" ON "LeagueStoryLike"("userId");

-- CreateIndex
CREATE INDEX "LeagueStoryLike_storyId_idx" ON "LeagueStoryLike"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueStoryLike_storyId_userId_key" ON "LeagueStoryLike"("storyId", "userId");

-- CreateIndex
CREATE INDEX "LeagueStoryComment_storyId_createdAt_idx" ON "LeagueStoryComment"("storyId", "createdAt");

-- CreateIndex
CREATE INDEX "LeagueStoryComment_userId_idx" ON "LeagueStoryComment"("userId");

-- CreateIndex
CREATE INDEX "LeagueStoryComment_deletedAt_idx" ON "LeagueStoryComment"("deletedAt");

-- AddForeignKey
ALTER TABLE "LeagueStoryLike" ADD CONSTRAINT "LeagueStoryLike_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "LeagueStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueStoryLike" ADD CONSTRAINT "LeagueStoryLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueStoryComment" ADD CONSTRAINT "LeagueStoryComment_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "LeagueStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueStoryComment" ADD CONSTRAINT "LeagueStoryComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
