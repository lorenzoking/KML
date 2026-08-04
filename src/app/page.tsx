import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/constants";

export default async function HomePage() {
  const user = await getSessionUser();
  let settings = null;
  try {
    settings = await prisma.leagueSetting.findUnique({ where: { key: "default" } });
  } catch {
    settings = null;
  }

  return (
    <div className="space-y-10">
      <section className="field-stripe relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 sm:px-10 sm:py-16">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[color-mix(in_oklab,var(--field-mid)_22%,transparent)] to-transparent" />
        <div className="relative max-w-2xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            Madden 27 Online Franchise
          </p>
          <h1 className="text-4xl font-semibold uppercase tracking-[0.08em] sm:text-5xl">
            {settings?.leagueName ?? APP_NAME}
          </h1>
          <p className="max-w-xl text-base text-[var(--muted-foreground)] sm:text-lg">
            Commissioner operations for a 32-user league — team assignments,
            game approvals, standings, XP, and coach reputation in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/sign-in">Sign in with Google</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link href="/standings">View standings</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/rules">League rules</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Submit & approve",
            body: "Coaches post scores. Commissioners approve or reject before they count.",
          },
          {
            title: "Live standings",
            body: "Wins, losses, points, and form derived only from approved results.",
          },
          {
            title: "XP & reputation",
            body: "Automatic XP on approval plus commissioner adjustments and hot-seat labels.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
