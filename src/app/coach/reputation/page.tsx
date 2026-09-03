import { addCoachLedgerEntry } from "@/actions/coach";
import { ReputationStandings } from "@/components/coach/reputation-standings";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ReputationCategory } from "@/generated/prisma/client";
import { isCommissioner, requireUser } from "@/lib/auth";
import { getCoachBoardRows } from "@/lib/coach/coach-board";
import { displayCoachName } from "@/lib/coach/display-name";
import { getActiveSeason } from "@/lib/league";
import { COACHING_REP_GRADES } from "@/lib/hot-seat-rules";
import { prisma } from "@/lib/prisma";
import { formatLeagueDate } from "@/lib/datetime";
import Link from "next/link";

const LEDGER_CATEGORIES = Object.values(ReputationCategory);

type SearchParams = Promise<{
  q?: string;
  userId?: string;
  category?: string;
  week?: string;
}>;

export default async function CoachReputationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const commissioner = await isCommissioner(user);
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const selectedUserId = (params.userId ?? "").trim();
  const category = (params.category ?? "").trim().toUpperCase();
  const weekNumber = params.week ? Number(params.week) : NaN;
  const week = Number.isInteger(weekNumber) && weekNumber > 0 ? weekNumber : undefined;
  const categoryFilter = LEDGER_CATEGORIES.includes(category as ReputationCategory)
    ? (category as ReputationCategory)
    : undefined;
  const { season } = await getActiveSeason();

  const [users, board] = await Promise.all([
    commissioner
      ? prisma.leagueMembership.findMany({
          where: { seasonId: season.id, isActive: true, user: { deletedAt: null } },
          include: { user: true, franchise: true },
          orderBy: { user: { name: "asc" } },
        })
      : Promise.resolve([]),
    getCoachBoardRows(season.id),
  ]);

  const coaches = [...board].sort((a, b) => a.coach.localeCompare(b.coach));
  const matchingCoachIds = selectedUserId
    ? [selectedUserId]
    : q
      ? coaches
          .filter((row) => {
            const haystack = [
              row.coach,
              row.team,
              row.teamAbbr,
              row.coachIdentity,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return haystack.includes(q);
          })
          .map((row) => row.userId)
      : [];

  const filtered = await prisma.reputationAdjustment.findMany({
    where: {
      seasonId: season.id,
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(week ? { week } : {}),
      ...(selectedUserId
        ? {
            userId: selectedUserId,
            ...(q ? { reason: { contains: q, mode: "insensitive" as const } } : {}),
          }
        : q
          ? {
              OR: [
                ...(matchingCoachIds.length
                  ? [{ userId: { in: matchingCoachIds } }]
                  : []),
                { reason: { contains: q, mode: "insensitive" as const } },
                { user: { name: { contains: q, mode: "insensitive" as const } } },
              ],
            }
          : {}),
    },
    include: { user: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  const selectedCoach = coaches.find((row) => row.userId === selectedUserId);
  const hasFilters = Boolean(q || selectedUserId || categoryFilter || week);
  const coachByUserId = new Map(coaches.map((row) => [row.userId, row]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coach reputation standings</CardTitle>
          <CardDescription>
            Ranked by live coaching reputation. Grade follows the coach, not the franchise.
            Sim is the average Sim Score this coach has received this season.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReputationStandings rows={board} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coaching Reputation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>
              Live rating that follows the coach, not the franchise. Everyone starts at 85 (B).
              Normal wins and losses do not move it — only noteworthy results, Primetime,
              streaks, blowouts, and season trajectory. Bad Sim still uses category{" "}
              <span className="font-medium text-[var(--foreground)]">SIM_SCORE</span>.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COACHING_REP_GRADES.map((band) => (
                <Badge key={band.label} variant="outline">
                  {band.label} {band.range} · {band.detail}
                </Badge>
              ))}
            </div>
            <Link href="/rules?tab=hot-seat" className="inline-block text-sm font-medium text-[var(--primary)] hover:underline">
              Coaching Reputation & Hot Seat rules
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>GM Reputation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>
              Front-office standing: High (80+), Neutral (65–79), Low (below 65). Low GM
              rep means trade review, first-round pick votes, and extra scrutiny.
            </p>
            <Link href="/rules?tab=gm-reputation" className="inline-block text-sm font-medium text-[var(--primary)] hover:underline">
              GM Reputation rules
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reputation ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form method="get" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Select name="userId" defaultValue={selectedUserId} aria-label="Coach">
              <option value="">All coaches</option>
              {coaches.map((row) => (
                <option key={row.userId} value={row.userId}>
                  {row.coach}
                  {row.teamAbbr ? ` · ${row.teamAbbr}` : ""}
                </option>
              ))}
            </Select>
            <Input
              name="q"
              placeholder="Search name, team, or reason"
              defaultValue={params.q ?? ""}
            />
            <Select name="category" defaultValue={categoryFilter ?? ""} aria-label="Category">
              <option value="">All categories</option>
              {LEDGER_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Input
              name="week"
              type="number"
              min={1}
              placeholder="Week"
              defaultValue={week ? String(week) : ""}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Search
              </Button>
              {hasFilters ? (
                <Button asChild variant="outline">
                  <Link href="/coach/reputation">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>
          <p className="text-xs text-[var(--muted-foreground)]">
            {filtered.length === 0
              ? hasFilters
                ? "No ledger entries match those filters."
                : "No ledger entries this season."
              : selectedCoach
                ? `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"} for ${selectedCoach.coach}`
                : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`}
          </p>
          <div className="space-y-2 md:hidden">
            {filtered.map((row) => {
              const coach = coachByUserId.get(row.userId);
              const name = coach?.coach ?? displayCoachName(row.user);
              return (
              <div key={row.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    <Link
                      href={`/coach/profiles/${row.userId}`}
                      className="hover:underline"
                    >
                      {name}
                    </Link>
                    {coach?.teamAbbr ? (
                      <span className="ml-1.5 text-xs font-normal text-[var(--muted-foreground)]">
                        {coach.teamAbbr}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">{row.category}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {formatLeagueDate(row.createdAt, "MMM d, h:mm a")} · Week {row.week ?? "—"}
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
              );
            })}
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
                {filtered.map((row) => {
                  const coach = coachByUserId.get(row.userId);
                  const name = coach?.coach ?? displayCoachName(row.user);
                  return (
                  <tr key={row.id} className="border-b">
                    <td className="py-2 pr-3">{formatLeagueDate(row.createdAt, "MMM d, h:mm a")}</td>
                    <td className="py-2 pr-3">
                      <Link
                        href={`/coach/profiles/${row.userId}`}
                        className="font-medium hover:underline"
                      >
                        {name}
                      </Link>
                      {coach?.teamAbbr ? (
                        <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">
                          {coach.teamAbbr}
                        </span>
                      ) : null}
                    </td>
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
                  );
                })}
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
                      {m.user.name?.trim() || "Unnamed coach"} (
                      {m.franchise.abbreviation})
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
                  {LEDGER_CATEGORIES.map((option) => (
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
