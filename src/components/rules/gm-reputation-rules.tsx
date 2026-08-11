import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GM_REPUTATION_INTRO,
  GM_REPUTATION_QUICK_FACTS,
  GM_REPUTATION_RULE_SECTIONS,
} from "@/lib/gm-reputation-rules";

export function GmReputationRulesSection() {
  return (
    <div className="space-y-6">
      <Card className="border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]">
        <CardHeader>
          <CardTitle>{GM_REPUTATION_INTRO.title}</CardTitle>
          <CardDescription>
            Front-office reputation for trades, overpays, and roster decisions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p className="text-base font-medium text-[var(--foreground)]">
            {GM_REPUTATION_INTRO.body}
          </p>
          <p className="text-[var(--muted-foreground)]">{GM_REPUTATION_INTRO.note}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GM_REPUTATION_QUICK_FACTS.map((fact) => (
          <div
            key={fact.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              {fact.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold uppercase tracking-wide">
              {fact.value}
            </p>
          </div>
        ))}
      </div>

      <nav
        aria-label="GM Reputation rule sections"
        className="sticky top-16 z-20 -mx-1 flex flex-wrap gap-2 border-b border-[var(--border)] bg-[var(--background)]/95 px-1 py-3 backdrop-blur"
      >
        {GM_REPUTATION_RULE_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {section.title}
          </a>
        ))}
      </nav>

      <div className="space-y-4">
        {GM_REPUTATION_RULE_SECTIONS.map((section) => (
          <Card key={section.id} id={section.id} className="scroll-mt-36">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.summary ? (
                <CardDescription>{section.summary}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.bands ? (
                <div className="space-y-2">
                  {section.bands.map((band) => (
                    <div
                      key={band.range}
                      className="rounded-lg border border-[var(--border)] px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{band.range}</Badge>
                        <span className="font-medium text-[var(--foreground)]">
                          {band.label}
                        </span>
                      </div>
                      <p className="mt-1">{band.detail}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {section.items?.length ? (
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="ml-5 list-disc leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.note ? (
                <p className="rounded-lg bg-[var(--muted)] px-3 py-2 leading-relaxed">
                  {section.note}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
