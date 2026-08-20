import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { format } from "date-fns";
import type { StoryCategory } from "@/generated/prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { extractStoryCoverImage } from "@/components/stories/story-body";
import { getActiveSeason } from "@/lib/league";
import { buildShareMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  ensureDefaultLeagueStories,
  getPublishedStories,
  STORY_CATEGORY_LABELS,
} from "@/lib/stories";

export const metadata: Metadata = buildShareMetadata({
  title: "Storylines",
  description:
    "Draft grades, features, and league desk chapters from the Kings Madden League.",
  path: "/storylines",
});

const FILTERS: Array<{ key: string; label: string; category?: StoryCategory }> = [
  { key: "all", label: "All" },
  { key: "DRAFT", label: "Draft desk", category: "DRAFT" },
  { key: "GAME_OF_WEEK", label: "Games of the week", category: "GAME_OF_WEEK" },
  { key: "PLAYER_OF_WEEK", label: "Players of the week", category: "PLAYER_OF_WEEK" },
  { key: "COACHING", label: "Coaching", category: "COACHING" },
  { key: "FEATURE", label: "Front page", category: "FEATURE" },
  { key: "LEAGUE", label: "League desk", category: "LEAGUE" },
];

export default async function StorylinesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const { season } = await getActiveSeason();
  await ensureDefaultLeagueStories(season.id);

  const activeFilter =
    FILTERS.find((f) => f.key === params.category) ?? FILTERS[0];
  const stories = await getPublishedStories({
    category: activeFilter.category,
    take: 100,
  });

  const featured = stories.filter((s) => s.isFeatured);
  const rest = stories.filter((s) => !s.isFeatured);
  const honors = (activeFilter.key === "all" ? rest : stories).filter(
    (story) => story.category === "PLAYER_OF_WEEK"
  );
  const feed =
    activeFilter.key === "all"
      ? rest.filter((story) => story.category !== "PLAYER_OF_WEEK")
      : activeFilter.key === "PLAYER_OF_WEEK"
        ? []
        : stories;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            League wire
          </p>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.04em] sm:text-4xl">
            Storylines
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Every league post in one place — front-page features, draft grades, weekly
            honors, and extras that never make the hero slot.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Back to desk</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const href =
            filter.key === "all" ? "/storylines" : `/storylines?category=${filter.key}`;
          const active = filter.key === activeFilter.key;
          return (
            <Link
              key={filter.key}
              href={href}
              className={
                active
                  ? "rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)]"
                  : "rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--foreground)]"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {stories.length === 0 ? (
        <EmptyState
          title="No storylines yet"
          description="Commissioners can publish from Admin → Stories."
        />
      ) : (
        <div className="space-y-6">
          {featured.length > 0 && activeFilter.key === "all" ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                Front page
              </h2>
              <div className="grid gap-4">
                {featured.map((story) => (
                  <StorylineCard key={story.id} story={story} highlight />
                ))}
              </div>
            </section>
          ) : null}

          {honors.length > 0 &&
          (activeFilter.key === "all" || activeFilter.key === "PLAYER_OF_WEEK") ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Honors desk
              </h2>
              <div className="grid gap-4">
                {honors.map((story) => (
                  <StorylineCard key={story.id} story={story} emphasis />
                ))}
              </div>
            </section>
          ) : null}

          {feed.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {activeFilter.key === "all" ? "All posts" : activeFilter.label}
              </h2>
              <div className="stagger grid gap-4 md:grid-cols-2">
                {feed.map((story) => (
                  <StorylineCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StorylineCard({
  story,
  highlight = false,
  emphasis = false,
}: {
  story: Awaited<ReturnType<typeof getPublishedStories>>[number];
  highlight?: boolean;
  emphasis?: boolean;
}) {
  const cover = extractStoryCoverImage(story.body);

  return (
    <Card
      className={cn(
        "overflow-hidden p-0",
        highlight
          ? "border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
          : emphasis
            ? "border-[color-mix(in_srgb,var(--primary)_42%,var(--border))] shadow-[0_12px_32px_rgba(212,175,55,0.14)]"
            : "surface-hover"
      )}
    >
      <Link
        href={`/storylines/${story.slug}`}
        className="group block h-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      >
        {cover ? (
          <div
            className={cn(
              "relative w-full border-b border-[var(--border)] bg-black",
              highlight ? "aspect-[16/9]" : "aspect-[16/10]"
            )}
          >
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              priority={highlight}
              className="object-cover object-top"
              sizes={
                highlight
                  ? "(max-width: 768px) 100vw, 960px"
                  : "(max-width: 768px) 100vw, 480px"
              }
            />
          </div>
        ) : null}
        <CardHeader>
          <div className="mb-1 flex flex-wrap gap-2">
            <Badge variant="outline">{STORY_CATEGORY_LABELS[story.category]}</Badge>
            {story.isFeatured ? <Badge variant="elite">Featured</Badge> : null}
            {emphasis ? <Badge variant="elite">Honors</Badge> : null}
            {story.week ? <Badge variant="default">Week {story.week}</Badge> : null}
          </div>
          {story.eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              {story.eyebrow}
            </p>
          ) : null}
          <CardTitle
            className={cn(
              highlight ? "text-2xl" : "text-lg",
              "transition-colors group-hover:text-[var(--primary)]"
            )}
          >
            {story.title}
          </CardTitle>
          <CardDescription>{story.summary}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            {format(story.publishedAt, "MMM d, yyyy")}
          </p>
          <span className="text-xs font-semibold text-[var(--primary)]">Read →</span>
        </CardContent>
      </Link>
    </Card>
  );
}
