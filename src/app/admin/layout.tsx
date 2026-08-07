import Link from "next/link";
import { requireCommissioner } from "@/lib/auth";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/stories", label: "Stories" },
  { href: "/admin/season", label: "Season" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCommissioner();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 border-b border-[var(--border)] pb-4 lg:flex lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Admin
          </p>
          <h1 className="text-xl font-semibold uppercase tracking-[0.04em] sm:text-2xl sm:tracking-[0.06em]">
            League operations
          </h1>
        </div>
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 px-3 py-2 text-sm font-medium hover:bg-[var(--muted)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
