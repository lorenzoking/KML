"use client";

import { useState, useTransition } from "react";
import { submitGameSimScore } from "@/actions/submissions";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";
import { SIM_SCORE_OPTIONS } from "@/lib/sim-score";

export function SimScoreForm({
  submissionId,
  opponentName,
  opponentAbbr,
}: {
  submissionId: string;
  opponentName: string;
  opponentAbbr: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const result = await submitGameSimScore(formData);
          if (result?.error) setError(result.error);
          else setSuccess(`Saved ${opponentAbbr} Sim Score.`);
        });
      }}
    >
      <input type="hidden" name="submissionId" value={submissionId} />
      <div className="space-y-2">
        <Label htmlFor="simScore">
          {opponentName} ({opponentAbbr}) Sim Score
        </Label>
        <Select id="simScore" name="simScore" required defaultValue="" disabled={pending}>
          <option value="" disabled>
            Select opponent&apos;s Sim Score
          </option>
          {SIM_SCORE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <p className="text-xs text-[var(--muted-foreground)]">
          Rate {opponentAbbr}&apos;s Madden play — not your own. Scores of 2 or lower
          feed KML Bad Sim rules for that coach.
        </p>
      </div>
      {error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="success-banner rounded-md px-3 py-2 text-sm">{success}</p>
      ) : null}
      <SubmitButton disabled={pending} pendingText="Saving...">
        Submit Sim Score
      </SubmitButton>
    </form>
  );
}
