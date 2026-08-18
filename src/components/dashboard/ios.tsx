import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      {label ? (
        <p className="px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
          {label}
        </p>
      ) : null}
      {children}
    </section>
  );
}

export function Group({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_8px_28px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </div>
  );
}

export function GroupRow({
  href,
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  trailing,
}: {
  href: string;
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-[0.9rem] transition-colors hover:bg-[var(--muted)]/70 active:bg-[var(--muted)]"
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-[var(--primary)] text-[var(--primary-foreground)]",
          iconClassName
        )}
      >
        <Icon className="size-4" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-tight">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[13px] text-[var(--muted-foreground)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {trailing}
      <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)]/70" />
    </Link>
  );
}

export function Shortcut({
  href,
  label,
  icon: Icon,
  tone = "gold",
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  tone?: "gold" | "ink" | "soft" | "warn";
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl px-1 py-1 transition-transform active:scale-[0.96]"
    >
      <div
        className={cn(
          "flex size-[3.35rem] items-center justify-center rounded-[1.15rem] shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
          tone === "gold" && "bg-[var(--primary)] text-[var(--primary-foreground)]",
          tone === "ink" && "bg-[#1a1a1a] text-[var(--primary)] dark:bg-[#2a2a2a]",
          tone === "soft" &&
            "bg-[color-mix(in_srgb,var(--primary)_18%,var(--muted))] text-[var(--primary)]",
          tone === "warn" && "bg-amber-500 text-white"
        )}
      >
        <Icon className="size-6" strokeWidth={2.1} />
      </div>
      <span className="text-center text-[11px] font-medium leading-tight text-[var(--foreground)]">
        {label}
      </span>
    </Link>
  );
}
