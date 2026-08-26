"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { commissionerFileGame } from "@/actions/approvals";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/submit-button";

export function CommissionerFileMissingGameForm({
  seasonNumber,
  week,
  homeTeamId,
  awayTeamId,
  homeAbbr,
  awayAbbr,
  isPrimetime,
}: {
  seasonNumber: number;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeAbbr: string;
  awayAbbr: string;
  isPrimetime?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [awardXp, setAwardXp] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await commissionerFileGame(formData);
          if (result?.error) setError(result.error);
          else router.refresh();
        });
      }}
    >
      <input type="hidden" name="seasonNumber" value={seasonNumber} />
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="gameType" value="REGULAR_SEASON" />
      <input type="hidden" name="userTeamId" value={homeTeamId} />
      <input type="hidden" name="opponentTeamId" value={awayTeamId} />
      <input type="hidden" name="opponentSimScore" value="3" />
      <input type="hidden" name="userTeamSimScore" value="3" />
      {isPrimetime ? <input type="hidden" name="isPrimetime" value="true" /> : null}
      <input
        type="hidden"
        name="notes"
        value={
          awardXp
            ? "Commissioner filed a missing scheduled game. XP awarded."
            : "Commissioner filed a missing scheduled game — no XP awarded."
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs text-[var(--muted-foreground)]">
          {awayAbbr}
          <Input
            name="opponentScore"
            type="number"
            min={0}
            required
            inputMode="numeric"
            className="h-9 w-20"
            aria-label={`${awayAbbr} score`}
          />
        </label>
        <span className="pb-2 text-xs text-[var(--muted-foreground)]">@</span>
        <label className="space-y-1 text-xs text-[var(--muted-foreground)]">
          {homeAbbr}
          <Input
            name="userScore"
            type="number"
            min={0}
            required
            inputMode="numeric"
            className="h-9 w-20"
            aria-label={`${homeAbbr} score`}
          />
        </label>
        <SubmitButton size="sm" disabled={pending} pendingText="Posting...">
          {awardXp ? "Post (with XP)" : "Post (no XP)"}
        </SubmitButton>
      </div>
      <label className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
        <input
          type="checkbox"
          name="awardXp"
          value="true"
          checked={awardXp}
          onChange={(event) => setAwardXp(event.target.checked)}
          className="mt-0.5 h-3.5 w-3.5"
        />
        <span>
          Award XP — both coaches get game-played XP; the winner gets the win
          bonus.
        </span>
      </label>
      {error ? (
        <p className="text-xs text-rose-300">{error}</p>
      ) : (
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Posts immediately. Counts for standings and reputation
          {awardXp ? ", and coach XP." : ". Leave XP unchecked if they should not earn it."}
        </p>
      )}
    </form>
  );
}
