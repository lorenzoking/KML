import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/league", label: "Tape" },
  { href: "/league/leaders", label: "Leaders" },
  { href: "/league/teams", label: "Rosters" },
];

export function LeagueNav({ active }: { active: "tape" | "leaders" | "rosters" }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
      {links.map((link) => {
        const isActive =
          (active === "tape" && link.href === "/league") ||
          (active === "leaders" && link.href === "/league/leaders") ||
          (active === "rosters" && link.href === "/league/teams");
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
