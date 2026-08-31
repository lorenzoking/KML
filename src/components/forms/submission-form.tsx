"use client";

import { useState, useTransition } from "react";
import { submitGameResult } from "@/actions/submissions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  FORCE_WIN_REASON_LABELS,
  FORCE_WIN_REASON_XP_HINTS,
  FORCE_WIN_REASONS,
} from "@/lib/constants";

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
  scheduledOpponent,
  scheduledIsHome,
  scheduledPrimetime,
  isByeWeek,
}: {
  franchises: FranchiseOption[];
  currentSeason: number;
  currentWeek: number;
  userTeamName: string;
  scheduledOpponent?: { id: string; name: string; abbreviation: string } | null;
  scheduledIsHome?: boolean;
  scheduledPrimetime?: boolean;
  isByeWeek?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forceWin, setForceWin] = useState(false);
  const [forceWinReason, setForceWinReason] = useState<
    "" | "GAME_CUT_OUT" | "OPPONENT_UNAVAILABLE"
  >("");
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
          else {
            setSuccess(
              forceWin
                ? forceWinReason === "GAME_CUT_OUT"
                  ? "Force win submitted. Both coaches get game-played XP after approval. The Companion export fills in the CPU score."
                  : "Force win submitted. You’ll get game-played XP after approval; the opponent will not. The Companion export fills in the CPU score."
                : "Sim Score submitted. Game score and XP come from the Madden Companion export."
            );
            setForceWin(false);
            setForceWinReason("");
          }
        });
      }}
    >
      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-sm">
        Your team: <strong>{userTeamName}</strong>
        {isByeWeek ? (
          <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
            Bye week on the 2026 NFL slate. You can still file a sim or extra
            game if needed.
          </span>
        ) : scheduledOpponent ? (
          <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
            This week: {scheduledIsHome ? "vs" : "@"} {scheduledOpponent.abbreviation}{" "}
            {scheduledOpponent.name}
          </span>
        ) : null}
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
          Game scores come from the Companion export. Choose{" "}
          <strong>Simulated</strong> only if you ran a fair CPU sim. Force wins
          use the checkbox below instead.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opponentTeamId">Opponent</Label>
        <Select
          id="opponentTeamId"
          name="opponentTeamId"
          required
          defaultValue={scheduledOpponent?.id ?? ""}
        >
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

      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="isForceWin"
            value="true"
            checked={forceWin}
            onChange={(event) => {
              setForceWin(event.target.checked);
              if (!event.target.checked) setForceWinReason("");
            }}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-semibold">I received a force win</span>
            <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
              Use this when the game did not finish as a normal user game.
              Madden scores come from the Companion export. Force wins never
              award win-bonus XP.
            </span>
          </span>
        </label>
      </div>

      {forceWin ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Why did you get the force win?</legend>
          <div className="space-y-2">
            {FORCE_WIN_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="forceWinReason"
                  value={reason}
                  checked={forceWinReason === reason}
                  onChange={() => setForceWinReason(reason)}
                  required
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="font-semibold">{FORCE_WIN_REASON_LABELS[reason]}</span>
                  <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                    {FORCE_WIN_REASON_XP_HINTS[reason]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {forceWin ? null : (
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
            Rate your opponent&apos;s Madden play — not your own. The final score
            and coach XP come from the Companion export. Scores of 2 or lower
            feed KML Bad Sim Reputation rules for that coach.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="isPrimetime"
            value="true"
            defaultChecked={Boolean(scheduledPrimetime)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-semibold">KML Primetime game</span>
            <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
              Check this if the desk put this matchup on the Primetime slate. Primetime
              wins, losses, and upsets move Coaching Reputation.
            </span>
          </span>
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes{forceWin ? " (optional)" : ""}</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder={
            forceWin
              ? forceWinReason === "GAME_CUT_OUT"
                ? "Optional: when it dropped and any proof for commissioners"
                : forceWinReason === "OPPONENT_UNAVAILABLE"
                  ? "Optional: who said they couldn’t play, and how it was agreed"
                  : "Optional context for commissioners"
              : "Optional context for commissioners"
          }
        />
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
        {forceWin ? "Submit force win" : "Submit Sim Score"}
      </SubmitButton>
    </form>
  );
}
