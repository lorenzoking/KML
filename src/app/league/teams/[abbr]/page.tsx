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
  formatHeight,
  formatRecord,
  formatSalary,
  playerName,
  POSITION_GROUP_ORDER,
  positionGroup,
} from "@/lib/madden/display";
import {
  ensureMaddenLeague,
  getMaddenTeam,
  getTeamWeekStats,
  latestStatWeek,
} from "@/lib/madden/query";
import { buildShareMetadata } from "@/lib/site";

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
  const weekStats =
    weekIndex == null ? [] : await getTeamWeekStats(team.maddenTeamId, weekIndex);
  const coach =
    team.franchise?.memberships[0]?.user.name || team.userName || "CPU";

  const groups = POSITION_GROUP_ORDER.map((label) => ({
    label,
    players: team.players.filter((player) => positionGroup(player.position) === label),
  })).filter((group) => group.players.length > 0);

  const passing = weekStats.filter((row) => row.category === "PASSING" && row.passAtt > 0);
  const rushing = weekStats.filter((row) => row.category === "RUSHING" && row.rushYds > 0);
  const receiving = weekStats.filter(
    (row) => row.category === "RECEIVING" && row.recCatches > 0
  );
  const defense = weekStats.filter(
    (row) =>
      row.category === "DEFENSE" &&
      (row.defSacks > 0 || row.defInts > 0 || row.defTackles > 0)
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
        </p>
      </div>
      <LeagueNav active="rosters" />

      {weekIndex != null ? (
        <Card>
          <CardHeader>
            <CardTitle>Week {displayWeek(weekIndex)} lines</CardTitle>
            <CardDescription>
              Player stats from the latest weekly export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MiniStat
              title="Passing"
              rows={passing.map(
                (row) =>
                  `${row.fullName || playerName(row.player)} — ${row.passYds} yds, ${row.passTDs} TD, ${row.passInts} INT`
              )}
            />
            <MiniStat
              title="Rushing"
              rows={rushing.map(
                (row) =>
                  `${row.fullName || playerName(row.player)} — ${row.rushYds} yds, ${row.rushTDs} TD`
              )}
            />
            <MiniStat
              title="Receiving"
              rows={receiving.map(
                (row) =>
                  `${row.fullName || playerName(row.player)} — ${row.recCatches} rec, ${row.recYds} yds, ${row.recTDs} TD`
              )}
            />
            <MiniStat
              title="Defense"
              rows={defense.map(
                (row) =>
                  `${row.fullName || playerName(row.player)} — ${row.defSacks} sacks, ${row.defInts} INT, ${row.defTackles} tkl`
              )}
            />
          </CardContent>
        </Card>
      ) : null}

      {groups.map((group) => (
        <Card key={group.label}>
          <CardHeader>
            <CardTitle>{group.label}</CardTitle>
            <CardDescription>{group.players.length} players</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Pos</TableHead>
                  <TableHead>OVR</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Ht/Wt</TableHead>
                  <TableHead>Dev</TableHead>
                  <TableHead>Cap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>{player.jerseyNum || "—"}</TableCell>
                    <TableCell className="font-medium">
                      {playerName(player)}
                      {player.isOnIR ? (
                        <Badge variant="hotseat" className="ml-2">
                          IR
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell>{player.overall}</TableCell>
                    <TableCell>{player.age}</TableCell>
                    <TableCell>
                      {formatHeight(player.height)} / {player.weight || "—"}
                    </TableCell>
                    <TableCell>{devTraitLabel(player.devTrait) || "—"}</TableCell>
                    <TableCell>{formatSalary(player.contractSalary)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MiniStat({ title, rows }: { title: string; rows: string[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        {title}
      </p>
      <ul className="space-y-1 text-sm">
        {rows.slice(0, 8).map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  );
}
