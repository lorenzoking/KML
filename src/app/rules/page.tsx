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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.06em]">
          League rules
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {settings.leagueName} · public read-only
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Info label="Current season" value={String(settings.currentSeason)} />
        <Info label="Current week" value={String(settings.currentWeek)} />
        <Info
          label="XP rules"
          value={`${settings.xpGamePlayed} played / ${settings.xpWinBonus} win`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rulebook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {renderMarkdownLite(settings.rulesMarkdown)}
        </CardContent>
      </Card>
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
