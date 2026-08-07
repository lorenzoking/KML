import Link from "next/link";
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
import { StoryBody } from "@/components/stories/story-body";
import { getActiveSeason } from "@/lib/league";
import {
  ensureDefaultLeagueStories,
  getStoryBySlug,
  STORY_CATEGORY_LABELS,
} from "@/lib/stories";

export default async function StorylineDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { season } = await getActiveSeason();
  await ensureDefaultLeagueStories(season.id);

  const story = await getStoryBySlug(slug);
  if (!story) notFound();

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
        <CardContent className="pt-6">
          <StoryBody body={story.body} />
        </CardContent>
      </Card>
    </div>
  );
}
