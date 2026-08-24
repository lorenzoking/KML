"use client";

import { useState, useTransition } from "react";
import { submitForceWinScore } from "@/actions/submissions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/submit-button";

export function ForceWinScoreForm({
  submissionId,
  userAbbr,
  opponentAbbr,
}: {
  submissionId: string;
  userAbbr: string;
  opponentAbbr: string;
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
          const result = await submitForceWinScore(formData);
          if (result?.error) setError(result.error);
          else setSuccess("Simulated score posted. It counts in standings, not for extra XP.");
        });
      }}
    >
      <input type="hidden" name="submissionId" value={submissionId} />
      <p className="text-sm text-[var(--muted-foreground)]">
        Post the CPU score after the week advances. You must be ahead — this was
        a force win. No extra XP is awarded from this score.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="force-userScore">{userAbbr} (you)</Label>
          <Input
            id="force-userScore"
            name="userScore"
            type="number"
            min={0}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="force-opponentScore">{opponentAbbr}</Label>
          <Input
            id="force-opponentScore"
            name="opponentScore"
            type="number"
            min={0}
            required
          />
        </div>
      </div>
      {error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="success-banner rounded-md px-3 py-2 text-sm">{success}</p>
      ) : null}
      <SubmitButton disabled={pending} pendingText="Posting...">
        Post simulated score
      </SubmitButton>
    </form>
  );
}
