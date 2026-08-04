import Link from "next/link";
import { requireUser, isCommissioner } from "@/lib/auth";

const LINKS = [
  { href: "/coach", label: "Overview" },
  { href: "/coach/xp", label: "XP Standings" },
  { href: "/coach/profiles", label: "Profiles" },
  { href: "/coach/identities", label: "Identities" },
  { href: "/coach/hot-seat", label: "Hot Seat" },
  { href: "/coach/carousel", label: "Carousel" },
  { href: "/coach/reputation", label: "Reputation Log" },
];

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Coach Hub</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Coaching identities, XP races, job security, carousel, and reputation.
          {isCommissioner(user) ? " Commissioner actions are enabled." : ""}
        </p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <nav className="flex min-w-max gap-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
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
