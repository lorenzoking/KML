import Link from "next/link";
import { CoachIdentityRulesSection } from "@/components/coach/coach-identity-rules";
import { TeamIdentityRulesSection } from "@/components/coach/team-identity-rules";
import { GameplayRulesSection } from "@/components/rules/gameplay-rules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeagueSettings } from "@/lib/league";

function renderMarkdownLite(markdown: string) {
  return markdown.split("\n").map((line, idx) => {
    if (line.startsWith("# ")) {
      return (
        <h1 key={idx} className="mt-6 text-2xl font-semibold uppercase first:mt-0">
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={idx} className="mt-5 text-lg font-semibold uppercase tracking-wide">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={idx} className="ml-5 list-disc text-sm text-[var(--muted-foreground)]">
          {line.slice(2)}
        </li>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={idx} className="ml-5 list-decimal text-sm text-[var(--muted-foreground)]">
          {line.replace(/^\d+\.\s/, "")}
        </li>
      );
    }
    if (!line.trim()) return <div key={idx} className="h-2" />;
    return (
      <p key={idx} className="text-sm leading-relaxed text-[var(--muted-foreground)]">
        {line}
      </p>
    );
  });
}

export default async function RulesPage() {
  const settings = await getLeagueSettings();
  const hasExtraRulebook = Boolean(settings.rulesMarkdown?.trim());

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.06em]">
            League rules
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {settings.leagueName} · gameplay, scheduling, identities, and enforcement
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="#gameplay">Gameplay</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#team-identity">Team Identity</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#coaching-identity">Coaching Identity</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Info label="Current season" value={String(settings.currentSeason)} />
        <Info label="Current week" value={String(settings.currentWeek)} />
        <Info
          label="XP rules"
          value={`${settings.xpGamePlayed} played / ${settings.xpWinBonus} win`}
        />
      </div>

      <section id="gameplay" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold uppercase tracking-wide">
            Gameplay rules
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            How we play user and CPU games — settings, offense, defense, and enforcement.
          </p>
        </div>
        <GameplayRulesSection />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Coaching Carousel & contracts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
          <p>All coaches begin on a 3-year contract and start at B coaching reputation.</p>
          <p>At season end, carousel opens before free agency: re-sign, extend, or enter the market.</p>
          <p>Re-sign/extend requires B (75+) and costs 0 XP.</p>
          <p>Changing teams requires B (75+) and costs {settings.buyoutXpCost} XP.</p>
          <p>Market pick order runs by coaching reputation first, then career winning percentage.</p>
          <p>Fired coaches lose their team immediately. They can pursue open jobs during carousel; if none are open, they enter an autopilot season.</p>
        </CardContent>
      </Card>

      <section id="team-identity" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold uppercase tracking-wide">
              Team Identity
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Full breakdown of Win Now, Rebuilding, Draft & Develop, and Balanced.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/coach/identities#team-identity">Open in Coach hub</Link>
          </Button>
        </div>
        <TeamIdentityRulesSection />
      </section>

      <section id="coaching-identity" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold uppercase tracking-wide">
              Coaching Identity
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Full breakdown of QB Whisperer, Skill Developer, Trench Builder, Defensive
              Guru, RB Guru, and Culture Builder.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/coach/identities#coaching-identity">Open in Coach hub</Link>
          </Button>
        </div>
        <CoachIdentityRulesSection />
      </section>

      {hasExtraRulebook ? (
        <Card id="additional-rulebook" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Additional commissioner notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderMarkdownLite(settings.rulesMarkdown)}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
          {label}
        </p>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
