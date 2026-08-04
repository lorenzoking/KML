import Link from "next/link";
import type { User } from "@prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ViewModeToggle } from "@/components/layout/view-mode-toggle";
import { signOut } from "@/actions/auth";
import { APP_NAME, APP_SHORT } from "@/lib/constants";

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
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-xl tracking-[0.12em] text-[var(--primary)]">
            {APP_SHORT}
          </span>
          <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">
            {APP_NAME}
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-end gap-1 overflow-x-auto sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
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
      </div>
    </header>
  );
}
