"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { addStoryComment, deleteStoryComment } from "@/actions/story-engagement";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { StoryCommentView } from "@/lib/story-engagement";

export function StoryComments({
  storyId,
  comments,
  signedIn,
  signInHref,
}: {
  storyId: string;
  comments: StoryCommentView[];
  signedIn: boolean;
  signInHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [thread, setThread] = useState(comments);

  useEffect(() => {
    setThread(comments);
  }, [comments]);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addStoryComment(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else if (result && "comment" in result && result.comment) {
        setBody("");
        setThread((current) => [...current, result.comment]);
        router.refresh();
      } else {
        setBody("");
        router.refresh();
      }
    });
  }

  function remove(commentId: string) {
    setError(null);
    const previous = thread;
    setThread((current) => current.filter((comment) => comment.id !== commentId));
    startTransition(async () => {
      const result = await deleteStoryComment(commentId);
      if (result && "error" in result && result.error) {
        setThread(previous);
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          League comments
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Keep it about the article. The desk reads these.
        </p>
      </div>

      {signedIn ? (
        <form action={submit} className="space-y-2">
          <input type="hidden" name="storyId" value={storyId} />
          <Textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={400}
            placeholder="Your take..."
            className="min-h-[88px]"
            required
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--muted-foreground)]">
              {body.length}/400
            </p>
            <Button type="submit" size="sm" disabled={pending || body.trim().length < 2}>
              {pending ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm">
          <Link href={signInHref} className="font-semibold text-[var(--primary)]">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {thread.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          No comments yet. Open the thread.
        </p>
      ) : (
        <ul className="space-y-3">
          {thread.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)]/60 px-3 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/coach/profiles/${comment.authorUserId}`}
                  className="text-sm font-semibold text-[var(--primary)] underline underline-offset-2 hover:text-[var(--foreground)]"
                >
                  {comment.authorName}
                </Link>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
              {comment.isMine ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(comment.id)}
                  className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-rose-300"
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
