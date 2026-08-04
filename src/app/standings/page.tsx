import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  getActiveSeason,
  getSeasonStandings,
  listSeasons,
} from "@/lib/league";
import { prisma } from "@/lib/prisma";
import { sumXp } from "@/lib/xp";
import {
  computeReputationScore,
  getReputationLabel,
} from "@/lib/reputation";
import { ReputationBadge } from "@/components/status-badge";

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ conference?: string; q?: string; season?: string }>;
}) {
  const params = await searchParams;
  const { settings, season: activeSeason } = await getActiveSeason();
  const seasons = await listSeasons();
  const selectedNumber = params.season
    ? Number(params.season)
    : activeSeason.number;
  const season =
    seasons.find((s) => s.number === selectedNumber) ?? activeSeason;
  let standings = await getSeasonStandings(season.id);

  if (params.conference === "AFC" || params.conference === "NFC") {
    standings = standings.filter((s) => s.conference === params.conference);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    standings = standings.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.abbreviation.toLowerCase().includes(q)
    );
  }

  const memberships = await prisma.leagueMembership.findMany({
    where: { seasonId: season.id, isActive: true },
    include: {
      user: {
        include: {
          xpAdjustmentsReceived: {
            select: { amount: true, seasonId: true },
          },
          reputationReceived: true,
        },
      },
    },
  });

  const coachByFranchise = Object.fromEntries(
    memberships.map((m) => {
      const seasonXp = sumXp(
        m.user.xpAdjustmentsReceived.filter((x) => x.seasonId === season.id)
      );
      const score = computeReputationScore(
        settings.startingRepScore,
        m.user.reputationReceived
      );
      return [
        m.franchiseId,
        {
          name: m.user.name ?? m.user.email,
          xp: seasonXp,
          score,
          label: getReputationLabel(score),
        },
      ];
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.06em]">
          Standings
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Viewing Season {season.number}
          {season.id === activeSeason.id
            ? ` · Week ${settings.currentWeek}`
            : " · archived"}{" "}
          · Approved (non-voided) results only
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-2">
            <select
              name="season"
              defaultValue={String(season.number)}
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.number}>
                  Season {s.number}
                  {s.status === "ARCHIVED" ? " (archived)" : " (active)"}
                </option>
              ))}
            </select>
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search team"
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
            />
            <select
              name="conference"
              defaultValue={params.conference ?? ""}
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
            >
              <option value="">All conferences</option>
              <option value="AFC">AFC</option>
              <option value="NFC">NFC</option>
            </select>
            <button
              type="submit"
              className="h-10 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]"
            >
              Apply
            </button>
          </form>
        </CardContent>
      </Card>

      {standings.every((s) => s.wins + s.losses + s.ties === 0) ? (
        <EmptyState
          title="No approved games yet"
          description="Standings will populate after commissioners approve submissions."
        />
      ) : null}

      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>W</TableHead>
                <TableHead>L</TableHead>
                <TableHead>PF</TableHead>
                <TableHead>PA</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Rep</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row, idx) => {
                const coach = coachByFranchise[row.franchiseId];
                return (
                  <TableRow key={row.franchiseId}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {row.conference} {row.division}
                      </div>
                    </TableCell>
                    <TableCell>{coach?.name ?? "—"}</TableCell>
                    <TableCell>{row.wins}</TableCell>
                    <TableCell>{row.losses}</TableCell>
                    <TableCell>{row.pointsFor}</TableCell>
                    <TableCell>{row.pointsAgainst}</TableCell>
                    <TableCell>
                      {row.form ? (
                        <Badge variant="outline">{row.form}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{coach?.xp ?? 0}</TableCell>
                    <TableCell>
                      {coach ? (
                        <ReputationBadge label={coach.label} score={coach.score} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
