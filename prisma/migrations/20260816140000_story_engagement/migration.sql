-- CreateTable
CREATE TABLE "StoryPoll" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryPollQuestion" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoryPollQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryPollOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "franchiseAbbr" TEXT,
    "franchiseId" TEXT,
    "coachUserId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoryPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryPollVote" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryReaction" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryComment" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryPoll_storyId_key_key" ON "StoryPoll"("storyId", "key");

-- CreateIndex
CREATE INDEX "StoryPoll_storyId_idx" ON "StoryPoll"("storyId");

-- CreateIndex
CREATE INDEX "StoryPollQuestion_pollId_idx" ON "StoryPollQuestion"("pollId");

-- CreateIndex
CREATE INDEX "StoryPollOption_questionId_idx" ON "StoryPollOption"("questionId");

-- CreateIndex
CREATE INDEX "StoryPollOption_coachUserId_idx" ON "StoryPollOption"("coachUserId");

-- CreateIndex
CREATE INDEX "StoryPollOption_franchiseId_idx" ON "StoryPollOption"("franchiseId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryPollVote_questionId_userId_key" ON "StoryPollVote"("questionId", "userId");

-- CreateIndex
CREATE INDEX "StoryPollVote_optionId_idx" ON "StoryPollVote"("optionId");

-- CreateIndex
CREATE INDEX "StoryPollVote_userId_idx" ON "StoryPollVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryReaction_storyId_userId_emoji_key" ON "StoryReaction"("storyId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "StoryReaction_storyId_idx" ON "StoryReaction"("storyId");

-- CreateIndex
CREATE INDEX "StoryComment_storyId_createdAt_idx" ON "StoryComment"("storyId", "createdAt");

-- CreateIndex
CREATE INDEX "StoryComment_userId_idx" ON "StoryComment"("userId");

-- AddForeignKey
ALTER TABLE "StoryPoll" ADD CONSTRAINT "StoryPoll_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "LeagueStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPollQuestion" ADD CONSTRAINT "StoryPollQuestion_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "StoryPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPollOption" ADD CONSTRAINT "StoryPollOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "StoryPollQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPollOption" ADD CONSTRAINT "StoryPollOption_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPollOption" ADD CONSTRAINT "StoryPollOption_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPollVote" ADD CONSTRAINT "StoryPollVote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "StoryPollQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPollVote" ADD CONSTRAINT "StoryPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "StoryPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPollVote" ADD CONSTRAINT "StoryPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReaction" ADD CONSTRAINT "StoryReaction_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "LeagueStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReaction" ADD CONSTRAINT "StoryReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "LeagueStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryComment" ADD CONSTRAINT "StoryComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
