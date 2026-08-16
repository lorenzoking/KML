import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { createLeagueStory, updateLeagueStory } from "@/actions/stories";
import { prisma } from "@/lib/prisma";
import { ensureDefaultLeagueStories, STORY_CATEGORY_LABELS } from "@/lib/stories";
import { getActiveSeason } from "@/lib/league";
import { StoryPollAdminForm } from "@/components/stories/story-poll-admin-form";

async function getAdminStories() {
  try {
    return await prisma.leagueStory.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }],
      include: {
        polls: {
          select: {
            id: true,
            title: true,
            isOpen: true,
            _count: { select: { questions: true } },
          },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Admin story polls unavailable:", error);
    const stories = await prisma.leagueStory.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }],
    });
    return stories.map((story) => ({ ...story, polls: [] }));
  }
}

export default async function AdminStoriesPage() {
  const { season } = await getActiveSeason();
  await ensureDefaultLeagueStories(season.id);

  const stories = await getAdminStories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">League stories</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Write the front page, games of the week, players of the week, and coaching
          storylines that make the dashboard feel alive. Primetime slates can get a
          winner poll; every other article gets reactions and comments automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publish a story</CardTitle>
          <CardDescription>
            Featured stories become the dashboard front page. Only one featured story
            is active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await createLeagueStory(formData);
            }}
            className="grid gap-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Front-page headline" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eyebrow">Eyebrow</Label>
                <Input id="eyebrow" name="eyebrow" placeholder="Season 1 · Draft desk" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="FEATURE">
                  {Object.entries(STORY_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  name="summary"
                  required
                  placeholder="One or two sentences for the card teaser"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  name="body"
                  required
                  className="min-h-[160px]"
                  placeholder="Full story copy. Use blank lines between paragraphs."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="week">Week (optional)</Label>
                <Input id="week" name="week" type="number" min={1} max={30} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isFeatured">Featured front page?</Label>
                <Select id="isFeatured" name="isFeatured" defaultValue="false">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isPublished">Published?</Label>
                <Select id="isPublished" name="isPublished" defaultValue="true">
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </Select>
              </div>
            </div>
            <SubmitButton>Publish story</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {stories.map((story) => (
          <Card key={story.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{story.title}</CardTitle>
                <Badge variant="outline">{STORY_CATEGORY_LABELS[story.category]}</Badge>
                {story.isFeatured ? <Badge variant="elite">Featured</Badge> : null}
                <Badge variant={story.isPublished ? "stable" : "pressured"}>
                  {story.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              <CardDescription>{story.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData) => {
                  "use server";
                  await updateLeagueStory(formData);
                }}
                className="grid gap-3"
              >
                <input type="hidden" name="storyId" value={story.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Title</Label>
                    <Input name="title" defaultValue={story.title} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Eyebrow</Label>
                    <Input name="eyebrow" defaultValue={story.eyebrow ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select name="category" defaultValue={story.category}>
                      {Object.entries(STORY_CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Summary</Label>
                    <Input name="summary" defaultValue={story.summary} required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Body</Label>
                    <Textarea name="body" defaultValue={story.body} className="min-h-[140px]" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Week</Label>
                    <Input
                      name="week"
                      type="number"
                      defaultValue={story.week ?? undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort order</Label>
                    <Input name="sortOrder" type="number" defaultValue={story.sortOrder} />
                  </div>
                  <div className="space-y-2">
                    <Label>Featured?</Label>
                    <Select name="isFeatured" defaultValue={story.isFeatured ? "true" : "false"}>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Published?</Label>
                    <Select name="isPublished" defaultValue={story.isPublished ? "true" : "false"}>
                      <option value="true">Published</option>
                      <option value="false">Draft</option>
                    </Select>
                  </div>
                </div>
                <SubmitButton size="sm">Save story</SubmitButton>
              </form>
              <div className="mt-4">
                <StoryPollAdminForm
                  storyId={story.id}
                  poll={
                    story.polls[0]
                      ? {
                          id: story.polls[0].id,
                          title: story.polls[0].title,
                          isOpen: story.polls[0].isOpen,
                          questionCount: story.polls[0]._count.questions,
                        }
                      : null
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
