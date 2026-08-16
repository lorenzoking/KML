"use server";

import { revalidatePath } from "next/cache";
import { StoryCategory } from "@prisma/client";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import { writeAuditLog } from "@/lib/audit";
import {
  createLeagueStorySchema,
  updateLeagueStorySchema,
} from "@/lib/validations";

function revalidateStoryPaths(slug?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/admin/stories");
  revalidatePath("/admin");
  revalidatePath("/storylines");
  if (slug) revalidatePath(`/storylines/${slug}`);
}

export async function createLeagueStory(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season } = await getActiveSeason();

  const parsed = createLeagueStorySchema.safeParse({
    title: formData.get("title"),
    eyebrow: formData.get("eyebrow") || undefined,
    summary: formData.get("summary"),
    body: formData.get("body"),
    category: formData.get("category"),
    week: formData.get("week") || undefined,
    isFeatured: formData.get("isFeatured") === "true",
    isPublished: formData.get("isPublished") !== "false",
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid story." };
  }

  const slugBase = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  if (parsed.data.isFeatured) {
    await prisma.leagueStory.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false },
    });
  }

  const row = await prisma.leagueStory.create({
    data: {
      slug,
      title: parsed.data.title,
      eyebrow: parsed.data.eyebrow,
      summary: parsed.data.summary,
      body: parsed.data.body,
      category: parsed.data.category as StoryCategory,
      week: parsed.data.week,
      seasonId: season.id,
      isFeatured: parsed.data.isFeatured,
      isPublished: parsed.data.isPublished,
      sortOrder: parsed.data.sortOrder,
      authorId: commissioner.id,
      publishedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "CREATE_LEAGUE_STORY",
    entityType: "LeagueStory",
    entityId: row.id,
    metadata: { slug: row.slug, category: row.category },
  });

  revalidateStoryPaths(row.slug);
  return { success: true };
}

export async function updateLeagueStory(formData: FormData) {
  const commissioner = await requireCommissioner();
  const parsed = updateLeagueStorySchema.safeParse({
    storyId: formData.get("storyId"),
    title: formData.get("title"),
    eyebrow: formData.get("eyebrow") || undefined,
    summary: formData.get("summary"),
    body: formData.get("body"),
    category: formData.get("category"),
    week: formData.get("week") || undefined,
    isFeatured: formData.get("isFeatured") === "true",
    isPublished: formData.get("isPublished") === "true",
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid story update." };
  }

  if (parsed.data.isFeatured) {
    await prisma.leagueStory.updateMany({
      where: { isFeatured: true, NOT: { id: parsed.data.storyId } },
      data: { isFeatured: false },
    });
  }

  const row = await prisma.leagueStory.update({
    where: { id: parsed.data.storyId },
    data: {
      title: parsed.data.title,
      eyebrow: parsed.data.eyebrow,
      summary: parsed.data.summary,
      body: parsed.data.body,
      category: parsed.data.category as StoryCategory,
      week: parsed.data.week,
      isFeatured: parsed.data.isFeatured,
      isPublished: parsed.data.isPublished,
      sortOrder: parsed.data.sortOrder,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "UPDATE_LEAGUE_STORY",
    entityType: "LeagueStory",
    entityId: row.id,
    metadata: parsed.data,
  });

  revalidateStoryPaths(row.slug);
  return { success: true };
}
