import Link from "next/link";
import { formatLeagueDate } from "@/lib/datetime";
import { MaddenLiveRefresh } from "@/components/league/madden-live-refresh";
import { getMaddenLivePulse } from "@/lib/madden/query";
import { cn } from "@/lib/utils";

const links = [
  { href: "/league", label: "Races", key: "races" },
  { href: "/league/leaders", label: "Leaders", key: "leaders" },
  { href: "/league/teams", label: "Rosters", key: "rosters" },
] as const;

export async function LeagueNav({
  active,
}: {
  active: "races" | "leaders" | "rosters";
}) {
  const pulse = await getMaddenLivePulse();

  return (
    <div className="space-y-2">
      <MaddenLiveRefresh stamp={pulse.stamp} pending={pulse.pending} />
      <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <span className="inline-flex size-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
        {pulse.pending > 0
          ? `Indexing ${pulse.pending} new dump${pulse.pending === 1 ? "" : "s"} from Madden…`
          : pulse.indexedAt
            ? `Companion live · ${formatLeagueDate(pulse.indexedAt, "MMM d, h:mm a")}`
            : "Waiting on the next Companion export"}
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const isActive = active === link.key;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
