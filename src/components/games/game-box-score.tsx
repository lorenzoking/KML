import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamMark, teamColor } from "@/components/games/scoreboard";
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
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Companion tape
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide sm:text-3xl">
          Box score
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
          Weekly lines from the Madden Companion export. The board score is
          official; these stats attach when player and team stats are exported
          for the week.
        </p>
      </div>

      {box?.maddenScore ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Companion score{" "}
          <span className="font-[family-name:var(--font-display)] text-lg uppercase tracking-wide text-[var(--foreground)]">
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
        <div className="grid gap-4 lg:grid-cols-2">
          {box.sides.map((side) => (
            <TeamBox key={side.abbr} side={side} />
          ))}
        </div>
      )}
    </section>
  );
}

function TeamBox({ side }: { side: BoxScoreSide }) {
  const hex = teamColor(side.color);
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)]">
      <div
        className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${hex} 34%, transparent), transparent 70%)`,
        }}
      >
        <TeamMark abbr={side.abbr} color={side.color} />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            {side.name}
          </p>
          <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
            <Link
              href={`/league/teams/${side.abbr}`}
              className="hover:text-[var(--primary)]"
            >
              {side.abbr}
            </Link>
          </h3>
        </div>
        <div
          className="ml-auto h-1 w-12 rounded-full"
          style={{ background: hex }}
        />
      </div>

      <div className="space-y-5 p-4">
        {side.totals ? (
          <dl className="stagger grid grid-cols-3 gap-2">
            <StatChip label="Pass yds" value={formatStat(side.totals.offPassYds)} />
            <StatChip label="Rush yds" value={formatStat(side.totals.offRushYds)} />
            <StatChip label="Pass TD" value={formatStat(side.totals.offPassTDs)} />
            <StatChip label="Rush TD" value={formatStat(side.totals.offRushTDs)} />
            <StatChip label="Def yds" value={formatStat(side.totals.defTotalYds)} />
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
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-black/20 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums text-[var(--primary)]">
        {value}
      </dd>
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
      <p className="mb-2 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
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
