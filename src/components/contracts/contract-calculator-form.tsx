"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logContractSigning } from "@/actions/contracts";
import { OfferGuidancePanel } from "@/components/contracts/contract-offer-guidance";
import { ContractResultPanel } from "@/components/contracts/contract-result-panel";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateOfferGuidance, calculateSigning } from "@/lib/contracts/calculator";
import {
  CONTRACT_POSITIONS,
  CONTRACT_PLAYER_TIERS,
  POSITION_LABELS,
  TIER_HELP,
  TIER_LABELS,
  type CalculatorInput,
  type ContractPosition,
  type ContractPlayerTier,
  type ContractRules,
  type MaddenInputs,
  type MarketComp,
} from "@/lib/contracts/types";

type FranchiseOption = { id: string; name: string; abbreviation: string };

function parseNum(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function ContractCalculatorForm({
  comps,
  rules,
  franchises,
  defaultFranchiseId,
  canLog,
  isCommissioner,
}: {
  comps: MarketComp[];
  rules: ContractRules;
  franchises: FranchiseOption[];
  defaultFranchiseId?: string | null;
  canLog: boolean;
  isCommissioner: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [position, setPosition] = useState<ContractPosition>("WR");
  const [playerTier, setPlayerTier] = useState<ContractPlayerTier>("STARTER");
  const [yearsRemaining, setYearsRemaining] = useState("0");
  const [remainingDealApy, setRemainingDealApy] = useState("");
  const [asSignedLength, setAsSignedLength] = useState("");
  const [asSignedTotalSalary, setAsSignedTotalSalary] = useState("");
  const [asSignedSigningBonus, setAsSignedSigningBonus] = useState("");
  const [franchiseId, setFranchiseId] = useState(defaultFranchiseId ?? "");

  const comp = comps.find((row) => row.position === position) ?? comps[0];
  const remainingYears = parseNum(yearsRemaining) ?? 0;
  const remainingApy = parseNum(remainingDealApy);

  const offers = useMemo(() => {
    if (!comp) return null;
    return calculateOfferGuidance(
      {
        playerName: playerName.trim(),
        position,
        playerTier,
        yearsRemaining: remainingYears,
        remainingDealApy: remainingApy,
      },
      comp,
      rules
    );
  }, [comp, playerName, playerTier, position, remainingApy, remainingYears, rules]);

  const input: CalculatorInput | null = useMemo(() => {
    const length = parseNum(asSignedLength);
    const total = parseNum(asSignedTotalSalary);
    if (length == null || length < 1 || total == null || total < 0) return null;
    return {
      playerName: playerName.trim(),
      position,
      playerTier,
      yearsRemaining: remainingYears,
      remainingDealApy: remainingApy,
      asSignedLength: Math.round(length),
      asSignedTotalSalary: total,
      asSignedSigningBonus: parseNum(asSignedSigningBonus) ?? 0,
    };
  }, [
    playerName,
    position,
    playerTier,
    remainingYears,
    remainingApy,
    asSignedLength,
    asSignedTotalSalary,
    asSignedSigningBonus,
  ]);

  const calc = useMemo(() => {
    if (!input || !comp) return null;
    return calculateSigning(input, comp, rules, rules.defaultSevereResolution);
  }, [input, comp, rules]);

  const team = franchises.find((f) => f.id === franchiseId);

  function fillAsSigned(deal: MaddenInputs) {
    setAsSignedLength(String(deal.length));
    setAsSignedTotalSalary(String(deal.totalSalary));
    setAsSignedSigningBonus(String(deal.signingBonus));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <Card className="lg:sticky lg:top-20">
        <CardHeader className="pb-3">
          <CardTitle>Player & offer</CardTitle>
          <CardDescription>
            Pick position and tier. The calculator suggests a realistic Madden
            Edit Player contract from named NFL comps. Paste as-signed only when
            logging what they typed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                const result = await logContractSigning(formData);
                if (result?.error) setError(result.error);
                else if (result?.signingId) router.push(`/contracts/${result.signingId}`);
              });
            }}
          >
            <Field label="Player name" htmlFor="playerName">
              <Input
                id="playerName"
                name="playerName"
                required
                autoComplete="off"
                placeholder="Ja'Marr Chase"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Position" htmlFor="position">
                <Select
                  id="position"
                  name="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value as ContractPosition)}
                >
                  {CONTRACT_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos} · {POSITION_LABELS[pos]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Player tier" htmlFor="playerTier">
                <Select
                  id="playerTier"
                  name="playerTier"
                  value={playerTier}
                  onChange={(e) => setPlayerTier(e.target.value as ContractPlayerTier)}
                >
                  {CONTRACT_PLAYER_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {TIER_LABELS[tier]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">{TIER_HELP[playerTier]}</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Years left on current deal" htmlFor="yearsRemaining">
                <Input
                  id="yearsRemaining"
                  name="yearsRemaining"
                  type="number"
                  min={0}
                  max={10}
                  value={yearsRemaining}
                  onChange={(e) => setYearsRemaining(e.target.value)}
                />
              </Field>
              <Field label="Remaining APY ($M)" htmlFor="remainingDealApy">
                <Input
                  id="remainingDealApy"
                  name="remainingDealApy"
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder="Blank = rookie estimate"
                  value={remainingDealApy}
                  onChange={(e) => setRemainingDealApy(e.target.value)}
                />
              </Field>
            </div>

            <p className="pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              What they typed in Madden
            </p>
            <p className="-mt-2 text-xs text-[var(--muted-foreground)]">
              Millions (170 = $170M). Needed to log; skip it to just shop an offer.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Length" htmlFor="asSignedLength">
                <Input
                  id="asSignedLength"
                  name="asSignedLength"
                  type="number"
                  min={1}
                  max={10}
                  required
                  placeholder="4"
                  value={asSignedLength}
                  onChange={(e) => setAsSignedLength(e.target.value)}
                />
              </Field>
              <Field label="Total salary" htmlFor="asSignedTotalSalary">
                <Input
                  id="asSignedTotalSalary"
                  name="asSignedTotalSalary"
                  type="number"
                  step="0.1"
                  min={0}
                  required
                  placeholder="170"
                  value={asSignedTotalSalary}
                  onChange={(e) => setAsSignedTotalSalary(e.target.value)}
                />
              </Field>
              <Field label="Sign bonus" htmlFor="asSignedSigningBonus">
                <Input
                  id="asSignedSigningBonus"
                  name="asSignedSigningBonus"
                  type="number"
                  step="0.1"
                  min={0}
                  placeholder="0"
                  value={asSignedSigningBonus}
                  onChange={(e) => setAsSignedSigningBonus(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Signing team" htmlFor="franchiseId">
              <Select
                id="franchiseId"
                name="franchiseId"
                required={canLog}
                value={franchiseId}
                onChange={(e) => setFranchiseId(e.target.value)}
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
            </Field>

            {canLog ? (
              <Field label="Note (optional)" htmlFor="notes">
                <Textarea id="notes" name="notes" rows={2} placeholder="FA period, offer sheet, etc." />
              </Field>
            ) : null}

            {comp ? (
              <p className="rounded-xl bg-[var(--muted)]/40 px-3 py-2 text-xs text-[var(--muted-foreground)]">
                {`${position} comps: elite ${comp.marketSetterName ?? "market-setter"} $${comp.topOfMarketApy.toFixed(1)}M · starter ${comp.starterCompName ?? "floor"} $${comp.starterFloorApy.toFixed(1)}M · typical ${comp.typicalLengthYears} yr · bonus ${Math.round(comp.typicalBonusRatio * 100)}%`}
              </p>
            ) : null}

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            {canLog ? (
              <SubmitButton pendingText="Logging..." disabled={pending} className="w-full">
                Log signing to league history
              </SubmitButton>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                {isCommissioner
                  ? "Sign in as commissioner to log."
                  : "Sign in and get assigned a team to log a signing. You can still run the numbers."}
              </p>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setPlayerName("");
                setYearsRemaining("0");
                setRemainingDealApy("");
                setAsSignedLength("");
                setAsSignedTotalSalary("");
                setAsSignedSigningBonus("");
              }}
            >
              Clear numbers
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {offers ? (
          <OfferGuidancePanel
            offers={offers}
            playerName={playerName.trim()}
            position={position}
            teamAbbr={team?.abbreviation}
            asSigned={
              calc && input
                ? { apy: calc.asSignedApy, length: input.asSignedLength }
                : null
            }
            longContractYears={rules.longContractYears}
            onUseNumbers={fillAsSigned}
          />
        ) : null}
        {calc && input ? (
          <ContractResultPanel calc={calc} input={input} teamAbbr={team?.abbreviation} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>As-signed verdict</CardTitle>
              <CardDescription>
                Length and total salary appear once you type them or fill from the
                Madden suggestion. That checks the placeholder against market and
                shows the penalty if they went long and inflated.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
