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
          <option value="OTHER">Other</option>
        </Select>
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
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional context for commissioners" />
      </div>

      {error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <SubmitButton disabled={pending} pendingText="Submitting...">
        Submit for approval
      </SubmitButton>
    </form>
  );
}
