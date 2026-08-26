"use client";

import { useState, useTransition } from "react";
import { commissionerFileGame } from "@/actions/approvals";
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

export function CommissionerFileGameForm({
  franchises,
  currentSeason,
  currentWeek,
}: {
  franchises: FranchiseOption[];
  currentSeason: number;
  currentWeek: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [awardXp, setAwardXp] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const result = await commissionerFileGame(formData);
          if (result?.error) setError(result.error);
          else {
            setSuccess(
              awardXp
                ? "Result posted. Standings, reputation, and coach XP updated."
                : "Result posted. Standings and reputation updated; no XP awarded."
            );
            setAwardXp(false);
          }
        });
      }}
    >
      <p className="text-sm text-[var(--muted-foreground)]">
        Use this when coaches did not submit and the desk has to post the score.
        The game still counts for standings and Coaching Reputation. Check Award
        XP if both coaches should get game-played XP and the winner should get
        the win bonus.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="file-seasonNumber">Season</Label>
          <Input
            id="file-seasonNumber"
            name="seasonNumber"
            type="number"
            defaultValue={currentSeason}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file-week">Week</Label>
          <Input
            id="file-week"
            name="week"
            type="number"
            defaultValue={currentWeek}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-gameType">Game type</Label>
        <Select
          id="file-gameType"
          name="gameType"
          defaultValue="REGULAR_SEASON"
          required
        >
          <option value="REGULAR_SEASON">Regular Season</option>
          <option value="PLAYOFF">Playoff</option>
          <option value="SUPER_BOWL">Super Bowl</option>
          <option value="PRESEASON">Preseason</option>
          <option value="SIMULATED">Simulated (CPU — also skips reputation)</option>
          <option value="OTHER">Other</option>
        </Select>
        <p className="text-xs text-[var(--muted-foreground)]">
          Keep this as Regular Season for a played league game. Simulated is for
          CPU results only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="file-userTeamId">Team A</Label>
          <Select id="file-userTeamId" name="userTeamId" required defaultValue="">
            <option value="" disabled>
              Select team
            </option>
            {franchises.map((f) => (
              <option key={f.id} value={f.id}>
                {f.abbreviation} · {f.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="file-opponentTeamId">Team B</Label>
          <Select
            id="file-opponentTeamId"
            name="opponentTeamId"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select team
            </option>
            {franchises.map((f) => (
              <option key={f.id} value={f.id}>
                {f.abbreviation} · {f.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="file-userScore">Team A score</Label>
          <Input
            id="file-userScore"
            name="userScore"
            type="number"
            min={0}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file-opponentScore">Team B score</Label>
          <Input
            id="file-opponentScore"
            name="opponentScore"
            type="number"
            min={0}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="file-opponentSimScore">Team B Sim Score</Label>
          <Select
            id="file-opponentSimScore"
            name="opponentSimScore"
            defaultValue="3"
          >
            <option value="5">5 — Elite</option>
            <option value="4">4 — Strong</option>
            <option value="3">3 — Neutral (default)</option>
            <option value="2">2 — Poor (Bad Sim)</option>
            <option value="1">1 — Very poor (Bad Sim)</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="file-userTeamSimScore">Team A Sim Score</Label>
          <Select
            id="file-userTeamSimScore"
            name="userTeamSimScore"
            defaultValue="3"
          >
            <option value="5">5 — Elite</option>
            <option value="4">4 — Strong</option>
            <option value="3">3 — Neutral (default)</option>
            <option value="2">2 — Poor (Bad Sim)</option>
            <option value="1">1 — Very poor (Bad Sim)</option>
          </Select>
        </div>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        Leave both at 3 unless you have Sim Scores from the coaches. 2 or lower
        still feeds Bad Sim reputation.
      </p>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="isPrimetime"
            value="true"
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-semibold">KML Primetime game</span>
            <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
              Check this if this matchup was on the Primetime slate.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="awardXp"
            value="true"
            checked={awardXp}
            onChange={(event) => setAwardXp(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="font-semibold">Award coach XP</span>
            <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
              Both coaches get game-played XP. The winner also gets the win bonus.
              Leave unchecked if they should not earn XP for this filing.
            </span>
          </span>
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-notes">Notes</Label>
        <Textarea
          id="file-notes"
          name="notes"
          placeholder="Optional. Defaults to a commissioner-filed note."
        />
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
        {awardXp ? "Post result (with XP)" : "Post result (no XP)"}
      </SubmitButton>
    </form>
  );
}
