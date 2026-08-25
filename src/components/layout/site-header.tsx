import Link from "next/link";
import type { User } from "@/generated/prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ViewModeToggle } from "@/components/layout/view-mode-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BrandLogo } from "@/components/brand/brand-logo";
import { signOut } from "@/actions/auth";
import { APP_NAME, APP_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader({
  user,
  showAdmin,
  canToggleViewMode,
  viewingAsUser,
}: {
  user: User | null;
  showAdmin: boolean;
  canToggleViewMode: boolean;
  viewingAsUser: boolean;
}) {
  const links = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/games", label: "Games" },
        { href: "/contracts", label: "Contracts" },
        { href: "/storylines", label: "Storylines" },
        { href: "/coach", label: "Coach" },
        { href: "/rules", label: "Rules" },
        ...(showAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/games", label: "Games" },
        { href: "/contracts", label: "Contracts" },
        { href: "/storylines", label: "Storylines" },
        { href: "/rules", label: "Rules" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 shadow-[0_1px_12px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <BrandLogo size="sm" priority className="drop-shadow-[0_0_12px_rgba(212,175,55,0.35)]" />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-[var(--foreground)]">
              {APP_SHORT}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">{APP_NAME}</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-end gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                showAdmin && link.href === "/admin"
                  ? "text-[var(--primary)]"
                  : undefined
              )}
            >
              {link.label}
            </Link>
          ))}
          {canToggleViewMode ? (
            <ViewModeToggle viewingAsUser={viewingAsUser} />
          ) : null}
          <ThemeToggle />
          {user ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          ) : (
            <Button asChild size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </nav>
        <MobileNav
          links={links}
          signedIn={Boolean(user)}
          canToggleViewMode={canToggleViewMode}
          viewingAsUser={viewingAsUser}
        />
      </div>
    </header>
  );
}
