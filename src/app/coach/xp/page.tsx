import { addXpAdjustment } from "@/actions/adjustments";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requireUser, isCommissioner } from "@/lib/auth";
import { getActiveSeason } from "@/lib/league";
import { getXpStandings } from "@/lib/coach/xp-board";
import { prisma } from "@/lib/prisma";

export default async function CoachXpPage() {
  const user = await requireUser();
  const commissioner = isCommissioner(user);
  const { season } = await getActiveSeason();

  const [rows, coaches] = await Promise.all([
    getXpStandings(season.id),
    commissioner
      ? prisma.leagueMembership.findMany({
          where: { seasonId: season.id, isActive: true, user: { deletedAt: null } },
          include: { user: true, franchise: true },
          orderBy: { user: { name: "asc" } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>XP standings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 md:hidden">
            {rows.map((row, index) => (
              <div key={row.userId} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    #{index + 1} {row.coach}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{row.teamAbbr}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  W-L {row.wins}-{row.losses} · Game XP {row.gameXp} · Manual {row.manualXp}
                </p>
                <p className="mt-1 text-sm font-medium">Total XP: {row.totalXp}</p>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted-foreground)]">
              <tr className="border-b">
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Coach</th>
                <th className="py-2 pr-3">Team</th>
                <th className="py-2 pr-3">W-L</th>
                <th className="py-2 pr-3">Game XP</th>
                <th className="py-2 pr-3">Manual XP</th>
                <th className="py-2 pr-3">Total XP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.userId} className="border-b">
                  <td className="py-2 pr-3">#{index + 1}</td>
                  <td className="py-2 pr-3">{row.coach}</td>
                  <td className="py-2 pr-3">{row.teamAbbr}</td>
                  <td className="py-2 pr-3">
                    {row.wins}-{row.losses}
                  </td>
                  <td className="py-2 pr-3">{row.gameXp}</td>
                  <td className="py-2 pr-3">{row.manualXp}</td>
                  <td className="py-2 pr-3 font-medium">{row.totalXp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>

      {commissioner ? (
        <Card>
          <CardHeader>
            <CardTitle>Add XP adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await addXpAdjustment(formData);
              }}
              className="grid gap-3 sm:grid-cols-2 md:grid-cols-4"
            >
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="userId">Coach</Label>
                <Select id="userId" name="userId" required defaultValue="">
                  <option value="" disabled>
                    Select coach
                  </option>
                  {coaches.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name ?? m.user.email} ({m.franchise.abbreviation})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">XP amount</Label>
                <Input id="amount" name="amount" type="number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" name="reason" required />
              </div>
              <div className="md:col-span-4">
                <SubmitButton>Add XP</SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
