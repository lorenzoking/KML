import { addCoachLedgerEntry } from "@/actions/coach";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { isCommissioner, requireUser } from "@/lib/auth";
import { getActiveSeason } from "@/lib/league";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  week?: string;
}>;

export default async function CoachReputationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const commissioner = isCommissioner(user);
  const params = await searchParams;
  const q = (params.q ?? "").toLowerCase();
  const category = (params.category ?? "").toUpperCase();
  const week = params.week ? Number(params.week) : undefined;
  const { season } = await getActiveSeason();

  const [repRows, users] = await Promise.all([
    prisma.reputationAdjustment.findMany({
      where: { seasonId: season.id },
      include: { user: true, createdBy: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    commissioner
      ? prisma.leagueMembership.findMany({
          where: { seasonId: season.id, isActive: true, user: { deletedAt: null } },
          include: { user: true, franchise: true },
          orderBy: { user: { name: "asc" } },
        })
      : Promise.resolve([]),
  ]);

  const filtered = repRows.filter((row) => {
    const qMatch =
      !q ||
      (row.user.name ?? row.user.email).toLowerCase().includes(q) ||
      row.reason.toLowerCase().includes(q);
    const categoryMatch = !category || row.category === category;
    const weekMatch = !week || row.week === week;
    return qMatch && categoryMatch && weekMatch;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reputation ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="grid gap-2 sm:grid-cols-3">
            <Input name="q" placeholder="Search coach or reason" defaultValue={params.q ?? ""} />
            <Input name="category" placeholder="Category (CONDUCT, BONUS...)" defaultValue={params.category ?? ""} />
            <Input name="week" type="number" placeholder="Week" defaultValue={params.week ?? ""} />
          </form>
          <div className="space-y-2 md:hidden">
            {filtered.map((row) => (
              <div key={row.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{row.user.name ?? row.user.email}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{row.category}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {format(row.createdAt, "MMM d, h:mm a")} · Week {row.week ?? "—"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Coach {row.amount > 0 ? `+${row.amount}` : row.amount} · GM{" "}
                  {row.gmAmount > 0 ? `+${row.gmAmount}` : row.gmAmount}
                </p>
                <p className="mt-2">{row.reason}</p>
                {row.evidenceUrl ? (
                  <a
                    href={row.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs underline underline-offset-2"
                  >
                    View evidence
                  </a>
                ) : null}
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="text-left text-[var(--muted-foreground)]">
                <tr className="border-b">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Coach</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Week</th>
                  <th className="py-2 pr-3">Coach Rep</th>
                  <th className="py-2 pr-3">GM Rep</th>
                  <th className="py-2 pr-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-2 pr-3">{format(row.createdAt, "MMM d, h:mm a")}</td>
                    <td className="py-2 pr-3">{row.user.name ?? row.user.email}</td>
                    <td className="py-2 pr-3">{row.category}</td>
                    <td className="py-2 pr-3">{row.week ?? "—"}</td>
                    <td className="py-2 pr-3">{row.amount > 0 ? `+${row.amount}` : row.amount}</td>
                    <td className="py-2 pr-3">{row.gmAmount > 0 ? `+${row.gmAmount}` : row.gmAmount}</td>
                    <td className="py-2 pr-3">
                      {row.reason}
                      {row.evidenceUrl ? (
                        <a
                          href={row.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-xs underline underline-offset-2"
                        >
                          evidence
                        </a>
                      ) : null}
                    </td>
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
            <CardTitle>Add reputation/GM/XP entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await addCoachLedgerEntry(formData);
              }}
              className="grid gap-3 sm:grid-cols-2 md:grid-cols-4"
            >
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="userId">Coach</Label>
                <Select id="userId" name="userId" required defaultValue="">
                  <option value="" disabled>
                    Select coach
                  </option>
                  {users.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name ?? m.user.email} ({m.franchise.abbreviation})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Coach rep</Label>
                <Input id="amount" name="amount" type="number" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gmAmount">GM rep</Label>
                <Input id="gmAmount" name="gmAmount" type="number" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xpAmount">XP delta</Label>
                <Input id="xpAmount" name="xpAmount" type="number" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="GENERAL">
                  {[
                    "GENERAL",
                    "CONDUCT",
                    "EXPECTATION",
                    "GAME_MANAGEMENT",
                    "ROSTER",
                    "TANKING",
                    "TRADE",
                    "DRAFT",
                    "OWNERSHIP_REVIEW",
                    "CAROUSEL",
                    "BONUS",
                    "PENALTY",
                  ].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="week">Week</Label>
                <Input id="week" name="week" type="number" />
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" name="reason" required />
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="evidenceUrl">Evidence URL (optional)</Label>
                <Input id="evidenceUrl" name="evidenceUrl" />
              </div>
              <div className="md:col-span-4">
                <SubmitButton>Add entry</SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
