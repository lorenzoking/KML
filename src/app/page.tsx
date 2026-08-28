import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/brand-logo";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Crown, Shield, Trophy } from "lucide-react";

export default async function HomePage() {
  const user = await getSessionUser();
  let settings = null;
  try {
    settings = await prisma.leagueSetting.findUnique({ where: { key: "default" } });
  } catch {
    settings = null;
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden border-y border-[var(--border)]">
        <div className="absolute inset-0 bg-[#050505]">
          <div className="absolute inset-y-0 right-[-8%] flex w-[70%] items-center justify-center sm:w-[55%]">
            <BrandLogo
              size="hero"
              priority
              className="max-w-none scale-110 opacity-40 drop-shadow-[0_0_60px_rgba(212,175,55,0.25)] sm:opacity-55"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(212,175,55,0.18),transparent_55%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-12 pt-20 sm:min-h-[82vh] sm:pb-16 sm:pt-24">
          <div className="max-w-2xl space-y-5 animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Built on competition · Driven by brotherhood
            </p>
            <div className="space-y-2">
              <BrandLogo size="lg" priority className="drop-shadow-[0_0_30px_rgba(212,175,55,0.35)]" />
              <h1 className="text-4xl font-semibold uppercase leading-[0.95] tracking-[0.04em] text-white sm:text-6xl">
                {settings?.leagueName ?? APP_NAME}
              </h1>
              <p className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.18em] text-[var(--primary)] sm:text-3xl">
                Reborn
              </p>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Back after 3 years. Better than ever. Compete. Dominate. Be legendary.
            </p>
            {settings ? (
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-white/80">
                <span>Season {settings.currentSeason}</span>
                <span>Week {settings.currentWeek}</span>
                <span>32 franchises</span>
              </div>
            ) : null}
            <div className="grid gap-2 pt-1 sm:flex sm:flex-wrap sm:gap-3">
              {user ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Enter the league desk <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/sign-in">
                    Sign in with Google <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="border-white/25 bg-black/30 text-white hover:bg-white/10">
                <Link href="/games">Games & standings</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/25 bg-black/30 text-white hover:bg-white/10">
                <Link href="/league">Award races</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="stagger grid gap-3 sm:gap-4 md:grid-cols-3">
        {[
          {
            icon: Crown,
            title: "Compete",
            body: "32 coaches. One season. Every result approved, tracked, and written into league lore.",
          },
          {
            icon: Trophy,
            title: "Dominate",
            body: "Standings, XP, reputation, and weekly storylines keep the pressure real.",
          },
          {
            icon: Shield,
            title: "Be legendary",
            body: "Draft chapters, coaching careers, and job security shape who lasts in KML.",
          },
        ].map((item) => (
          <Card key={item.title} className="surface-hover">
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
