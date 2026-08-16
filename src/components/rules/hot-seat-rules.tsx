import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  COACHING_REP_GRADES,
  COACHING_REP_INTRO,
  COACHING_REP_RULE_SECTIONS,
  HOT_SEAT_INTRO,
  HOT_SEAT_QUICK_FACTS,
  HOT_SEAT_RULE_SECTIONS,
  type HotSeatRuleSection,
} from "@/lib/hot-seat-rules";

export function HotSeatRulesSection() {
  const navSections = [...COACHING_REP_RULE_SECTIONS, ...HOT_SEAT_RULE_SECTIONS];

  return (
    <div className="space-y-6">
      <Card className="border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]">
        <CardHeader>
          <CardTitle>{COACHING_REP_INTRO.title}</CardTitle>
          <CardDescription>
            Live rating that follows the coach. Starts at 85 (B).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p className="text-base font-medium text-[var(--foreground)]">
            {COACHING_REP_INTRO.body}
          </p>
          <p className="text-[var(--muted-foreground)]">{COACHING_REP_INTRO.note}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {COACHING_REP_GRADES.map((band) => (
              <div
                key={band.label}
                className="rounded-lg border border-[var(--border)] px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{band.range}</Badge>
                  <span className="font-medium text-[var(--foreground)]">
                    {band.label}
                  </span>
                </div>
                <p className="mt-1 text-[var(--muted-foreground)]">{band.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{HOT_SEAT_INTRO.title}</CardTitle>
          <CardDescription>In-season reputation, pressure, and firings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p className="text-base font-medium text-[var(--foreground)]">
            {HOT_SEAT_INTRO.body}
          </p>
          <p className="text-[var(--muted-foreground)]">{HOT_SEAT_INTRO.note}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HOT_SEAT_QUICK_FACTS.map((fact) => (
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
        aria-label="Hot Seat rule sections"
        className="sticky top-16 z-20 -mx-1 flex flex-wrap gap-2 border-b border-[var(--border)] bg-[var(--background)]/95 px-1 py-3 backdrop-blur"
      >
        {navSections.map((section) => (
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
        {COACHING_REP_RULE_SECTIONS.map((section) => (
          <RuleSectionCard key={section.id} section={section} />
        ))}
        {HOT_SEAT_RULE_SECTIONS.map((section) => (
          <RuleSectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

function RuleSectionCard({ section }: { section: HotSeatRuleSection }) {
  return (
    <Card id={section.id} className="scroll-mt-36">
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
        {section.examples?.length ? (
          <ul className="space-y-2">
            {section.examples.map((example) => (
              <li key={example} className="ml-5 list-disc leading-relaxed">
                {example}
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
  );
}
