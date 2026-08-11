import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
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
import { StoryLikeButton } from "@/components/stories/story-like-button";
import { StoryComments } from "@/components/stories/story-comments";
import { getSessionUser, isCommissioner } from "@/lib/auth";
import { getActiveSeason } from "@/lib/league";
import { buildShareMetadata } from "@/lib/site";
import {
  ensureDefaultLeagueStories,
  getStoryBySlug,
  STORY_CATEGORY_LABELS,
} from "@/lib/stories";

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
  const user = await getSessionUser();
  const { season } = await getActiveSeason();
  await ensureDefaultLeagueStories(season.id);

  const story = await getStoryBySlug(slug, user?.id);
  if (!story) notFound();
  const cover = extractStoryCoverImage(story.body);
  const likedByViewer = Boolean(story.likes?.length);
  const canModerate = user ? await isCommissioner(user) : false;

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

      <Card className="overflow-hidden border-[color-mix(in_srgb,var(--primary)_28%,var(--border))]">
        {cover ? (
          <div className="relative aspect-[3/2] w-full border-b border-[var(--border)] bg-black sm:aspect-[16/10]">
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              priority
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 768px"
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
            {format(story.publishedAt, "MMMM d, yyyy")}
            {story.author?.name ? ` · ${story.author.name}` : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <StoryBody body={story.body} omitFirstImage={Boolean(cover)} />
          <div className="border-t border-[var(--border)] pt-5">
            <StoryLikeButton
              storyId={story.id}
              likeCount={story._count.likes}
              likedByViewer={likedByViewer}
              signedIn={Boolean(user?.isActive)}
            />
          </div>
          <div className="border-t border-[var(--border)] pt-5">
            <StoryComments
              storyId={story.id}
              comments={story.comments}
              viewerId={user?.id}
              canModerate={canModerate}
              signedIn={Boolean(user?.isActive)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
