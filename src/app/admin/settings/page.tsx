import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/submit-button";
import { updateLeagueSettings } from "@/actions/settings";
import { getLeagueSettings } from "@/lib/league";

export default async function SettingsAdminPage() {
  const settings = await getLeagueSettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">
          League settings
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Season/week clocks and XP values used when approving games.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Changes are audited and apply immediately to dashboards and rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await updateLeagueSettings(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="leagueName">League name</Label>
              <Input
                id="leagueName"
                name="leagueName"
                defaultValue={settings.leagueName}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentSeason">Current season</Label>
                <Input
                  id="currentSeason"
                  name="currentSeason"
                  type="number"
                  defaultValue={settings.currentSeason}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentWeek">Current week</Label>
                <Input
                  id="currentWeek"
                  name="currentWeek"
                  type="number"
                  defaultValue={settings.currentWeek}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xpGamePlayed">XP for game played</Label>
                <Input
                  id="xpGamePlayed"
                  name="xpGamePlayed"
                  type="number"
                  defaultValue={settings.xpGamePlayed}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xpWinBonus">XP for win</Label>
                <Input
                  id="xpWinBonus"
                  name="xpWinBonus"
                  type="number"
                  defaultValue={settings.xpWinBonus}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="startingRepScore">Starting reputation score</Label>
                <Input
                  id="startingRepScore"
                  name="startingRepScore"
                  type="number"
                  defaultValue={settings.startingRepScore}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rulesMarkdown">Rules (markdown-lite)</Label>
              <Textarea
                id="rulesMarkdown"
                name="rulesMarkdown"
                className="min-h-[280px] font-mono text-xs"
                defaultValue={settings.rulesMarkdown}
                required
              />
            </div>

            <SubmitButton>Save settings</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
