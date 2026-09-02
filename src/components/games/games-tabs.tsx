import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "week", label: "This week" },
  { id: "schedule", label: "Schedule" },
  { id: "standings", label: "Standings" },
] as const;

export function GamesTabs({
  active,
  query,
}: {
  active: "week" | "schedule" | "standings";
  query: Record<string, string | undefined>;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-1">
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
              "flex-1 shrink-0 rounded-xl px-4 py-2.5 text-center font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.12em] transition-colors",
              active === tab.id
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_18px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
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
