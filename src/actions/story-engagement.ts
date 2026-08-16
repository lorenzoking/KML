"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser, requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import {
  getStoryEngagement,
  resolveFranchiseCoach,
  STORY_REACTION_KEYS,
} from "@/lib/story-engagement";

const voteSchema = z.object({
  questionId: z.string().min(1),
  optionId: z.string().min(1),
});

const reactionSchema = z.object({
  storyId: z.string().min(1),
  emoji: z.enum(STORY_REACTION_KEYS),
});

const commentSchema = z.object({
  storyId: z.string().min(1),
  body: z.string().trim().min(2, "Say a little more than that.").max(400),
});

const createPollSchema = z.object({
  storyId: z.string().min(1),
  title: z.string().trim().min(4).max(80),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(4).max(120),
        options: z
          .array(
            z.object({
              label: z.string().trim().min(2).max(60),
              franchiseAbbr: z.string().trim().max(4).optional(),
            })
          )
          .min(2)
          .max(4),
      })
    )
    .min(1)
    .max(6),
});

function revalidateStoryEngagement(slug: string) {
  revalidatePath("/storylines");
  revalidatePath(`/storylines/${slug}`, "page");
  revalidatePath("/dashboard");
  revalidatePath("/admin/stories");
}

async function requireActiveUser() {
  const user = await getSessionUser();
  if (!user) return { error: "Sign in to join the desk." as const };
  if (!user.isActive) return { error: "Your account is inactive." as const };
  return { user };
}

export async function voteStoryPoll(questionId: string, optionId: string) {
  const auth = await requireActiveUser();
  if ("error" in auth) return auth;

  const parsed = voteSchema.safeParse({ questionId, optionId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid pick." };
  }

  const option = await prisma.storyPollOption.findFirst({
    where: { id: parsed.data.optionId, questionId: parsed.data.questionId },
    include: {
      question: {
        include: {
          poll: { include: { story: { select: { id: true, slug: true } } } },
        },
      },
    },
  });
  if (!option) return { error: "That matchup is no longer on the board." };
  if (!option.question.poll.isOpen) {
    return { error: "This poll is closed." };
  }

  await prisma.storyPollVote.upsert({
    where: {
      questionId_userId: {
        questionId: parsed.data.questionId,
        userId: auth.user.id,
      },
    },
    update: { optionId: parsed.data.optionId },
    create: {
      questionId: parsed.data.questionId,
      optionId: parsed.data.optionId,
      userId: auth.user.id,
    },
  });

  revalidateStoryEngagement(option.question.poll.story.slug);
  const engagement = await getStoryEngagement(
    option.question.poll.story.id,
    auth.user.id
  );
  return { success: true, poll: engagement?.poll ?? null };
}

export async function toggleStoryReaction(storyId: string, emoji: string) {
  const auth = await requireActiveUser();
  if ("error" in auth) return auth;

  const parsed = reactionSchema.safeParse({ storyId, emoji });
  if (!parsed.success) return { error: "That reaction is not available." };

  const story = await prisma.leagueStory.findUnique({
    where: { id: parsed.data.storyId },
    select: { slug: true, polls: { select: { id: true }, take: 1 } },
  });
  if (!story) return { error: "Story not found." };
  if (story.polls.length > 0) {
    return { error: "This article uses a poll instead of reactions." };
  }

  const existing = await prisma.storyReaction.findUnique({
    where: {
      storyId_userId_emoji: {
        storyId: parsed.data.storyId,
        userId: auth.user.id,
        emoji: parsed.data.emoji,
      },
    },
  });

  if (existing) {
    await prisma.storyReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.storyReaction.create({
      data: {
        storyId: parsed.data.storyId,
        userId: auth.user.id,
        emoji: parsed.data.emoji,
      },
    });
  }

  revalidateStoryEngagement(story.slug);
  return { success: true };
}

export async function addStoryComment(formData: FormData) {
  const auth = await requireActiveUser();
  if ("error" in auth) return auth;

  const parsed = commentSchema.safeParse({
    storyId: formData.get("storyId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  const story = await prisma.leagueStory.findUnique({
    where: { id: parsed.data.storyId },
    select: { slug: true, polls: { select: { id: true }, take: 1 } },
  });
  if (!story) return { error: "Story not found." };
  if (story.polls.length > 0) {
    return { error: "This article uses a poll instead of comments." };
  }

  const recent = await prisma.storyComment.findFirst({
    where: {
      storyId: parsed.data.storyId,
      userId: auth.user.id,
      createdAt: { gt: new Date(Date.now() - 15_000) },
    },
    select: { id: true },
  });
  if (recent) return { error: "Give it a second before posting again." };

  const row = await prisma.storyComment.create({
    data: {
      storyId: parsed.data.storyId,
      userId: auth.user.id,
      body: parsed.data.body,
    },
    include: { user: { select: { name: true } } },
  });

  revalidateStoryEngagement(story.slug);
  return {
    success: true,
    comment: {
      id: row.id,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      authorName: row.user.name?.trim() || "League coach",
      authorUserId: row.userId,
      isMine: true,
    },
  };
}

export async function deleteStoryComment(commentId: string) {
  const auth = await requireActiveUser();
  if ("error" in auth) return auth;

  const comment = await prisma.storyComment.findUnique({
    where: { id: commentId },
    include: { story: { select: { slug: true } } },
  });
  if (!comment) return { error: "Comment not found." };
  if (comment.userId !== auth.user.id) {
    return { error: "You can only remove your own comment." };
  }

  await prisma.storyComment.delete({ where: { id: commentId } });
  revalidateStoryEngagement(comment.story.slug);
  return { success: true };
}

export async function createStoryPoll(formData: FormData) {
  const commissioner = await requireCommissioner();

  const questions: Array<{
    prompt: string;
    options: Array<{ label: string; franchiseAbbr?: string }>;
  }> = [];
  for (let index = 1; index <= 6; index += 1) {
    const prompt = String(formData.get(`q${index}Prompt`) ?? "").trim();
    const optionA = String(formData.get(`q${index}a`) ?? "").trim();
    const optionB = String(formData.get(`q${index}b`) ?? "").trim();
    const abbrA = String(formData.get(`q${index}aAbbr`) ?? "").trim().toUpperCase();
    const abbrB = String(formData.get(`q${index}bAbbr`) ?? "").trim().toUpperCase();
    if (!prompt && !optionA && !optionB) continue;
    if (!prompt || !optionA || !optionB) {
      return { error: `Matchup ${index} needs a prompt and two sides.` };
    }
    questions.push({
      prompt,
      options: [
        { label: optionA, franchiseAbbr: abbrA || undefined },
        { label: optionB, franchiseAbbr: abbrB || undefined },
      ],
    });
  }

  const parsed = createPollSchema.safeParse({
    storyId: formData.get("storyId"),
    title: formData.get("title"),
    questions,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid poll." };
  }

  const story = await prisma.leagueStory.findUnique({
    where: { id: parsed.data.storyId },
    select: { id: true, slug: true, seasonId: true, polls: { select: { id: true } } },
  });
  if (!story) return { error: "Story not found." };
  if (story.polls.length > 0) {
    return { error: "This article already has a poll." };
  }

  await prisma.storyPoll.create({
    data: {
      storyId: story.id,
      key: "desk",
      title: parsed.data.title,
      questions: {
        create: await Promise.all(
          parsed.data.questions.map(async (question, questionIndex) => ({
            prompt: question.prompt,
            sortOrder: questionIndex,
            options: {
              create: await Promise.all(
                question.options.map(async (option, optionIndex) => {
                  const refs = await resolveFranchiseCoach(
                    story.seasonId,
                    option.franchiseAbbr
                  );
                  return {
                    label: option.label,
                    franchiseAbbr: refs.franchiseAbbr ?? option.franchiseAbbr ?? null,
                    franchiseId: refs.franchiseId,
                    coachUserId: refs.coachUserId,
                    sortOrder: optionIndex,
                  };
                })
              ),
            },
          }))
        ),
      },
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "CREATE_STORY_POLL",
    entityType: "LeagueStory",
    entityId: story.id,
    metadata: { title: parsed.data.title, questions: parsed.data.questions.length },
  });

  revalidateStoryEngagement(story.slug);
  return { success: true };
}

export async function setStoryPollOpen(pollId: string, isOpen: boolean) {
  const commissioner = await requireCommissioner();
  const poll = await prisma.storyPoll.update({
    where: { id: pollId },
    data: { isOpen },
    include: { story: { select: { slug: true, id: true } } },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: isOpen ? "OPEN_STORY_POLL" : "CLOSE_STORY_POLL",
    entityType: "LeagueStory",
    entityId: poll.story.id,
    metadata: { pollId },
  });

  revalidateStoryEngagement(poll.story.slug);
  return { success: true };
}
