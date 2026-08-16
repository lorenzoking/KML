"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { voteStoryPoll } from "@/actions/story-engagement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StoryPollView } from "@/lib/story-engagement";

function percent(votes: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((votes / total) * 100);
}

function leanForOptions(votes: number[]) {
  const max = Math.max(...votes);
  const min = Math.min(...votes);
  if (votes.every((count) => count === 0) || max === min) {
    return votes.map(() => "split" as const);
  }
  return votes.map((count) => (count === max ? ("favorite" as const) : ("underdog" as const)));
}

function applyPollVote(
  poll: StoryPollView,
  questionId: string,
  optionId: string
): StoryPollView {
  const hadAnyVote = poll.questions.some((question) => question.myOptionId);
  const questions = poll.questions.map((question) => {
    if (question.id !== questionId) return question;
    const previous = question.myOptionId;
    const options = question.options.map((option) => {
      let votes = option.votes;
      if (previous === option.id) votes = Math.max(0, votes - 1);
      if (option.id === optionId && previous !== optionId) votes += 1;
      return { ...option, votes };
    });
    const voteCounts = options.map((option) => option.votes);
    const leans = leanForOptions(voteCounts);
    const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);
    return {
      ...question,
      myOptionId: optionId,
      totalVotes,
      options: options.map((option, index) => ({
        ...option,
        lean: totalVotes > 0 ? leans[index] ?? null : null,
      })),
    };
  });

  return {
    ...poll,
    questions,
    totalVoters: hadAnyVote ? poll.totalVoters : poll.totalVoters + 1,
  };
}

export function StoryPollCard({
  poll,
  signedIn,
  signInHref,
}: {
  poll: StoryPollView;
  signedIn: boolean;
  signInHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [board, setBoard] = useState(poll);

  useEffect(() => {
    setBoard(poll);
  }, [poll]);

  function pick(questionId: string, optionId: string) {
    if (!board.isOpen) return;
    if (!signedIn) {
      router.push(signInHref);
      return;
    }

    const previous = board;
    setError(null);
    setPendingQuestionId(questionId);
    setBoard(applyPollVote(board, questionId, optionId));

    startTransition(async () => {
      const result = await voteStoryPoll(questionId, optionId);
      if (result && "error" in result && result.error) {
        setBoard(previous);
        setError(result.error);
      } else if (result && "poll" in result && result.poll) {
        setBoard(result.poll);
      }
      setPendingQuestionId(null);
    });
  }

  return (
    <Card className="border-[color-mix(in_srgb,var(--primary)_28%,var(--border))]">
      <CardHeader className="space-y-2 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="elite">League lock-in</Badge>
          {board.isOpen ? (
            <Badge variant="outline">Open</Badge>
          ) : (
            <Badge variant="pressured">Closed</Badge>
          )}
          {board.totalVoters > 0 ? (
            <Badge variant="outline">
              {board.totalVoters} {board.totalVoters === 1 ? "coach" : "coaches"} voted
            </Badge>
          ) : null}
        </div>
        <CardTitle>{board.title}</CardTitle>
        <CardDescription>
          Pick who you think wins each window. The board updates as soon as you
          lock a side so you can see favorites vs underdogs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {!signedIn ? (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-sm">
            <Link href={signInHref} className="font-semibold text-[var(--primary)]">
              Sign in
            </Link>{" "}
            to lock your picks. Guests can still see the live board.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {board.questions.map((question) => {
          const showResults = !signedIn || Boolean(question.myOptionId);
          const busy = pending && pendingQuestionId === question.id;
          return (
            <div key={question.id} className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                  {question.prompt}
                </p>
                {showResults && question.totalVotes > 0 ? (
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {question.totalVotes}{" "}
                    {question.totalVotes === 1 ? "pick" : "picks"}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => {
                  const selected = question.myOptionId === option.id;
                  const share = percent(option.votes, question.totalVotes);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={!board.isOpen || busy}
                      onClick={() => pick(question.id, option.id)}
                      className={`rounded-xl border px-3 py-3 text-left transition-[border-color,background-color,transform] disabled:cursor-not-allowed ${
                        selected
                          ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_16%,transparent)]"
                          : "border-[var(--border)] bg-[var(--card)]/70 hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{option.label}</span>
                        {showResults && option.lean && question.totalVotes > 0 ? (
                          <Badge
                            variant={option.lean === "favorite" ? "elite" : "outline"}
                            className="shrink-0"
                          >
                            {option.lean === "favorite"
                              ? "Favorite"
                              : option.lean === "underdog"
                                ? "Underdog"
                                : "Split"}
                          </Badge>
                        ) : null}
                      </div>
                      {showResults ? (
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                            <div
                              className="h-full rounded-full bg-[var(--primary)]"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {share}% · {option.votes}{" "}
                            {option.votes === 1 ? "pick" : "picks"}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                          Tap to lock this side
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!board.isOpen ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            This lock-in is closed. The board stays up as the league tape.
          </p>
        ) : signedIn ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            You can change a pick until the desk closes the poll.
          </p>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={signInHref}>Sign in to pick winners</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
