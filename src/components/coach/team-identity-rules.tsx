import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TEAM_IDENTITY_CHANGE_RULE,
  TEAM_IDENTITY_INTRO,
  TEAM_IDENTITY_LEAGUE_NOTES,
  TEAM_IDENTITY_RULES,
  TEAM_IDENTITY_SNAPSHOT,
  WIN_NOW_VS_BALANCED,
  type TeamIdentityRule,
} from "@/lib/coach/team-identity-rules";

export function TeamIdentityRulesSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Identity rules</CardTitle>
          <CardDescription>
            How your franchise builds — Free Agency, trades, camps, and the draft.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {TEAM_IDENTITY_INTRO.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="rounded-lg border border-[color-mix(in_srgb,var(--primary)_30%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 py-2 text-[var(--foreground)]">
            {TEAM_IDENTITY_CHANGE_RULE}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>At a glance</CardTitle>
          <CardDescription>
            Scan the trade-offs before you commit. Details for each identity are below.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[var(--muted-foreground)]">
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 pr-3 font-medium">Identity</th>
                <th className="py-2 pr-3 font-medium">Veterans</th>
                <th className="py-2 pr-3 font-medium">Draft capital</th>
                <th className="py-2 pr-3 font-medium">Development</th>
                <th className="py-2 font-medium">Best for</th>
              </tr>
            </thead>
            <tbody>
              {TEAM_IDENTITY_SNAPSHOT.map((row) => (
                <tr key={row.slug} className="border-b border-[var(--border)] align-top">
                  <td className="py-3 pr-3">
                    <a
                      href={`#${row.slug}`}
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      {row.name}
                    </a>
                  </td>
                  <td className="py-3 pr-3 text-[var(--muted-foreground)]">{row.veterans}</td>
                  <td className="py-3 pr-3 text-[var(--muted-foreground)]">
                    {row.draftCapital}
                  </td>
                  <td className="py-3 pr-3 text-[var(--muted-foreground)]">
                    {row.development}
                  </td>
                  <td className="py-3 text-[var(--muted-foreground)]">{row.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {TEAM_IDENTITY_RULES.map((identity) => (
          <IdentityDetailCard key={identity.slug} identity={identity} />
        ))}
      </div>

      <Card id="win-now-vs-balanced">
        <CardHeader>
          <CardTitle>{WIN_NOW_VS_BALANCED.title}</CardTitle>
          <CardDescription>{WIN_NOW_VS_BALANCED.intro}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Win Now
              </p>
              <ul className="mt-2 space-y-1 text-[var(--muted-foreground)]">
                {WIN_NOW_VS_BALANCED.winNowSummary.map((item) => (
                  <li key={item} className="ml-5 list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Balanced
              </p>
              <ul className="mt-2 space-y-1 text-[var(--muted-foreground)]">
                {WIN_NOW_VS_BALANCED.balancedSummary.map((item) => (
                  <li key={item} className="ml-5 list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            {WIN_NOW_VS_BALANCED.examples.map((example) => (
              <div
                key={example.label}
                className="rounded-lg border border-[var(--border)] p-3"
              >
                <p className="font-medium">{example.label}</p>
                <p className="mt-1 text-[var(--muted-foreground)]">
                  Win Now: {example.winNow}
                </p>
                <p className="text-[var(--muted-foreground)]">
                  Balanced: {example.balanced}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>League notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
            {TEAM_IDENTITY_LEAGUE_NOTES.map((note) => (
              <li key={note} className="ml-5 list-disc">
                {note}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function IdentityDetailCard({ identity }: { identity: TeamIdentityRule }) {
  return (
    <Card id={identity.slug} className="scroll-mt-24">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{identity.shortLabel}</Badge>
        </div>
        <CardTitle>{identity.name}</CardTitle>
        <p className="text-sm font-medium text-[var(--foreground)]">{identity.tagline}</p>
        <CardDescription className="text-sm leading-relaxed">
          {identity.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <RuleList title="Free Agency" items={identity.freeAgency} />
        <RuleList title="Development" items={identity.development} />
        <RuleList title="Trades" items={identity.trades} />
        <RuleList title="Restrictions" items={identity.restrictions} />
        {identity.tradeExample ? (
          <p className="rounded-lg bg-[var(--muted)] px-3 py-2 text-[var(--muted-foreground)]">
            Example: {identity.tradeExample}
          </p>
        ) : null}
        {identity.chooseIf?.length ? (
          <RuleList title="Choose this if" items={identity.chooseIf} />
        ) : null}
        <p className="border-t border-[var(--border)] pt-3 italic text-[var(--muted-foreground)]">
          Philosophy: {identity.philosophy}
        </p>
      </CardContent>
    </Card>
  );
}

function RuleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
        {title}
      </p>
      <ul className="space-y-1.5 text-[var(--muted-foreground)]">
        {items.map((item) => (
          <li key={item} className="ml-5 list-disc leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
