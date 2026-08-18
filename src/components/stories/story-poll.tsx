"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { voteStoryPoll, setStoryPollOpen, declareStoryPollWinner } from "@/actions/story-engagement";
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
      finalScore: question.finalScore,
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
  isCommissioner = false,
}: {
  poll: StoryPollView;
  signedIn: boolean;
  signInHref: string;
  isCommissioner?: boolean;
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

  function togglePoll() {
    setError(null);
    startTransition(async () => {
      const result = await setStoryPollOpen(board.id, !board.isOpen);
      if (result.poll) {
        setBoard(result.poll);
      } else {
        setBoard({ ...board, isOpen: result.isOpen });
      }
      router.refresh();
    });
  }

  function callWinner(questionId: string, optionId: string | null) {
    const previous = board;
    setError(null);
    startTransition(async () => {
      const result = await declareStoryPollWinner(questionId, optionId);
      if (result && "error" in result && result.error) {
        setBoard(previous);
        setError(result.error);
      } else if (result && "poll" in result && result.poll) {
        setBoard(result.poll);
      }
      router.refresh();
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
          Pick who you think wins each window. After a result is approved — or
          the desk calls a winner — we keep a running record of which coaches
          got the most winners right.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {isCommissioner ? (
          <div className="space-y-3 rounded-xl border border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 py-3">
            <div>
              <p className="text-sm font-semibold">Commissioner desk</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Lock the poll when picks are closed. If coaches have not
                submitted a score yet, call the winner here so the board can
                grade. An approved game result always overrides a desk call.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={togglePoll}
            >
              {board.isOpen ? "Lock poll" : "Reopen poll"}
            </Button>
          </div>
        ) : null}
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
                {question.finalScore ? (
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    {question.resultSource === "declared" ? "Desk call" : "Final"}:{" "}
                    {question.finalScore.replace(" (desk call)", "")}
                  </p>
                ) : null}
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
                        {option.result === "won" ? (
                          <Badge variant="elite" className="shrink-0">
                            Winner
                          </Badge>
                        ) : option.result === "lost" ? (
                          <Badge variant="outline" className="shrink-0">
                            Lost
                          </Badge>
                        ) : showResults && option.lean && question.totalVotes > 0 ? (
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
              {isCommissioner ? (
                <div className="flex flex-wrap items-center gap-2">
                  {question.resultSource === "approved" ? (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Graded from an approved score.
                    </p>
                  ) : (
                    <>
                      {question.options.map((option) => (
                        <Button
                          key={option.id}
                          type="button"
                          size="sm"
                          variant={
                            question.declaredWinnerOptionId === option.id
                              ? "default"
                              : "outline"
                          }
                          disabled={pending}
                          onClick={() => callWinner(question.id, option.id)}
                        >
                          {option.franchiseAbbr ?? option.label} won
                        </Button>
                      ))}
                      {question.declaredWinnerOptionId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => callWinner(question.id, null)}
                        >
                          Clear call
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}

        <PollLeaderboard
          gradedMatchups={board.gradedMatchups}
          leaderboard={board.leaderboard}
        />

        {!board.isOpen ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            This lock-in is closed. Winners update from approved results or a
            desk call, and the board stays up as the league tape.
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

function PollLeaderboard({
  gradedMatchups,
  leaderboard,
}: {
  gradedMatchups: number;
  leaderboard: StoryPollView["leaderboard"];
}) {
  if (gradedMatchups <= 0) {
    return (
      <p className="border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
        Coach records unlock after the first graded result. Then we rank
        everyone who voted by how many winners they got right.
      </p>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <p className="border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
        Finals are in, but nobody voted on those matchups yet.
      </p>
    );
  }

  const ranks: number[] = [];
  for (let index = 0; index < leaderboard.length; index += 1) {
    const prev = leaderboard[index - 1];
    const row = leaderboard[index]!;
    if (prev && prev.correct === row.correct && prev.wrong === row.wrong) {
      ranks.push(ranks[index - 1] ?? index);
    } else {
      ranks.push(index + 1);
    }
  }

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          Who’s got it right
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {gradedMatchups} graded {gradedMatchups === 1 ? "window" : "windows"} ·
          record is correct–wrong among coaches who voted
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="divide-y divide-[var(--border)]">
          {leaderboard.map((row, index) => {
            return (
              <Link
                key={row.userId}
                href={`/coach/profiles/${row.userId}`}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-[var(--muted)]/70 ${
                  row.isMine
                    ? "bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
                    : ""
                }`}
              >
                <span className="w-6 shrink-0 tabular-nums text-[var(--muted-foreground)]">
                  {ranks[index]}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {row.name}
                  {row.franchiseAbbr ? (
                    <span className="ml-1.5 font-normal text-[var(--muted-foreground)]">
                      {row.franchiseAbbr}
                    </span>
                  ) : null}
                  {row.isMine ? (
                    <span className="ml-1.5 text-xs font-semibold text-[var(--primary)]">
                      You
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {row.correct}–{row.wrong}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
