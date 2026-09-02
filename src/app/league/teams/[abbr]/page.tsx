import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeagueNav } from "@/components/league/league-nav";
import {
  devTraitLabel,
  displayWeek,
  formatRecord,
  formatSalary,
  isRunningBack,
  playerName,
  POSITION_GROUP_ORDER,
  positionGroup,
  rosterSeasonLine,
  sumPlayerStats,
  type PlayerStatSums,
} from "@/lib/madden/display";
import {
  ensureMaddenLeague,
  getMaddenTeam,
  latestStatWeek,
} from "@/lib/madden/query";
import { buildShareMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ abbr: string }>;
}): Promise<Metadata> {
  const { abbr } = await params;
  return buildShareMetadata({
    title: `${abbr.toUpperCase()} roster`,
    path: `/league/teams/${abbr}`,
  });
}

type RosterPlayer = Awaited<
  ReturnType<typeof getMaddenTeam>
> extends infer Team
  ? Team extends { players: infer Players }
    ? Players extends Array<infer Player>
      ? Player
      : never
    : never
  : never;

export default async function LeagueTeamPage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  await ensureMaddenLeague();
  const { abbr } = await params;
  const team = await getMaddenTeam(abbr);
  if (!team) notFound();
  const weekIndex = await latestStatWeek();
  const coach =
    team.franchise?.memberships[0]?.user.name || team.userName || "CPU";

  const withStats = team.players.map((player) => ({
    player,
    stats: sumPlayerStats(player.stats),
  }));
  const byId = new Map(withStats.map((row) => [row.player.rosterId, row.stats]));

  const groups = POSITION_GROUP_ORDER.map((label) => ({
    label,
    players: team.players.filter((player) => positionGroup(player.position) === label),
  })).filter((group) => group.players.length > 0);

  const passing = topBy(withStats, (row) => row.stats.passAtt >= 8, (row) => row.stats.passYds);
  const rushing = topBy(
    withStats,
    (row) => {
      const pos = row.player.position.toUpperCase();
      return row.stats.rushYds >= 25 && (isRunningBack(pos) || pos === "QB");
    },
    (row) => row.stats.rushYds
  );
  const receiving = topBy(
    withStats,
    (row) => row.stats.recCatches > 0,
    (row) => row.stats.recYds
  );
  const defense = topBy(
    withStats,
    (row) => row.stats.defSacks > 0 || row.stats.defInts > 0 || row.stats.defTackles > 0,
    (row) => row.stats.defSacks * 12 + row.stats.defInts * 12 + row.stats.defTackles * 0.4
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          {team.conference} {team.division}
        </p>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.04em]">
          {team.abbr} {team.displayName}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Coach {coach} · {formatRecord(team.wins, team.losses, team.ties)} ·{" "}
          {team.ovr} OVR · {team.players.length} players
          {weekIndex != null ? ` · season through Week ${displayWeek(weekIndex)}` : ""}
        </p>
      </div>
      <LeagueNav active="rosters" />

      {weekIndex != null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <LeaderCard
            title="Passing"
            rows={passing.map((row) => ({
              name: playerName(row.player),
              line: rosterSeasonLine("QB", row.stats),
            }))}
          />
          <LeaderCard
            title="Rushing"
            rows={rushing.map((row) => ({
              name: playerName(row.player),
              line: rosterSeasonLine(row.player.position, row.stats),
            }))}
          />
          <LeaderCard
            title="Receiving"
            rows={receiving.map((row) => ({
              name: playerName(row.player),
              line: rosterSeasonLine(row.player.position, row.stats),
            }))}
          />
          <LeaderCard
            title="Defense"
            rows={defense.map((row) => ({
              name: playerName(row.player),
              line: rosterSeasonLine(row.player.position, row.stats),
            }))}
          />
        </div>
      ) : null}

      {groups.map((group) => (
        <Card key={group.label}>
          <CardHeader>
            <CardTitle>{group.label}</CardTitle>
            <CardDescription>
              {group.players.length} players
              {weekIndex != null ? " · season totals on each row" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Pos</TableHead>
                  <TableHead>OVR</TableHead>
                  <TableHead className="min-w-[14rem]">Season</TableHead>
                  <TableHead className="hidden md:table-cell">Age</TableHead>
                  <TableHead className="hidden lg:table-cell">Dev</TableHead>
                  <TableHead className="hidden lg:table-cell">Cap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.players.map((player) => {
                  const stats = byId.get(player.rosterId);
                  const line = stats ? rosterSeasonLine(player.position, stats) : "—";
                  const hasLine = line !== "—";
                  return (
                    <TableRow key={player.id}>
                      <TableCell className="tabular-nums">
                        {player.jerseyNum || "—"}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {playerName(player)}
                          {player.isOnIR ? (
                            <Badge variant="hotseat" className="ml-2">
                              IR
                            </Badge>
                          ) : null}
                        </p>
                      </TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell className="tabular-nums">{player.overall}</TableCell>
                      <TableCell
                        className={cn(
                          "text-xs leading-snug sm:text-sm",
                          hasLine
                            ? "text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)]"
                        )}
                      >
                        {line}
                      </TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">
                        {player.age}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {devTraitLabel(player.devTrait) || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatSalary(player.contractSalary)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function topBy(
  rows: Array<{ player: RosterPlayer; stats: PlayerStatSums }>,
  eligible: (row: { player: RosterPlayer; stats: PlayerStatSums }) => boolean,
  metric: (row: { player: RosterPlayer; stats: PlayerStatSums }) => number,
  take = 5
) {
  return rows
    .filter(eligible)
    .sort((a, b) => metric(b) - metric(a))
    .slice(0, take);
}

function LeaderCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ name: string; line: string }>;
}) {
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Season leaders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${title}-${row.name}`} className="flex items-baseline justify-between gap-3 text-sm">
            <p className="min-w-0 truncate">
              <span className="text-[var(--muted-foreground)]">{index + 1}.</span>{" "}
              <span className="font-medium">{row.name}</span>
            </p>
            <p className="max-w-[65%] text-right text-xs leading-snug text-[var(--muted-foreground)]">
              {row.line}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
