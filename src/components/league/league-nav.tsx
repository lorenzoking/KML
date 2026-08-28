import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/league", label: "Races", key: "races" },
  { href: "/league/leaders", label: "Leaders", key: "leaders" },
  { href: "/league/teams", label: "Rosters", key: "rosters" },
] as const;

export function LeagueNav({
  active,
}: {
  active: "races" | "leaders" | "rosters";
}) {
  return (
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
  );
}
