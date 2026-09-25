import Link from "next/link";
import { Trophy } from "lucide-react";
import { TeamMark } from "@/components/games/scoreboard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatSeedRecord,
  type BracketSlot,
  type ConferenceBracket,
  type PlayoffBracket,
  type PlayoffField,
  type PlayoffSeed,
} from "@/lib/playoffs";

export function PlayoffBracketView({
  bracket,
  field,
  projected,
  currentRoundLabel,
}: {
  bracket: PlayoffBracket;
  field: PlayoffField;
  projected: boolean;
  currentRoundLabel: string;
}) {
  return (
    <div className="space-y-6">
      {projected ? (
        <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Projected field from the regular-season standings. Wild Card locks
          in when the league advances past Week 18.
        </p>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          Current round:{" "}
          <span className="font-semibold text-[var(--primary)]">
            {currentRoundLabel}
          </span>
          . Higher seed hosts through the conference title. Super Bowl is a
          neutral site.
        </p>
      )}

      <div className="hidden gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_16rem_minmax(0,1fr)] xl:items-center">
        <ConferenceLadder column={bracket.afc} align="left" />
        <SuperBowlCard slot={bracket.superBowl} />
        <ConferenceLadder column={bracket.nfc} align="right" />
      </div>

      <div className="space-y-8 xl:hidden">
        <ConferenceLadder column={bracket.afc} align="left" stacked />
        <SuperBowlCard slot={bracket.superBowl} />
        <ConferenceLadder column={bracket.nfc} align="left" stacked />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SeedList conference="AFC" seeds={field.afc} />
        <SeedList conference="NFC" seeds={field.nfc} />
      </div>
    </div>
  );
}

function ConferenceLadder({
  column,
  align,
  stacked = false,
}: {
  column: ConferenceBracket;
  align: "left" | "right";
  stacked?: boolean;
}) {
  const rtl = align === "right" && !stacked;
  return (
    <section className="space-y-3">
      <div className={cn("flex items-center gap-2", rtl && "flex-row-reverse")}>
        <p className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.16em] text-[var(--primary)]">
          {column.conference}
        </p>
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {column.bye
            ? `1-seed bye · ${column.bye.abbreviation}`
            : "Waiting on seeds"}
        </span>
      </div>
      <div
        className={cn(
          "grid gap-2 sm:gap-3",
          stacked
            ? "grid-cols-1"
            : rtl
              ? "grid-cols-[1fr_12px_1fr_12px_1fr]"
              : "grid-cols-[1fr_12px_1fr_12px_1fr]"
        )}
      >
        {stacked ? (
          <>
            <RoundColumn
              title="Wild Card"
              slots={[byeSlot(column), ...column.wildCard]}
            />
            <RoundColumn title="Divisional" slots={column.divisional} />
            <RoundColumn title="Conference" slots={[column.championship]} />
          </>
        ) : rtl ? (
          <>
            <RoundColumn title="Conference" slots={[column.championship]} tall />
            <Rail />
            <RoundColumn title="Divisional" slots={column.divisional} tall />
            <Rail />
            <RoundColumn
              title="Wild Card"
              slots={[byeSlot(column), ...column.wildCard]}
            />
          </>
        ) : (
          <>
            <RoundColumn
              title="Wild Card"
              slots={[byeSlot(column), ...column.wildCard]}
            />
            <Rail />
            <RoundColumn title="Divisional" slots={column.divisional} tall />
            <Rail />
            <RoundColumn title="Conference" slots={[column.championship]} tall />
          </>
        )}
      </div>
    </section>
  );
}

function byeSlot(column: ConferenceBracket): BracketSlot {
  return {
    id: `${column.conference.toLowerCase()}-bye`,
    week: 19,
    round: "wildcard",
    conference: column.conference,
    label: "1-seed bye",
    home: column.bye,
    away: null,
    homeScore: null,
    awayScore: null,
    winnerFranchiseId: column.bye?.franchiseId ?? null,
    submissionId: null,
    status: column.bye ? "scheduled" : "tbd",
  };
}

function RoundColumn({
  title,
  slots,
  tall = false,
}: {
  title: string;
  slots: BracketSlot[];
  tall?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", tall && "justify-around")}>
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {title}
      </p>
      {slots.map((slot) => (
        <MatchupCard key={slot.id} slot={slot} bye={slot.label === "1-seed bye"} />
      ))}
    </div>
  );
}

function Rail() {
  return (
    <div className="relative my-8">
      <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-[color-mix(in_srgb,var(--primary)_35%,transparent)]" />
    </div>
  );
}

function MatchupCard({ slot, bye = false }: { slot: BracketSlot; bye?: boolean }) {
  const inner = (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-[var(--surface-raised)]",
        slot.status === "final"
          ? "border-[color-mix(in_srgb,var(--primary)_55%,var(--border))]"
          : slot.status === "pending"
            ? "border-[color-mix(in_srgb,var(--primary)_40%,var(--border))]"
            : "border-[var(--border)]"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-2.5 py-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          {slot.label}
        </p>
        {slot.status === "pending" ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--primary)]">
            Live
          </span>
        ) : bye ? (
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Bye
          </span>
        ) : null}
      </div>
      {bye ? (
        <TeamRow team={slot.home} score={null} won={Boolean(slot.home)} home />
      ) : (
        <>
          <TeamRow
            team={slot.away}
            score={slot.awayScore}
            won={slot.winnerFranchiseId === slot.away?.franchiseId}
          />
          <TeamRow
            team={slot.home}
            score={slot.homeScore}
            won={slot.winnerFranchiseId === slot.home?.franchiseId}
            home
          />
        </>
      )}
    </div>
  );

  if (slot.submissionId) {
    return (
      <Link href={`/games/${slot.submissionId}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function SuperBowlCard({ slot }: { slot: BracketSlot }) {
  const inner = (
    <div className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--primary)_50%,var(--border))] bg-[var(--surface-raised)] field-stripe">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.22),transparent_55%)]" />
      <div className="relative space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-center gap-2 text-[var(--primary)]">
          <Trophy className="size-4" />
          <p className="font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.18em]">
            Super Bowl
          </p>
        </div>
        <TeamRow
          team={slot.away}
          score={slot.awayScore}
          won={slot.winnerFranchiseId === slot.away?.franchiseId}
        />
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Neutral site
        </p>
        <TeamRow
          team={slot.home}
          score={slot.homeScore}
          won={slot.winnerFranchiseId === slot.home?.franchiseId}
          home
        />
      </div>
    </div>
  );
  if (slot.submissionId) {
    return (
      <Link href={`/games/${slot.submissionId}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function TeamRow({
  team,
  score,
  won,
  home = false,
}: {
  team: PlayoffSeed | null;
  score: number | null;
  won: boolean;
  home?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-2",
        home && "border-t border-[var(--border)]",
        team && won && "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]",
        team && !won && score != null && "opacity-60"
      )}
    >
      {team ? (
        <TeamMark abbr={team.abbreviation} color={team.primaryColor} size="sm" />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
          TBD
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-[family-name:var(--font-display)] text-sm uppercase tracking-wide">
          {team ? (
            <>
              <span className="mr-1 text-[var(--primary)]">{team.seed}</span>
              {team.abbreviation}
            </>
          ) : (
            "TBD"
          )}
        </p>
        <p className="truncate text-[10px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
          {team ? formatSeedRecord(team) : "Awaiting winner"}
        </p>
      </div>
      {score != null ? (
        <span
          className={cn(
            "font-[family-name:var(--font-display)] text-lg tabular-nums",
            won ? "text-[var(--primary)]" : "text-[var(--foreground)]"
          )}
        >
          {score}
        </span>
      ) : null}
    </div>
  );
}

function SeedList({
  conference,
  seeds,
}: {
  conference: "AFC" | "NFC";
  seeds: PlayoffSeed[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3">
      <p className="mb-2 font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-[var(--primary)]">
        {conference} seeds
      </p>
      {seeds.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Standings will fill the {conference} field.
        </p>
      ) : (
        <ol className="space-y-1">
          {seeds.map((seed) => (
            <li
              key={seed.franchiseId}
              className="flex items-center gap-2 rounded-xl px-1 py-1"
            >
              <span className="w-5 text-xs tabular-nums text-[var(--primary)]">
                {seed.seed}
              </span>
              <TeamMark
                abbr={seed.abbreviation}
                color={seed.primaryColor}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {seed.name}
              </span>
              {seed.divisionWinner ? (
                <Badge variant="outline" className="text-[10px]">
                  {seed.division}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  WC
                </Badge>
              )}
              <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                {formatSeedRecord(seed)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
