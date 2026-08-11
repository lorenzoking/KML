"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  createStoryComment,
  deleteStoryComment,
} from "@/actions/story-engagement";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type StoryCommentItem = {
  id: string;
  body: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export function StoryComments({
  storyId,
  comments,
  viewerId,
  canModerate,
  signedIn,
}: {
  storyId: string;
  comments: StoryCommentItem[];
  viewerId?: string | null;
  canModerate: boolean;
  signedIn: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <section className="space-y-4" aria-labelledby="story-comments-heading">
      <div>
        <h2
          id="story-comments-heading"
          className="text-lg font-semibold uppercase tracking-[0.04em]"
        >
          Coach comments
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {comments.length === 0
            ? "No comments yet — be the first coach to weigh in."
            : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
        </p>
      </div>

      {signedIn ? (
        <form
          className="space-y-3"
          action={(formData) => {
            setError(null);
            setSuccess(null);
            startTransition(async () => {
              const result = await createStoryComment(formData);
              if (result?.error) setError(result.error);
              else {
                setSuccess("Comment posted.");
                setBody("");
              }
            });
          }}
        >
          <input type="hidden" name="storyId" value={storyId} />
          <div className="space-y-2">
            <Label htmlFor="story-comment-body">Leave a comment</Label>
            <Textarea
              id="story-comment-body"
              name="body"
              rows={3}
              maxLength={1000}
              placeholder="Share your take with the league…"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="success-banner rounded-md px-3 py-2 text-sm">{success}</p>
          ) : null}
          <SubmitButton disabled={pending} pendingText="Posting...">
            Post comment
          </SubmitButton>
        </form>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-3 text-sm">
          <p className="text-[var(--muted-foreground)]">
            Coaches can leave comments after signing in.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/sign-in">Sign in to comment</Link>
          </Button>
        </div>
      )}

      {deleteError ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {deleteError}
        </p>
      ) : null}

      <ul className="space-y-3">
        {comments.map((comment) => {
          const canDelete =
            Boolean(viewerId) &&
            (comment.user.id === viewerId || canModerate);
          const createdAt =
            typeof comment.createdAt === "string"
              ? new Date(comment.createdAt)
              : comment.createdAt;

          return (
            <li
              key={comment.id}
              className="rounded-lg border border-[var(--border)] px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {comment.user.name?.trim() || "Coach"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {format(createdAt, "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                {canDelete ? (
                  <form
                    action={(formData) => {
                      setDeleteError(null);
                      startTransition(async () => {
                        const result = await deleteStoryComment(formData);
                        if (result?.error) setDeleteError(result.error);
                      });
                    }}
                  >
                    <input type="hidden" name="commentId" value={comment.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      className="text-xs text-[var(--muted-foreground)]"
                    >
                      Remove
                    </Button>
                  </form>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {comment.body}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
