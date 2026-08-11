"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleStoryLike } from "@/actions/story-engagement";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StoryLikeButton({
  storyId,
  likeCount,
  likedByViewer,
  signedIn,
}: {
  storyId: string;
  likeCount: number;
  likedByViewer: boolean;
  signedIn: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useState(likedByViewer);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);

  useEffect(() => {
    setOptimisticLiked(likedByViewer);
    setOptimisticCount(likeCount);
  }, [likedByViewer, likeCount]);

  if (!signedIn) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Heart className="size-4" aria-hidden />
          <span>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/sign-in">Sign in to like</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form
        action={(formData) => {
          setError(null);
          const nextLiked = !optimisticLiked;
          setOptimisticLiked(nextLiked);
          setOptimisticCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
          startTransition(async () => {
            const result = await toggleStoryLike(formData);
            if (result?.error) {
              setOptimisticLiked(likedByViewer);
              setOptimisticCount(likeCount);
              setError(result.error);
            }
          });
        }}
      >
        <input type="hidden" name="storyId" value={storyId} />
        <Button
          type="submit"
          variant={optimisticLiked ? "default" : "outline"}
          size="sm"
          disabled={pending}
          className="gap-2"
          aria-pressed={optimisticLiked}
        >
          <Heart
            className={cn("size-4", optimisticLiked && "fill-current")}
            aria-hidden
          />
          <span>
            {optimisticLiked ? "Liked" : "Like"}
            <span className="opacity-80"> · {optimisticCount}</span>
          </span>
        </Button>
      </form>
      {error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
