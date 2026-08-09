import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GAMEPLAY_MAIN_RULE,
  GAMEPLAY_QUICK_FACTS,
  GAMEPLAY_RULE_SECTIONS,
} from "@/lib/gameplay-rules";

export function GameplayRulesSection() {
  return (
    <div className="space-y-6">
      <Card className="border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]">
        <CardHeader>
          <CardTitle>{GAMEPLAY_MAIN_RULE.title}</CardTitle>
          <CardDescription>Everything else supports this standard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p className="text-base font-medium text-[var(--foreground)]">
            {GAMEPLAY_MAIN_RULE.body}
          </p>
          <p className="text-[var(--muted-foreground)]">{GAMEPLAY_MAIN_RULE.note}</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GAMEPLAY_QUICK_FACTS.map((fact) => (
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
        aria-label="Gameplay rule sections"
        className="flex flex-wrap gap-2"
      >
        {GAMEPLAY_RULE_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {section.title}
          </a>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-2">
        {GAMEPLAY_RULE_SECTIONS.map((section) => (
          <Card key={section.id} id={section.id} className="scroll-mt-24">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.summary ? (
                <CardDescription>{section.summary}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                {section.items.map((item) => (
                  <li key={item} className="ml-5 list-disc leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
