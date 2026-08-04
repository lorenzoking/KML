"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ViewModeToggle } from "@/components/layout/view-mode-toggle";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

export function MobileNav({
  links,
  signedIn,
  canToggleViewMode,
  viewingAsUser,
}: {
  links: NavLink[];
  signedIn: boolean;
  canToggleViewMode: boolean;
  viewingAsUser: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 top-16 z-40 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-3 top-[4.75rem] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-2xl animate-enter">
            <nav className="grid gap-1" aria-label="Mobile navigation">
              {links.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                      active
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
              {canToggleViewMode ? (
                <ViewModeToggle viewingAsUser={viewingAsUser} />
              ) : null}
              <ThemeToggle />
              {signedIn ? (
                <form action={signOut} className="flex-1">
                  <Button type="submit" variant="outline" className="w-full">
                    Sign out
                  </Button>
                </form>
              ) : (
                <Button asChild className="flex-1">
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
