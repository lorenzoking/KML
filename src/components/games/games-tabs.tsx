import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "week", label: "Week results" },
  { id: "standings", label: "Standings" },
] as const;

export function GamesTabs({
  active,
  query,
}: {
  active: "week" | "standings";
  query: Record<string, string | undefined>;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
      {tabs.map((tab) => {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
          if (value && key !== "tab") params.set(key, value);
        });
        params.set("tab", tab.id);
        return (
          <Link
            key={tab.id}
            href={`/games?${params.toString()}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active === tab.id
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
