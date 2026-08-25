import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";
import { updateAllPositionComps, updateContractRules } from "@/actions/contracts";
import { getContractDesk } from "@/lib/contracts/ensure";
import { POSITION_LABELS } from "@/lib/contracts/types";
import { format } from "date-fns";

export default async function AdminContractsPage() {
  const desk = await getContractDesk();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">
          Contract desk
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Paste current Spotrac numbers here. There is no public API — update these
          when the market moves. Last rules save{" "}
          {format(desk.rulesUpdatedAt, "MMM d, yyyy")}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Penalty & Madden caps</CardTitle>
          <CardDescription>
            Overpay ratio = as-signed APY ÷ market-value APY. Length 7+ is an automatic
            minor flag even when APY looks fine. Penalty deals always cut years and pack
            more total money into that shorter term — they tried to buy long, cheap
            control, so they get short, expensive control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await updateContractRules(formData);
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Num
                name="maxContractLength"
                label="Max length (yrs)"
                defaultValue={desk.rules.maxContractLength}
              />
              <Num
                name="minContractLength"
                label="Min length (yrs)"
                defaultValue={desk.rules.minContractLength}
              />
              <Num
                name="maxTotalSalaryMillions"
                label="Max total salary ($M)"
                defaultValue={desk.rules.maxTotalSalaryMillions}
                step="1"
              />
              <Num
                name="maxSigningBonusMillions"
                label="Max signing bonus ($M)"
                defaultValue={desk.rules.maxSigningBonusMillions}
                step="1"
              />
              <Num
                name="longContractYears"
                label="Long-deal flag (yrs)"
                defaultValue={desk.rules.longContractYears}
              />
              <Num
                name="overpayNoneMax"
                label="Good-faith max (x)"
                defaultValue={desk.rules.overpayNoneMax}
                step="0.01"
              />
              <Num
                name="overpayMinorMax"
                label="Minor max (x)"
                defaultValue={desk.rules.overpayMinorMax}
                step="0.01"
              />
              <Num
                name="overpayModerateMax"
                label="Severe starts at (x)"
                defaultValue={desk.rules.overpayModerateMax}
                step="0.01"
              />
              <Num
                name="moderateMarketMultiplier"
                label="Moderate extra total (× market deal)"
                defaultValue={desk.rules.moderateMarketMultiplier}
                step="0.01"
              />
              <Num
                name="severeMarketMultiplier"
                label="Severe extra total (× market deal)"
                defaultValue={desk.rules.severeMarketMultiplier}
                step="0.01"
              />
              <Num
                name="capPenaltyPercentOfOverage"
                label="Cap penalty % of overage"
                defaultValue={desk.rules.capPenaltyPercentOfOverage}
              />
              <Num
                name="rookieScaleFallbackRatio"
                label="Rookie APY fallback (× floor)"
                defaultValue={desk.rules.rookieScaleFallbackRatio}
                step="0.01"
              />
              <Num
                name="depthMarketRatio"
                label="Depth APY (× floor)"
                defaultValue={desk.rules.depthMarketRatio}
                step="0.01"
              />
              <div className="space-y-1.5">
                <Label htmlFor="defaultSevereResolution">Severe default</Label>
                <Select
                  id="defaultSevereResolution"
                  name="defaultSevereResolution"
                  defaultValue={desk.rules.defaultSevereResolution}
                >
                  <option value="PENDING">Commissioner chooses each case</option>
                  <option value="VOID_SIGNING">Always void signing rights</option>
                  <option value="STEEP_BELOW_MARKET">
                    Always keep player: fewer years, more money
                  </option>
                </Select>
              </div>
            </div>
            <SubmitButton>Save penalty rules</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spotrac positional comps</CardTitle>
          <CardDescription>
            Top APY = market-setter. Starter floor = median/floor for a starter-tier
            player. Bonus % is typical signing-bonus / total-salary. Percents are 0–100.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await updateAllPositionComps(formData);
            }}
            className="space-y-4"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[64rem] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="p-2">Pos</th>
                    <th className="p-2">Market-setter</th>
                    <th className="p-2">Top APY</th>
                    <th className="p-2">Starter floor</th>
                    <th className="p-2">Bonus %</th>
                    <th className="p-2">Yrs</th>
                    <th className="p-2">GTD %</th>
                    <th className="p-2">Source note</th>
                  </tr>
                </thead>
                <tbody>
                  {desk.comps.map((comp) => (
                    <tr key={comp.position} className="border-t border-[var(--border)]">
                      <td className="p-2 align-top font-semibold">
                        {comp.position}
                        <p className="text-[11px] font-normal text-[var(--muted-foreground)]">
                          {POSITION_LABELS[comp.position]}
                        </p>
                      </td>
                      <td className="p-2">
                        <Input
                          name={`${comp.position}_marketSetterName`}
                          defaultValue={comp.marketSetterName ?? ""}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          name={`${comp.position}_topOfMarketApy`}
                          type="number"
                          step="0.01"
                          required
                          defaultValue={comp.topOfMarketApy}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          name={`${comp.position}_starterFloorApy`}
                          type="number"
                          step="0.01"
                          required
                          defaultValue={comp.starterFloorApy}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          name={`${comp.position}_typicalBonusPercent`}
                          type="number"
                          step="1"
                          required
                          defaultValue={Math.round(comp.typicalBonusRatio * 100)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          name={`${comp.position}_typicalLengthYears`}
                          type="number"
                          required
                          defaultValue={comp.typicalLengthYears}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          name={`${comp.position}_guaranteePercent`}
                          type="number"
                          step="1"
                          defaultValue={
                            comp.guaranteePercent == null
                              ? ""
                              : Math.round(comp.guaranteePercent * 100)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          name={`${comp.position}_sourceNote`}
                          defaultValue={comp.sourceNote ?? ""}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SubmitButton>Save Spotrac comps</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Num({
  name,
  label,
  defaultValue,
  step,
}: {
  name: string;
  label: string;
  defaultValue: number;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        step={step ?? "1"}
        required
        defaultValue={defaultValue}
      />
    </div>
  );
}
