import { createStoryPoll, setStoryPollOpen } from "@/actions/story-engagement";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";

type StoryPollSummary = {
  id: string;
  title: string;
  isOpen: boolean;
  questionCount: number;
};

export function StoryPollAdminForm({
  storyId,
  poll,
}: {
  storyId: string;
  poll: StoryPollSummary | null;
}) {
  if (poll) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3">
        <p className="text-sm font-semibold">{poll.title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {poll.questionCount} {poll.questionCount === 1 ? "matchup" : "matchups"} ·{" "}
          {poll.isOpen ? "open" : "closed"}. You can also lock the poll and call
          winners from the live article.
        </p>
        <form
          action={async () => {
            "use server";
            await setStoryPollOpen(poll.id, !poll.isOpen);
          }}
          className="mt-2"
        >
          <SubmitButton size="sm" variant="outline">
            {poll.isOpen ? "Close poll" : "Reopen poll"}
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        "use server";
        await createStoryPoll(formData);
      }}
      className="space-y-3 rounded-xl border border-dashed border-[var(--border)] p-3"
    >
      <input type="hidden" name="storyId" value={storyId} />
      <div>
        <p className="text-sm font-semibold">Add a winner poll</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Use this for primetime slates. Articles without a poll get reactions and
          comments instead.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`poll-title-${storyId}`}>Poll title</Label>
        <Input
          id={`poll-title-${storyId}`}
          name="title"
          required
          placeholder="Week 2 Primetime lock-in"
        />
      </div>
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-6">
          <Input
            name={`q${index}Prompt`}
            placeholder={index === 1 ? "TNF — Lions vs Bills" : `Matchup ${index} (optional)`}
            className="sm:col-span-6"
            required={index === 1}
          />
          <Input
            name={`q${index}a`}
            placeholder="Coach · Team A"
            required={index === 1}
            className="sm:col-span-2"
          />
          <Input name={`q${index}aAbbr`} placeholder="DET" maxLength={4} />
          <Input
            name={`q${index}b`}
            placeholder="Coach · Team B"
            required={index === 1}
            className="sm:col-span-2"
          />
          <Input name={`q${index}bAbbr`} placeholder="BUF" maxLength={4} />
        </div>
      ))}
      <SubmitButton size="sm">Attach poll</SubmitButton>
    </form>
  );
}
