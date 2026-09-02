import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, CalendarDays, Radio, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isLightHex } from "@/lib/madden/display";
import type { WeekSlateRow } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export function teamColor(color?: string | null) {
  return color && color.trim() ? color : "#1a1a1a";
}

export function TeamMark({
  abbr,
  color,
  size = "md",
}: {
  abbr: string;
  color?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const hex = teamColor(color);
  const light = isLightHex(hex);
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]",
        size === "lg" && "size-16 sm:size-20",
        size === "md" && "size-11 sm:size-12",
        size === "sm" && "size-9"
      )}
      style={{ background: hex }}
      title={abbr}
    >
      <span
        className={cn(
          "font-[family-name:var(--font-display)] font-bold leading-none tracking-tight",
          size === "lg" && "text-lg sm:text-xl",
          size === "md" && "text-xs sm:text-sm",
          size === "sm" && "text-[10px]",
          light ? "text-black/90" : "text-white"
        )}
      >
        {abbr}
      </span>
    </div>
  );
}

export function GamesLiveStrip({ label }: { label: string }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
      <span className="inline-flex size-1.5 animate-pulse rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
      {label}
    </p>
  );
}

export function GamesHero({
  week,
  seasonNumber,
  isCurrentWeek,
  finals,
  open,
  primetime,
  liveLabel,
}: {
  week: number;
  seasonNumber: number;
  isCurrentWeek: boolean;
  finals: number;
  open: number;
  primetime: number;
  liveLabel: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] field-stripe">
      <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_8%_-10%,rgba(212,175,55,0.28),transparent_55%),linear-gradient(135deg,#050505_0%,#121212_48%,#050505_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_18%,rgba(212,175,55,0.16),transparent_40%)]" />
      <div className="pointer-events-none absolute -right-4 top-0 font-[family-name:var(--font-display)] text-[8rem] font-bold leading-none text-white/5 sm:text-[11rem]">
        {week}
      </div>
      <div className="relative space-y-6 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="elite" className="gap-1.5 px-2.5 py-1">
            <span className="inline-flex size-1.5 animate-pulse rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
            {isCurrentWeek ? "Live week" : `Season ${seasonNumber}`}
          </Badge>
          {primetime > 0 ? (
            <Badge variant="outline" className="border-white/20 bg-black/30 text-white">
              {primetime} Primetime
            </Badge>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            Season {seasonNumber} · the board
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl font-semibold uppercase leading-[0.85] tracking-[0.04em] text-white sm:text-7xl">
            Week {week}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            {liveLabel} Scores and XP land from Companion. Coaches still drop
            Sim Scores.
          </p>
        </div>
        <div className="stagger grid grid-cols-3 gap-2 sm:max-w-lg">
          <PulseTile icon={Trophy} label="Final" value={String(finals)} />
          <PulseTile icon={Activity} label="Open" value={String(open)} />
          <PulseTile icon={Zap} label="Primetime" value={String(primetime)} />
        </div>
      </div>
    </section>
  );
}

export function BoardHero({
  kicker,
  title,
  subtitle,
  color,
  watermark,
  tiles,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  color?: string | null;
  watermark?: string;
  tiles?: { label: string; value: string }[];
}) {
  const hex = teamColor(color);
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] field-stripe">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(900px 420px at 12% 0%, color-mix(in srgb, ${hex} 42%, transparent), transparent 58%), linear-gradient(135deg, #050505 0%, color-mix(in srgb, ${hex} 18%, #0a0a0a) 46%, #050505 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_20%,rgba(212,175,55,0.18),transparent_42%)]" />
      {watermark ? (
        <div className="pointer-events-none absolute -right-2 top-0 font-[family-name:var(--font-display)] text-[7rem] font-bold leading-none text-white/5 sm:text-[10rem]">
          {watermark}
        </div>
      ) : null}
      <div className="relative space-y-5 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
          {kicker}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold uppercase leading-[0.9] tracking-[0.04em] text-white sm:text-6xl">
          {title}
        </h1>
        <p className="max-w-xl text-sm text-white/70">{subtitle}</p>
        {tiles && tiles.length > 0 ? (
          <div className="stagger grid grid-cols-2 gap-2 sm:max-w-md sm:grid-cols-3">
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3 backdrop-blur-sm"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  {tile.label}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--primary)] sm:text-3xl">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PulseTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-3 backdrop-blur-sm">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
        <Icon className="size-3" />
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--primary)]">
        {value}
      </p>
    </div>
  );
}

export function MatchupCard({
  row,
  myTeamId,
  footer,
}: {
  row: WeekSlateRow;
  myTeamId?: string;
  footer?: ReactNode;
}) {
  const mine = myTeamId === row.home.id || myTeamId === row.away.id;
  const scored = row.homeScore != null && row.awayScore != null;
  const awayWon = scored && row.awayScore! > row.homeScore!;
  const homeWon = scored && row.homeScore! > row.awayScore!;
  const statusLabel =
    row.status === "approved"
      ? "Final"
      : row.status === "pending"
        ? "Pending"
        : row.isForceWin
          ? "Force win"
          : "Upcoming";

  const body = (
    <div className="relative space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {row.isPrimetime ? (
            <Badge variant="elite" className="gap-1">
              <Radio className="size-3" />
              Primetime
            </Badge>
          ) : null}
          <Badge
            variant={
              row.status === "approved"
                ? "approved"
                : row.status === "pending"
                  ? "pending"
                  : "outline"
            }
          >
            {statusLabel}
          </Badge>
          {row.isForceWin ? <Badge variant="outline">Force win</Badge> : null}
        </div>
        {mine ? <Badge variant="elite">You</Badge> : null}
      </div>

      <ScoreLine
        abbr={row.away.abbreviation}
        name={row.away.name}
        color={row.away.primaryColor}
        score={row.awayScore}
        won={awayWon}
        scored={scored}
        side="Away"
      />
      <ScoreLine
        abbr={row.home.abbreviation}
        name={row.home.name}
        color={row.home.primaryColor}
        score={row.homeScore}
        won={homeWon}
        scored={scored}
        side="Home"
      />

      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {row.submissionId ? "Recap & box score" : "Waiting on Companion"}
      </p>
    </div>
  );

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-[var(--surface-raised)] surface-hover",
        row.isPrimetime
          ? "border-[color-mix(in_srgb,var(--primary)_45%,var(--border))]"
          : "border-[var(--border)]",
        mine && "ring-1 ring-[color-mix(in_srgb,var(--primary)_55%,transparent)]",
        row.status === "missing" && "border-dashed"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${teamColor(row.away.primaryColor)} 22%, transparent) 0%, transparent 42%, color-mix(in srgb, ${teamColor(row.home.primaryColor)} 22%, transparent) 100%)`,
        }}
      />
      {row.submissionId ? (
        <Link href={`/games/${row.submissionId}`} className="relative block">
          {body}
        </Link>
      ) : (
        <div className="relative">{body}</div>
      )}
      {footer ? (
        <div className="relative border-t border-white/10 bg-black/25 px-4 py-3">
          {footer}
        </div>
      ) : null}
    </article>
  );
}

function ScoreLine({
  abbr,
  name,
  color,
  score,
  won,
  scored,
  side,
}: {
  abbr: string;
  name: string;
  color?: string;
  score: number | null;
  won: boolean;
  scored: boolean;
  side: "Away" | "Home";
}) {
  const dim = scored && !won;
  return (
    <div className={cn("flex items-center gap-3", dim && "opacity-60")}>
      <TeamMark abbr={abbr} color={color} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          {side}
        </p>
        <p
          className={cn(
            "truncate font-[family-name:var(--font-display)] text-xl uppercase tracking-wide sm:text-2xl",
            won ? "text-[var(--primary)]" : "text-[var(--foreground)]"
          )}
        >
          {abbr}
        </p>
        <p className="truncate text-xs text-[var(--muted-foreground)]">{name}</p>
      </div>
      <p
        className={cn(
          "font-[family-name:var(--font-display)] text-3xl tabular-nums sm:text-4xl",
          score == null
            ? "text-[var(--muted-foreground)]"
            : won
              ? "text-[var(--primary)]"
              : "text-[var(--foreground)]"
        )}
      >
        {score ?? "–"}
      </p>
    </div>
  );
}

export function GameScoreHero({
  week,
  seasonNumber,
  awayAbbr,
  awayName,
  awayColor,
  awayScore,
  homeAbbr,
  homeName,
  homeColor,
  homeScore,
  statusLabel,
  primetime,
  forceWin,
}: {
  week: number;
  seasonNumber: number;
  awayAbbr: string;
  awayName: string;
  awayColor: string;
  awayScore: number | null;
  homeAbbr: string;
  homeName: string;
  homeColor: string;
  homeScore: number | null;
  statusLabel: string;
  primetime?: boolean;
  forceWin?: boolean;
}) {
  const scored = awayScore != null && homeScore != null;
  const awayWon = scored && awayScore > homeScore;
  const homeWon = scored && homeScore > awayScore;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] field-stripe">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(120deg, color-mix(in srgb, ${awayColor} 38%, #050505) 0%, #0a0a0a 48%, color-mix(in srgb, ${homeColor} 38%, #050505) 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.16),transparent_46%)]" />
      <div className="relative space-y-6 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="elite" className="gap-1.5">
            <CalendarDays className="size-3.5" />
            Week {week}
          </Badge>
          <Badge variant="outline" className="border-white/20 bg-black/30 text-white">
            Season {seasonNumber} · {statusLabel}
          </Badge>
          {primetime ? <Badge variant="elite">Primetime</Badge> : null}
          {forceWin ? (
            <Badge variant="outline" className="border-white/20 bg-black/30 text-white">
              Force win
            </Badge>
          ) : null}
        </div>

        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <HeroTeam
            abbr={awayAbbr}
            name={awayName}
            color={awayColor}
            score={awayScore}
            won={awayWon}
            scored={scored}
            align="left"
          />
          <p className="text-center font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] text-white/45 md:text-base">
            {scored ? "Final" : "vs"}
          </p>
          <HeroTeam
            abbr={homeAbbr}
            name={homeName}
            color={homeColor}
            score={homeScore}
            won={homeWon}
            scored={scored}
            align="right"
          />
        </div>
      </div>
    </section>
  );
}

function HeroTeam({
  abbr,
  name,
  color,
  score,
  won,
  scored,
  align,
}: {
  abbr: string;
  name: string;
  color: string;
  score: number | null;
  won: boolean;
  scored: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4",
        scored && !won && "opacity-70",
        align === "right" && "md:flex-row-reverse md:text-right"
      )}
    >
      <TeamMark abbr={abbr} color={color} size="lg" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {name}
        </p>
        <p
          className={cn(
            "font-[family-name:var(--font-display)] text-4xl uppercase leading-none sm:text-5xl",
            won ? "text-[var(--primary)]" : "text-white"
          )}
        >
          {abbr}
        </p>
      </div>
      <p
        className={cn(
          "ml-auto font-[family-name:var(--font-display)] text-5xl tabular-nums sm:text-7xl",
          score == null ? "text-white/35" : won ? "text-[var(--primary)]" : "text-white"
        )}
      >
        {score ?? "–"}
      </p>
    </div>
  );
}

export function RecapFacts({
  facts,
}: {
  facts: { label: string; value: string }[];
}) {
  if (facts.length === 0) return null;
  return (
    <div className="stagger grid grid-cols-2 gap-2 sm:grid-cols-4">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            {fact.label}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg uppercase tracking-wide">
            {fact.value}
          </p>
        </div>
      ))}
    </div>
  );
}
