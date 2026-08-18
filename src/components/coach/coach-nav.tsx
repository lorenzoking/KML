"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/coach", label: "Overview", match: (path: string) => path === "/coach" },
  {
    href: "/coach/reputation",
    label: "Reputation",
    match: (path: string) => path.startsWith("/coach/reputation"),
  },
  {
    href: "/coach/hot-seat",
    label: "Hot Seat",
    match: (path: string) => path.startsWith("/coach/hot-seat"),
  },
  {
    href: "/coach/xp",
    label: "XP Standings",
    match: (path: string) => path.startsWith("/coach/xp"),
  },
  {
    href: "/coach/profiles",
    label: "Profiles",
    match: (path: string) => path.startsWith("/coach/profiles"),
  },
  {
    href: "/coach/identities",
    label: "Identities",
    match: (path: string) => path.startsWith("/coach/identities"),
  },
  {
    href: "/coach/carousel",
    label: "Carousel",
    match: (path: string) => path.startsWith("/coach/carousel"),
  },
  {
    href: "/coach/me",
    label: "My Profile",
    match: (path: string) => path.startsWith("/coach/me"),
  },
] as const;

export function CoachNav() {
  const pathname = usePathname();
  const active = LINKS.find((link) => link.match(pathname)) ?? LINKS[0];
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [pathname]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        Viewing{" "}
        <span className="font-medium text-[var(--foreground)]">{active.label}</span>
      </p>

      <div className="-mx-4 border-b border-[var(--border)] px-4 pb-3">
        <nav
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Coach hub sections"
        >
          {LINKS.map((link) => {
            const isActive = link.href === active.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={isActive ? activeRef : undefined}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
