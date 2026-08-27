import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatLeagueDate } from "@/lib/datetime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  StoryBody,
  extractStoryCoverImage,
} from "@/components/stories/story-body";
import { StoryLightboxImage } from "@/components/stories/story-lightbox-image";
import { StoryEngagement } from "@/components/stories/story-engagement";
import { getSessionUser, isCommissioner } from "@/lib/auth";
import { getCoachStoryLinks } from "@/lib/coach/story-links";
import { getActiveSeason } from "@/lib/league";
import { buildShareMetadata } from "@/lib/site";
import { safeGetStoryEngagement } from "@/lib/story-engagement";
import {
  ensureDefaultLeagueStories,
  getStoryBySlug,
  STORY_CATEGORY_LABELS,
} from "@/lib/stories";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) {
    return { title: "Story not found" };
  }

  const cover = extractStoryCoverImage(story.body);
  return buildShareMetadata({
    title: story.title,
    description: story.summary,
    path: `/storylines/${story.slug}`,
    image: cover?.src,
    type: "article",
  });
}

export default async function StorylineDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { season } = await getActiveSeason();
  await ensureDefaultLeagueStories(season.id);

  const [story, coachLinks, user] = await Promise.all([
    getStoryBySlug(slug),
    getCoachStoryLinks(season.id),
    getSessionUser(),
  ]);
  if (!story) notFound();
  const cover = extractStoryCoverImage(story.body);
  const commissionerUi = user ? await isCommissioner(user) : false;
  const engagement = await safeGetStoryEngagement(story.id, user?.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/storylines">← All storylines</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">League desk</Link>
        </Button>
      </div>

      {engagement?.poll ? (
        <StoryEngagement
          engagement={engagement}
          signedIn={Boolean(user?.isActive)}
          isCommissioner={commissionerUi}
        />
      ) : null}

      <Card className="overflow-hidden border-[color-mix(in_srgb,var(--primary)_28%,var(--border))]">
        {cover ? (
          <div className="relative aspect-[3/2] w-full border-b border-[var(--border)] bg-black sm:aspect-[16/10]">
            <StoryLightboxImage
              src={cover.src}
              alt={cover.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              previewClassName="object-cover object-top"
            />
          </div>
        ) : null}
        <CardHeader className="space-y-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{STORY_CATEGORY_LABELS[story.category]}</Badge>
            {story.isFeatured ? <Badge variant="elite">Featured</Badge> : null}
            {story.week ? <Badge variant="default">Week {story.week}</Badge> : null}
          </div>
          {story.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
              {story.eyebrow}
            </p>
          ) : null}
          <CardTitle className="text-3xl leading-tight sm:text-4xl">{story.title}</CardTitle>
          <CardDescription className="text-base">{story.summary}</CardDescription>
          <p className="text-xs text-[var(--muted-foreground)]">
            {formatLeagueDate(story.publishedAt, "MMMM d, yyyy")}
            {story.author?.name ? ` · ${story.author.name}` : ""}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <StoryBody
            body={story.body}
            omitFirstImage={Boolean(cover)}
            coachLinks={coachLinks}
          />
        </CardContent>
      </Card>

      {engagement && !engagement.poll ? (
        <StoryEngagement
          engagement={engagement}
          signedIn={Boolean(user?.isActive)}
          isCommissioner={commissionerUi}
        />
      ) : null}
    </div>
  );
}
