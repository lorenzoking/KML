"use server";

import { revalidatePath } from "next/cache";
import { isCommissioner, requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  createStoryCommentSchema,
  deleteStoryCommentSchema,
  toggleStoryLikeSchema,
} from "@/lib/validations";

function revalidateStoryEngagement(slug: string) {
  revalidatePath(`/storylines/${slug}`);
  revalidatePath("/storylines");
  revalidatePath("/dashboard");
}

export async function toggleStoryLike(formData: FormData) {
  const user = await requireUser();
  const parsed = toggleStoryLikeSchema.safeParse({
    storyId: formData.get("storyId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid like request." };
  }

  const story = await prisma.leagueStory.findFirst({
    where: { id: parsed.data.storyId, isPublished: true },
    select: { id: true, slug: true },
  });
  if (!story) {
    return { error: "Story not found." };
  }

  const existing = await prisma.leagueStoryLike.findUnique({
    where: {
      storyId_userId: { storyId: story.id, userId: user.id },
    },
  });

  if (existing) {
    await prisma.leagueStoryLike.delete({ where: { id: existing.id } });
    await writeAuditLog({
      actorId: user.id,
      action: "UNLIKE_LEAGUE_STORY",
      entityType: "LeagueStory",
      entityId: story.id,
      metadata: { slug: story.slug },
    });
  } else {
    await prisma.leagueStoryLike.create({
      data: { storyId: story.id, userId: user.id },
    });
    await writeAuditLog({
      actorId: user.id,
      action: "LIKE_LEAGUE_STORY",
      entityType: "LeagueStory",
      entityId: story.id,
      metadata: { slug: story.slug },
    });
  }

  revalidateStoryEngagement(story.slug);
  return { success: true, liked: !existing };
}

export async function createStoryComment(formData: FormData) {
  const user = await requireUser();
  const parsed = createStoryCommentSchema.safeParse({
    storyId: formData.get("storyId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  const story = await prisma.leagueStory.findFirst({
    where: { id: parsed.data.storyId, isPublished: true },
    select: { id: true, slug: true },
  });
  if (!story) {
    return { error: "Story not found." };
  }

  const comment = await prisma.leagueStoryComment.create({
    data: {
      storyId: story.id,
      userId: user.id,
      body: parsed.data.body,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "CREATE_LEAGUE_STORY_COMMENT",
    entityType: "LeagueStoryComment",
    entityId: comment.id,
    metadata: { storyId: story.id, slug: story.slug },
  });

  revalidateStoryEngagement(story.slug);
  return { success: true };
}

export async function deleteStoryComment(formData: FormData) {
  const user = await requireUser();
  const commissioner = await isCommissioner(user);
  const parsed = deleteStoryCommentSchema.safeParse({
    commentId: formData.get("commentId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid delete request." };
  }

  const comment = await prisma.leagueStoryComment.findFirst({
    where: { id: parsed.data.commentId, deletedAt: null },
    include: { story: { select: { id: true, slug: true } } },
  });
  if (!comment) {
    return { error: "Comment not found." };
  }

  if (comment.userId !== user.id && !commissioner) {
    return { error: "You can only remove your own comments." };
  }

  await prisma.leagueStoryComment.update({
    where: { id: comment.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: user.id,
    action: commissioner && comment.userId !== user.id
      ? "MODERATE_LEAGUE_STORY_COMMENT"
      : "DELETE_LEAGUE_STORY_COMMENT",
    entityType: "LeagueStoryComment",
    entityId: comment.id,
    metadata: {
      storyId: comment.story.id,
      slug: comment.story.slug,
      authorId: comment.userId,
    },
  });

  revalidateStoryEngagement(comment.story.slug);
  return { success: true };
}
