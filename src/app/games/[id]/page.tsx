import Link from "next/link";
import { notFound } from "next/navigation";
import { ForceWinScoreForm } from "@/components/forms/force-win-score-form";
import { GameBoxScoreCard } from "@/components/games/game-box-score";
import {
  GameScoreHero,
  RecapFacts,
  teamColor,
} from "@/components/games/scoreboard";
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
import { GAME_TYPE_LABELS, forceWinReasonLabel, forceWinXpBlurb } from "@/lib/constants";
import { formatLeagueDate } from "@/lib/datetime";
import { hasFinalScores } from "@/lib/game-score";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { getGameBoxScore } from "@/lib/madden/box-score";
import { prisma } from "@/lib/prisma";
import {
  formatBothSimScores,
  myOutstandingSimScore,
} from "@/lib/sim-score";
import { ScrollToHash } from "@/components/games/scroll-to-hash";
import { Badge } from "@/components/ui/badge";

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
    !game.isForceWin &&
    Boolean(user?.isActive) &&
    involved &&
    (game.status === "PENDING" || game.status === "APPROVED") &&
    ((membership?.franchiseId === game.userTeamId && game.opponentSimScore == null) ||
      (membership?.franchiseId === game.opponentTeamId &&
        game.userTeamSimScore == null));

  const mySim = membership
    ? myOutstandingSimScore(game, membership.franchiseId)
    : null;
  const mySubmittedScore =
    membership?.franchiseId === game.userTeamId
      ? game.opponentSimScore
      : membership?.franchiseId === game.opponentTeamId
        ? game.userTeamSimScore
        : null;

  const canPostForceWinScore =
    game.isForceWin &&
    !hasFinalScores(game) &&
    (game.status === "PENDING" || game.status === "APPROVED") &&
    Boolean(user?.isActive) &&
    (commissioner ||
      game.submitterId === user?.id ||
      membership?.franchiseId === game.userTeamId);

  const ratedTeam =
    membership?.franchiseId === game.opponentTeamId ? game.userTeam : game.opponentTeam;

  const scheduled = await prisma.scheduledGame.findFirst({
    where: {
      seasonId: game.seasonId,
      week: game.week,
      OR: [
        { homeTeamId: game.userTeamId, awayTeamId: game.opponentTeamId },
        { homeTeamId: game.opponentTeamId, awayTeamId: game.userTeamId },
      ],
    },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  const homeTeam = scheduled?.homeTeam ?? game.userTeam;
  const awayTeam = scheduled?.awayTeam ?? game.opponentTeam;
  const homeIsUser = homeTeam.id === game.userTeamId;
  const homeScore = hasFinalScores(game)
    ? homeIsUser
      ? game.userScore
      : game.opponentScore
    : null;
  const awayScore = hasFinalScores(game)
    ? homeIsUser
      ? game.opponentScore
      : game.userScore
    : null;

  const boxScore = await getGameBoxScore({
    week: game.week,
    userTeamId: game.userTeamId,
    opponentTeamId: game.opponentTeamId,
    userAbbr: game.userTeam.abbreviation,
    opponentAbbr: game.opponentTeam.abbreviation,
    userName: game.userTeam.name,
    opponentName: game.opponentTeam.name,
    userColor: game.userTeam.primaryColor,
    opponentColor: game.opponentTeam.primaryColor,
  });

  const orderedBox = boxScore
    ? {
        ...boxScore,
        sides: [
          boxScore.sides.find((side) => side.abbr === awayTeam.abbreviation) ??
            boxScore.sides[0],
          boxScore.sides.find((side) => side.abbr === homeTeam.abbreviation) ??
            boxScore.sides[1],
        ] as typeof boxScore.sides,
      }
    : null;

  const statusLabel =
    game.status === "APPROVED"
      ? "Final"
      : game.status === "PENDING"
        ? "Pending"
        : game.status === "VOIDED"
          ? "Voided"
          : "Rejected";

  const recapFacts = [
    { label: "Type", value: GAME_TYPE_LABELS[game.gameType] ?? game.gameType },
    {
      label: "Filed",
      value: formatLeagueDate(game.createdAt, "MMM d, yyyy"),
    },
    {
      label: "By",
      value: game.submitter.name?.trim() || "Unnamed coach",
    },
    {
      label: "XP",
      value: game.isForceWin
        ? game.forceWinReason === "GAME_CUT_OUT"
          ? "Both play XP"
          : "Winner play XP"
        : game.skipXp || game.gameType === "SIMULATED"
          ? "No XP"
          : "Play + win",
    },
  ];

  return (
    <div className="space-y-6">
      {canSubmitSim ? <ScrollToHash id="sim-score" /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/games?tab=week&season=${game.season.number}&week=${game.week}`}>
            ← Week {game.week}
          </Link>
        </Button>
        <StatusBadge status={game.status} />
      </div>

      <GameScoreHero
        week={game.week}
        seasonNumber={game.season.number}
        awayAbbr={awayTeam.abbreviation}
        awayName={awayTeam.name}
        awayColor={teamColor(awayTeam.primaryColor)}
        awayScore={awayScore}
        homeAbbr={homeTeam.abbreviation}
        homeName={homeTeam.name}
        homeColor={teamColor(homeTeam.primaryColor)}
        homeScore={homeScore}
        statusLabel={statusLabel}
        primetime={game.isPrimetime}
        forceWin={game.isForceWin}
      />

      {canSubmitSim ? (
        <Card
          id="sim-score"
          className="scroll-mt-24 border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]"
        >
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
      ) : !game.isForceWin && involved && membership && mySim?.alreadySubmitted ? (
        <Card id="sim-score" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Your Sim Score</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted-foreground)]">
            You rated {ratedTeam.abbreviation} {mySubmittedScore}/5.
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
            Recap
          </h2>
          {game.isPrimetime ? <Badge variant="elite">Primetime</Badge> : null}
          {game.isForceWin ? <Badge variant="outline">Force win</Badge> : null}
          {game.filedByCommissioner ? (
            <Badge variant="outline">Desk filed</Badge>
          ) : null}
        </div>
        <RecapFacts facts={recapFacts} />
        <div className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 text-sm">
          {game.isForceWin ? (
            <p className="rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3">
              {forceWinXpBlurb(
                game.forceWinReason,
                game.userTeam.abbreviation,
                game.opponentTeam.abbreviation
              )}
              {forceWinReasonLabel(game.forceWinReason)
                ? ` ${forceWinReasonLabel(game.forceWinReason)}.`
                : ""}{" "}
              The CPU score, once posted, counts in standings only — no win bonus
              and no Sim Score.
            </p>
          ) : (
            <p className="text-[var(--muted-foreground)]">
              {formatBothSimScores(game)}
            </p>
          )}
          {game.filedByCommissioner ? (
            <p className="rounded-2xl border border-[var(--border)] bg-black/20 px-4 py-3">
              {game.notes?.includes("Madden Companion")
                ? "Posted from the Madden Companion export so the board did not wait on a coach submission."
                : "Commissioner filed this result."}{" "}
              It counts for standings and Coaching Reputation.
              {game.skipXp
                ? " Coaches did not earn XP."
                : " Coaches earned XP as if they had submitted."}
            </p>
          ) : null}
          {game.notes ? (
            <p className="text-[var(--muted-foreground)]">Notes: {game.notes}</p>
          ) : null}
        </div>
      </section>

      <GameBoxScoreCard box={orderedBox} />

      {canPostForceWinScore ? (
        <Card className="border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]">
          <CardHeader>
            <CardTitle>Post simulated score</CardTitle>
            <CardDescription>
              After the week advances, the Companion export fills in the CPU
              score. You can still enter it here if needed.{" "}
              {game.userTeam.abbreviation} must be ahead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForceWinScoreForm
              submissionId={game.id}
              userAbbr={game.userTeam.abbreviation}
              opponentAbbr={game.opponentTeam.abbreviation}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
