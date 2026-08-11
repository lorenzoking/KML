"use client";

import { useState, useTransition } from "react";
import { submitGameResult } from "@/actions/submissions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/submit-button";

type FranchiseOption = {
  id: string;
  name: string;
  abbreviation: string;
};

export function SubmissionForm({
  franchises,
  currentSeason,
  currentWeek,
  userTeamName,
}: {
  franchises: FranchiseOption[];
  currentSeason: number;
  currentWeek: number;
  userTeamName: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const result = await submitGameResult(formData);
          if (result?.error) setError(result.error);
          else setSuccess("Submission saved as pending.");
        });
      }}
    >
      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-sm">
        Your team: <strong>{userTeamName}</strong>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seasonNumber">Season</Label>
          <Input
            id="seasonNumber"
            name="seasonNumber"
            type="number"
            defaultValue={currentSeason}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="week">Week</Label>
          <Input
            id="week"
            name="week"
            type="number"
            defaultValue={currentWeek}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gameType">Game type</Label>
        <Select id="gameType" name="gameType" defaultValue="REGULAR_SEASON" required>
          <option value="REGULAR_SEASON">Regular Season</option>
          <option value="PLAYOFF">Playoff</option>
          <option value="SUPER_BOWL">Super Bowl</option>
          <option value="PRESEASON">Preseason</option>
          <option value="SIMULATED">Simulated (no coach XP)</option>
          <option value="OTHER">Other</option>
        </Select>
        <p className="text-xs text-[var(--muted-foreground)]">
          Choose <strong>Simulated</strong> for CPU sims. They still count in
          standings after approval, but do not award coach XP.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opponentTeamId">Opponent</Label>
        <Select id="opponentTeamId" name="opponentTeamId" required defaultValue="">
          <option value="" disabled>
            Select opponent
          </option>
          {franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="userScore">Your score</Label>
          <Input id="userScore" name="userScore" type="number" min={0} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="opponentScore">Opponent score</Label>
          <Input
            id="opponentScore"
            name="opponentScore"
            type="number"
            min={0}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opponentSimScore">Opponent&apos;s Sim Score (1–5)</Label>
        <Select id="opponentSimScore" name="opponentSimScore" required defaultValue="">
          <option value="" disabled>
            Select opponent&apos;s Sim Score
          </option>
          <option value="5">5 — Elite sim</option>
          <option value="4">4 — Strong sim</option>
          <option value="3">3 — Acceptable</option>
          <option value="2">2 — Poor (counts toward Bad Sim for them)</option>
          <option value="1">1 — Very poor (counts toward Bad Sim for them)</option>
        </Select>
        <p className="text-xs text-[var(--muted-foreground)]">
          Enter the Madden Sim Score for your opponent&apos;s play — not your own. Scores of
          2 or lower feed KML Bad Sim Reputation rules for that coach.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional context for commissioners" />
      </div>

      {error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="success-banner rounded-md px-3 py-2 text-sm">
          {success}
        </p>
      ) : null}

      <SubmitButton disabled={pending} pendingText="Submitting...">
        Submit for approval
      </SubmitButton>
    </form>
  );
}
