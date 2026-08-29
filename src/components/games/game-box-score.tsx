import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  hasBoxScoreLines,
  type BoxScoreLine,
  type BoxScoreSide,
  type GameBoxScore,
} from "@/lib/madden/box-score";
import { formatSacks, formatStat } from "@/lib/madden/display";

export function GameBoxScoreCard({ box }: { box: GameBoxScore | null }) {
  const hasLines = Boolean(
    box && (hasBoxScoreLines(box.sides[0]) || hasBoxScoreLines(box.sides[1]))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Box score</CardTitle>
        <CardDescription>
          Weekly lines from the Madden Companion export. The board score is
          official; these stats attach when player and team stats are exported
          for the week.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {box?.maddenScore ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Companion score{" "}
            <span className="font-medium text-[var(--foreground)]">
              {box.maddenScore.awayAbbr} {box.maddenScore.awayScore}–
              {box.maddenScore.homeScore} {box.maddenScore.homeAbbr}
            </span>
          </p>
        ) : null}
        {!box || !hasLines ? (
          <EmptyState
            title="Stats have not landed yet"
            description="Export weekly player stats from the Companion App after this game is played. The score still posts from the board."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {box.sides.map((side) => (
              <TeamBox key={side.abbr} side={side} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamBox({ side }: { side: BoxScoreSide }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-wide">
          <Link
            href={`/league/teams/${side.abbr}`}
            className="hover:text-[var(--primary)]"
          >
            {side.abbr}
          </Link>
          <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
            {side.name}
          </span>
        </h2>
      </div>
      {side.totals ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
          <StatChip label="Pass yds" value={formatStat(side.totals.offPassYds)} />
          <StatChip label="Rush yds" value={formatStat(side.totals.offRushYds)} />
          <StatChip
            label="Pass TD"
            value={formatStat(side.totals.offPassTDs)}
          />
          <StatChip
            label="Rush TD"
            value={formatStat(side.totals.offRushTDs)}
          />
          <StatChip
            label="Def yds"
            value={formatStat(side.totals.defTotalYds)}
          />
          <StatChip label="Sacks" value={formatSacks(side.totals.defSacks)} />
        </dl>
      ) : null}
      <StatTable
        title="Passing"
        headers={["Player", "C/Att", "Yds", "TD", "INT", "Rt"]}
        rows={side.passing.map((row) => [
          playerCell(row),
          `${row.passComp}/${row.passAtt}`,
          formatStat(row.passYds),
          formatStat(row.passTDs),
          formatStat(row.passInts),
          row.passerRating.toFixed(1),
        ])}
      />
      <StatTable
        title="Rushing"
        headers={["Player", "Att", "Yds", "TD"]}
        rows={side.rushing.map((row) => [
          playerCell(row),
          formatStat(row.rushAtt),
          formatStat(row.rushYds),
          formatStat(row.rushTDs),
        ])}
      />
      <StatTable
        title="Receiving"
        headers={["Player", "Rec", "Yds", "TD"]}
        rows={side.receiving.map((row) => [
          playerCell(row),
          formatStat(row.recCatches),
          formatStat(row.recYds),
          formatStat(row.recTDs),
        ])}
      />
      <StatTable
        title="Defense"
        headers={["Player", "Tkl", "Sacks", "INT"]}
        rows={side.defense.map((row) => [
          playerCell(row),
          formatStat(row.defTackles),
          formatSacks(row.defSacks),
          formatStat(row.defInts),
        ])}
      />
      <StatTable
        title="Kicking"
        headers={["Player", "Pts"]}
        rows={side.kicking.map((row) => [
          playerCell(row),
          formatStat(row.kickPts),
        ])}
      />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-[var(--border)] py-1">
      <dt className="uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd className="tabular-nums font-medium">{value}</dd>
    </div>
  );
}

function playerCell(row: BoxScoreLine) {
  const who = row.jerseyNum ? `#${row.jerseyNum} ${row.name}` : row.name;
  return row.position ? `${who} · ${row.position}` : who;
}

function StatTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {title}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead
                key={header}
                className={index === 0 ? undefined : "text-right"}
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${title}-${index}`}>
              {row.map((cell, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  className={
                    cellIndex === 0
                      ? "font-medium"
                      : "text-right tabular-nums"
                  }
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
