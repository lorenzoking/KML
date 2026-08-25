import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "calculator", label: "Calculator", href: "/contracts" },
  { id: "league", label: "League signings", href: "/contracts?tab=league" },
] as const;

export type ContractsTabId = (typeof TABS)[number]["id"];

export function resolveContractsTab(raw?: string | null): ContractsTabId {
  return raw === "league" ? "league" : "calculator";
}

export function ContractsTabs({
  active,
  adminHref,
}: {
  active: ContractsTabId;
  adminHref?: string | null;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-3">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          {tab.label}
        </Link>
      ))}
      {adminHref ? (
        <Link
          href={adminHref}
          className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Market comps
        </Link>
      ) : null}
    </div>
  );
}
