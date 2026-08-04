import Link from "next/link";
import type { User } from "@prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ViewModeToggle } from "@/components/layout/view-mode-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
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
        { href: "/coach", label: "Coach" },
        { href: "/rules", label: "Rules" },
        ...(showAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/games", label: "Games" },
        { href: "/rules", label: "Rules" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 shadow-[0_1px_12px_rgba(15,30,20,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-baseline gap-2">
          <span className="rounded-lg bg-[var(--primary)] px-2 py-1 font-[family-name:var(--font-display)] text-lg tracking-[0.12em] text-[var(--primary-foreground)] shadow-sm">
            {APP_SHORT}
          </span>
          <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">
            {APP_NAME}
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
