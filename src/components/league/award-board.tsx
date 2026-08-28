import Link from "next/link";
import { Crown, Flame, Shield, Sparkles, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isLightHex } from "@/lib/madden/display";
import type {
  AwardCandidate,
  AwardRace,
  SeasonPulse,
  WeekHeater,
} from "@/lib/madden/awards";
import { leadMargin } from "@/lib/madden/awards";
import { cn } from "@/lib/utils";

const RACE_ICON = {
  mvp: Crown,
  opoty: Zap,
  dpoty: Shield,
  roy: Sparkles,
} as const;

export function TeamPlate({
  color,
  jersey,
  abbr,
  size = "md",
}: {
  color: string;
  jersey: number;
  abbr: string;
  size?: "sm" | "md" | "lg";
}) {
  const light = isLightHex(color);
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        size === "lg" && "size-20 sm:size-24",
        size === "md" && "size-12 sm:size-14",
        size === "sm" && "size-10"
      )}
      style={{ background: color }}
      title={`${abbr} #${jersey}`}
    >
      <span
        className={cn(
          "font-[family-name:var(--font-display)] font-bold leading-none tracking-tight",
          size === "lg" && "text-4xl sm:text-5xl",
          size === "md" && "text-xl sm:text-2xl",
          size === "sm" && "text-lg",
          light ? "text-black/90" : "text-white"
        )}
      >
        {jersey}
      </span>
    </div>
  );
}

export function MvpHero({
  leader,
  phase,
  week,
  chase,
}: {
  leader: AwardCandidate;
  phase: string;
  week: number;
  chase: AwardCandidate | null;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] field-stripe">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(900px 420px at 12% 0%, color-mix(in srgb, ${leader.teamColor} 42%, transparent), transparent 58%), linear-gradient(135deg, #050505 0%, color-mix(in srgb, ${leader.teamColor} 22%, #0a0a0a) 46%, #050505 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_20%,rgba(212,175,55,0.22),transparent_42%)]" />
      <div className="pointer-events-none absolute -right-6 top-2 font-[family-name:var(--font-display)] text-[9rem] font-bold leading-none text-white/5 sm:text-[12rem]">
        {leader.jerseyNum}
      </div>

      <div className="relative grid gap-8 p-6 sm:p-8 md:grid-cols-[1.3fr_0.9fr] md:items-end lg:p-10">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="elite" className="gap-1.5 px-2.5 py-1">
              <Crown className="size-3.5" />
              {phase} MVP
            </Badge>
            <Badge variant="outline" className="border-white/20 bg-black/30 text-white">
              Through Week {week}
            </Badge>
          </div>
          <div className="flex items-start gap-4">
            <TeamPlate
              color={leader.teamColor}
              jersey={leader.jerseyNum}
              abbr={leader.teamAbbr}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                {leader.teamAbbr} · {leader.position} · {leader.record}
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.14em] text-white/80 sm:text-3xl">
                {leader.firstName}
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-5xl font-semibold uppercase leading-[0.85] tracking-[0.04em] text-white sm:text-7xl">
                {leader.lastName}
              </h2>
            </div>
          </div>
          <p className="text-lg font-medium text-white/85 sm:text-xl">
            {leader.headline}
          </p>
          {chase ? (
            <p className="text-sm text-white/60">
              Holds the desk’s early crown. {chase.name} is next in line.
            </p>
          ) : (
            <p className="text-sm text-white/60">
              First name on the board. The race is just getting loud.
            </p>
          )}
        </div>

        {chase ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Closest chase
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide text-white">
              {chase.name}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {chase.teamAbbr} · {chase.headline}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SeasonPulseRow({ rows }: { rows: SeasonPulse[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="stagger grid grid-cols-2 gap-2 lg:grid-cols-4">
      {rows.map((row) => (
        <div
          key={row.label}
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-4"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            {row.label}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--primary)] sm:text-4xl">
            {row.value}
          </p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {row.unit}
          </p>
          <p className="mt-3 truncate text-sm font-medium">
            {row.name}{" "}
            <span className="text-[var(--muted-foreground)]">{row.teamAbbr}</span>
          </p>
          <div
            className="mt-3 h-1 rounded-full"
            style={{ background: row.teamColor }}
          />
        </div>
      ))}
    </div>
  );
}

export function AwardRaceGrid({ races }: { races: AwardRace[] }) {
  return (
    <div className="stagger grid gap-4 lg:grid-cols-2">
      {races.map((race) => (
        <AwardRaceCard key={race.id} race={race} />
      ))}
    </div>
  );
}

function AwardRaceCard({ race }: { race: AwardRace }) {
  const Icon = RACE_ICON[race.id];
  const leader = race.candidates[0];
  const margin = leadMargin(race);
  const max = leader?.score || 1;

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            <Icon className="size-3.5" />
            {race.short}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl uppercase tracking-wide">
            {race.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{race.blurb}</p>
        </div>
        {margin?.tight ? (
          <Badge variant="pending">Toss-up</Badge>
        ) : leader ? (
          <Badge variant="elite">Front</Badge>
        ) : null}
      </div>
      <ol className="divide-y divide-[var(--border)]">
        {race.candidates.length === 0 ? (
          <li className="px-5 py-6 text-sm text-[var(--muted-foreground)]">
            Need more tape before this race has a name.
          </li>
        ) : (
          race.candidates.map((row, index) => (
            <li
              key={row.rosterId}
              className={cn(
                "px-5 py-3.5",
                index === 0 && "bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-6 font-[family-name:var(--font-display)] text-lg tabular-nums",
                    index === 0 ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                  )}
                >
                  {index + 1}
                </span>
                <TeamPlate
                  color={row.teamColor}
                  jersey={row.jerseyNum}
                  abbr={row.teamAbbr}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="truncate font-semibold">
                      {row.name}{" "}
                      <span className="font-normal text-[var(--muted-foreground)]">
                        {row.detail}
                      </span>
                    </p>
                    {index === 0 ? (
                      <Trophy className="size-3.5 shrink-0 text-[var(--primary)]" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {row.headline}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)]"
                      style={{ width: `${Math.max(8, (row.score / max) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}

export function WeekHeaters({
  week,
  heaters,
}: {
  week: number;
  heaters: WeekHeater[];
}) {
  if (heaters.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            <Flame className="mr-1 inline size-3.5" />
            This week’s pop
          </p>
          <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
            Week {week} heaters
          </h3>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={heaters[0]?.href ?? "/league/leaders"}>Full leaderboards</Link>
        </Button>
      </div>
      <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {heaters.map((heater) => (
          <Link
            key={`${heater.label}-${heater.name}`}
            href={heater.href}
            className="surface-hover group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
              {heater.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-xl uppercase leading-tight tracking-wide">
              {heater.name}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {heater.teamAbbr} · {heater.line}
            </p>
            <div
              className="mt-4 h-1.5 rounded-full"
              style={{ background: heater.teamColor }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
