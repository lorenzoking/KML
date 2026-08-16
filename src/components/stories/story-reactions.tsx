"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleStoryReaction } from "@/actions/story-engagement";
import type { StoryReactionView } from "@/lib/story-engagement";

export function StoryReactions({
  storyId,
  reactions,
  signedIn,
  signInHref,
}: {
  storyId: string;
  reactions: StoryReactionView[];
  signedIn: boolean;
  signInHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(emoji: string) {
    if (!signedIn) return;
    setError(null);
    startTransition(async () => {
      const result = await toggleStoryReaction(storyId, emoji);
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          League reaction
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Leave a mark on the article. Tap again to take it back.
        </p>
      </div>
      {!signedIn ? (
        <p className="text-sm">
          <Link href={signInHref} className="font-semibold text-[var(--primary)]">
            Sign in
          </Link>{" "}
          to react.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {reactions.map((reaction) => (
          <button
            key={reaction.key}
            type="button"
            disabled={!signedIn || pending}
            onClick={() => toggle(reaction.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-[border-color,background-color] disabled:cursor-not-allowed ${
              reaction.mine
                ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_16%,transparent)]"
                : "border-[var(--border)] bg-[var(--card)]/70 hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))]"
            }`}
            aria-pressed={reaction.mine}
            aria-label={reaction.label}
          >
            <span aria-hidden="true">{reaction.emoji}</span>
            <span className="font-semibold">{reaction.label}</span>
            <span className="text-[var(--muted-foreground)]">{reaction.count}</span>
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
