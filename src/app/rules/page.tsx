import Link from "next/link";
import { CoachIdentityRulesSection } from "@/components/coach/coach-identity-rules";
import { TeamIdentityRulesSection } from "@/components/coach/team-identity-rules";
import { GameplayRulesSection } from "@/components/rules/gameplay-rules";
import { HotSeatRulesSection } from "@/components/rules/hot-seat-rules";
import { RulesTabs, resolveRulesTab } from "@/components/rules/rules-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeagueSettings } from "@/lib/league";

export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveRulesTab(params.tab);
  const settings = await getLeagueSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.06em]">
            League rules
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {settings.leagueName} · pick a tab, then jump to the section you need
          </p>
        </div>
        {(activeTab === "team-identity" || activeTab === "coaching-identity") && (
          <Button asChild variant="outline" size="sm">
            <Link href="/coach/me">Choose my identities</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Info label="Current season" value={String(settings.currentSeason)} />
        <Info label="Current week" value={String(settings.currentWeek)} />
        <Info
          label="XP rules"
          value={`${settings.xpGamePlayed} played / ${settings.xpWinBonus} win`}
        />
      </div>

      <RulesTabs active={activeTab} />

      {activeTab === "gameplay" ? <GameplayRulesSection /> : null}
      {activeTab === "hot-seat" ? <HotSeatRulesSection /> : null}
      {activeTab === "team-identity" ? <TeamIdentityRulesSection /> : null}
      {activeTab === "coaching-identity" ? <CoachIdentityRulesSection /> : null}

      {activeTab === "gameplay" ? (
        <Card>
          <CardHeader>
            <CardTitle>Coaching Carousel & contracts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>All coaches begin on a 3-year contract and start at B coaching reputation.</p>
            <p>
              At season end, carousel opens before free agency: re-sign, extend, or enter
              the market.
            </p>
            <p>Re-sign/extend requires B (75+) and costs 0 XP.</p>
            <p>Changing teams requires B (75+) and costs {settings.buyoutXpCost} XP.</p>
            <p>
              Market pick order runs by coaching reputation first, then career winning
              percentage.
            </p>
            <p>
              Fired coaches lose their team immediately. They can pursue open jobs during
              carousel; if none are open, they enter an autopilot season.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/rules?tab=hot-seat">See Hot Seat & firing rules</Link>
            </Button>
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
