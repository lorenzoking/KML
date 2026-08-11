import Link from "next/link";
import { cn } from "@/lib/utils";

export const RULES_TABS = [
  {
    id: "gameplay",
    label: "Gameplay",
    description: "In-game settings, offense, defense, and enforcement",
  },
  {
    id: "hot-seat",
    label: "Hot Seat",
    description: "In-season reputation, firings, and turnarounds",
  },
  {
    id: "gm-reputation",
    label: "GM Reputation",
    description: "Trades, overpays, and front-office standing",
  },
  {
    id: "team-identity",
    label: "Team Identity",
    description: "How your franchise builds the roster",
  },
  {
    id: "coaching-identity",
    label: "Coaching Identity",
    description: "How your players develop",
  },
] as const;

export type RulesTabId = (typeof RULES_TABS)[number]["id"];

export function resolveRulesTab(raw?: string | null): RulesTabId {
  const match = RULES_TABS.find((tab) => tab.id === raw);
  return match?.id ?? "gameplay";
}

export function RulesTabs({ active }: { active: RulesTabId }) {
  return (
    <div className="space-y-2">
      <div
        role="tablist"
        aria-label="Rules sections"
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {RULES_TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={`/rules?tab=${tab.id}`}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">
        {RULES_TABS.find((tab) => tab.id === active)?.description}
      </p>
    </div>
  );
}
