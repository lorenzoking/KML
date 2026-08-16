import Link from "next/link";
import { updateCoachProfile } from "@/actions/coach";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { isCommissioner, requireUser } from "@/lib/auth";
import { getCoachBoardRows } from "@/lib/coach/coach-board";
import { getActiveSeason } from "@/lib/league";

const severity: Record<string, number> = {
  FIRING_ELIGIBLE: 0,
  HOT_SEAT: 1,
  PRESSURED: 2,
  WATCH: 3,
  STABLE: 4,
  SECURE: 5,
};

export default async function CoachHotSeatPage() {
  const user = await requireUser();
  const commissioner = await isCommissioner(user);
  const { season } = await getActiveSeason();
  const rows = await getCoachBoardRows(season.id);
  const ordered = [...rows].sort((a, b) => {
    const rank = (severity[a.jobStatus] ?? 99) - (severity[b.jobStatus] ?? 99);
    if (rank !== 0) return rank;
    return a.coachRepScore - b.coachRepScore;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hot seat board</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ordered.map((row) => (
          <div key={row.userId} className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                <Link href={`/coach/profiles/${row.userId}`} className="underline underline-offset-2">
                  {row.coach}
                </Link>{" "}
                · {row.teamAbbr}
              </p>
              <p className="text-sm">{row.jobStatus.replaceAll("_", " ")}</p>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Rep {row.coachRepScore} ({row.coachRepGrade}) / GM {row.gmRepScore} · Exp {row.expectationScore} ·
              Strikes T{row.tankingStrikes}/G{row.gmStrikes}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{row.jobRecoveryNote}</p>

            {commissioner ? (
              <form
                action={async (formData) => {
                  "use server";
                  await updateCoachProfile(formData);
                }}
                className="mt-3 grid gap-2 md:grid-cols-5"
              >
                <input type="hidden" name="userId" value={row.userId} />
                <input type="hidden" name="contractYearsLeft" value={row.contractYearsLeft} />
                <input type="hidden" name="expectationScore" value={row.expectationScore} />
                <div>
                  <Label htmlFor={`t-${row.userId}`}>Tanking strikes</Label>
                  <Input id={`t-${row.userId}`} name="tankingStrikes" type="number" defaultValue={row.tankingStrikes} />
                </div>
                <div>
                  <Label htmlFor={`g-${row.userId}`}>GM strikes</Label>
                  <Input id={`g-${row.userId}`} name="gmStrikes" type="number" defaultValue={row.gmStrikes} />
                </div>
                <div>
                  <Label htmlFor={`o-${row.userId}`}>Override</Label>
                  <Select id={`o-${row.userId}`} name="hotSeatStatusOverride" defaultValue="">
                    <option value="">Auto</option>
                    {["SECURE", "STABLE", "WATCH", "PRESSURED", "HOT_SEAT", "FIRING_ELIGIBLE"].map(
                      (option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      )
                    )}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`n-${row.userId}`}>Note</Label>
                  <Input id={`n-${row.userId}`} name="hotSeatNote" placeholder="Review note" />
                </div>
                <div className="md:col-span-5">
                  <SubmitButton size="sm">Update status</SubmitButton>
                </div>
              </form>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
