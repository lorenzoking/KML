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
} from "@/lib/coach/team-identity-rules";

export function TeamIdentityRulesSection({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Identity rules</CardTitle>
          <CardDescription>
            Franchise philosophy that shapes Free Agency, trades, camps, and the draft.
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

      <div className={compact ? "space-y-4" : "grid gap-4 lg:grid-cols-2"}>
        {TEAM_IDENTITY_RULES.map((identity) => (
          <Card key={identity.slug} id={identity.slug}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{identity.shortLabel}</Badge>
              </div>
              <CardTitle>{identity.name}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {identity.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <RuleList title="Benefits" items={identity.benefits} />
              <RuleList title="Restrictions" items={identity.restrictions} />
              {identity.recommended ? (
                <p className="text-[var(--muted-foreground)]">{identity.recommended}</p>
              ) : null}
              <p className="border-t border-[var(--border)] pt-3 italic text-[var(--muted-foreground)]">
                Philosophy: {identity.philosophy}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

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
