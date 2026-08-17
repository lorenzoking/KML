import Link from "next/link";
import { notFound } from "next/navigation";
import { SimScoreForm } from "@/components/forms/sim-score-form";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUser, isCommissioner } from "@/lib/auth";
import { GAME_TYPE_LABELS } from "@/lib/constants";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { prisma } from "@/lib/prisma";
import { formatBothSimScores } from "@/lib/sim-score";
import { format } from "date-fns";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, { season: activeSeason }] = await Promise.all([
    getSessionUser(),
    getActiveSeason(),
  ]);
  const commissioner = user ? await isCommissioner(user) : false;
  const membership = user
    ? await getUserMembership(user.id, activeSeason.id)
    : null;

  const game = await prisma.gameSubmission.findUnique({
    where: { id },
    include: {
      userTeam: true,
      opponentTeam: true,
      submitter: true,
      season: true,
      result: true,
    },
  });

  if (!game) notFound();

  const involved =
    Boolean(membership) &&
    (membership?.franchiseId === game.userTeamId ||
      membership?.franchiseId === game.opponentTeamId);
  const canView =
    game.status === "APPROVED" ||
    game.status === "VOIDED" ||
    commissioner ||
    game.submitterId === user?.id ||
    involved;

  if (!canView) notFound();

  const canSubmitSim =
    Boolean(user?.isActive) &&
    involved &&
    membership?.franchiseId === game.opponentTeamId &&
    (game.status === "PENDING" || game.status === "APPROVED") &&
    game.userTeamSimScore == null;

  const ratedTeam =
    membership?.franchiseId === game.opponentTeamId ? game.userTeam : game.opponentTeam;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Season {game.season.number} · Week {game.week}
          </p>
          <h1 className="mt-1 text-2xl font-semibold uppercase tracking-[0.04em] sm:text-3xl">
            {game.userTeam.abbreviation} {game.userScore}–{game.opponentScore}{" "}
            {game.opponentTeam.abbreviation}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {game.userTeam.name} vs {game.opponentTeam.name}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/games?tab=week&season=${game.season.number}&week=${game.week}`}>
            Back to week
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Game recap</CardTitle>
            <StatusBadge status={game.status} />
          </div>
          <CardDescription>
            {GAME_TYPE_LABELS[game.gameType]}
            {game.isPrimetime ? " · Primetime" : ""}
            {game.gameType === "SIMULATED" ? " · no XP" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Submitted by {game.submitter.name?.trim() || "Unnamed coach"} ·{" "}
            {format(game.createdAt, "MMM d, yyyy")}
          </p>
          <p className="text-[var(--muted-foreground)]">
            {formatBothSimScores(game)}
          </p>
          {game.notes ? (
            <p className="text-[var(--muted-foreground)]">Notes: {game.notes}</p>
          ) : null}
        </CardContent>
      </Card>

      {canSubmitSim ? (
        <Card className="border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]">
          <CardHeader>
            <CardTitle>Submit opponent Sim Score</CardTitle>
            <CardDescription>
              Rate {ratedTeam.name}. This does not change the final score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimScoreForm
              submissionId={game.id}
              opponentName={ratedTeam.name}
              opponentAbbr={ratedTeam.abbreviation}
            />
          </CardContent>
        </Card>
      ) : involved && membership?.franchiseId === game.opponentTeamId && game.userTeamSimScore != null ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Sim Score</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted-foreground)]">
            You rated {game.userTeam.abbreviation} {game.userTeamSimScore}/5.
          </CardContent>
        </Card>
      ) : involved && membership?.franchiseId === game.userTeamId ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Sim Score</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted-foreground)]">
            You rated {game.opponentTeam.abbreviation} {game.opponentSimScore}/5 with
            the result. Waiting on {game.opponentTeam.abbreviation}
            {game.userTeamSimScore == null
              ? " to submit yours."
              : ` — they rated you ${game.userTeamSimScore}/5.`}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
