import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, BarChart3, ShieldCheck, Trophy } from "lucide-react";

export default async function HomePage() {
  const user = await getSessionUser();
  let settings = null;
  try {
    settings = await prisma.leagueSetting.findUnique({ where: { key: "default" } });
  } catch {
    settings = null;
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <section className="field-stripe relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] px-5 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:px-10 sm:py-16">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[color-mix(in_srgb,var(--primary)_22%,transparent)] to-transparent" />
        <div className="relative max-w-3xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            Madden 27 Online Franchise
          </p>
          <h1 className="text-4xl font-semibold uppercase leading-[1.05] tracking-[0.04em] sm:text-6xl">
            {settings?.leagueName ?? APP_NAME}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
            Commissioner operations for a 32-user league — team assignments,
            game approvals, standings, XP, and coach reputation in one place.
          </p>
          {settings ? (
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
              <span>Season {settings.currentSeason}</span>
              <span className="text-[var(--muted-foreground)]">Week {settings.currentWeek}</span>
              <span className="text-[var(--muted-foreground)]">32 franchises</span>
            </div>
          ) : null}
          <div className="grid gap-2 pt-1 sm:flex sm:flex-wrap sm:gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/sign-in">
                  Sign in with Google <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link href="/games">Games & standings</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/rules">League rules</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Submit & approve",
            body: "Coaches post scores. Commissioners approve or reject before they count.",
          },
          {
            icon: BarChart3,
            title: "Live standings",
            body: "Wins, losses, points, and form derived only from approved results.",
          },
          {
            icon: Trophy,
            title: "XP & reputation",
            body: "Automatic XP on approval plus commissioner adjustments and hot-seat labels.",
          },
        ].map((item) => (
          <Card key={item.title} className="transition-transform duration-200 hover:-translate-y-0.5">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <item.icon className="size-5" />
              </div>
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
