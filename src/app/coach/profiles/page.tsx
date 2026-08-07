import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getActiveSeason } from "@/lib/league";
import { getCoachBoardRows } from "@/lib/coach/coach-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<{ q?: string }>;

export default async function CoachProfilesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const params = await searchParams;
  const q = (params.q ?? "").toLowerCase();
  const { season } = await getActiveSeason();
  const rows = await getCoachBoardRows(season.id);
  const filtered = rows.filter(
    (r) =>
      !q ||
      r.coach.toLowerCase().includes(q) ||
      (r.teamAbbr ?? "").toLowerCase().includes(q) ||
      (r.coachIdentity ?? "").toLowerCase().includes(q)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Coach profiles</CardTitle>
        <Link
          href="/coach/me"
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Edit my profile
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <form>
          <Input name="q" defaultValue={params.q ?? ""} placeholder="Search coach or team" />
        </form>
        <div className="space-y-2 md:hidden">
          {filtered.map((row) => (
            <div key={row.userId} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/coach/profiles/${row.userId}`} className="font-medium underline underline-offset-2">
                  {row.coach}
                </Link>
                <span className="text-xs text-[var(--muted-foreground)]">{row.teamAbbr ?? "—"}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Coach identity: {row.coachIdentity ?? "Unassigned"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Team identity: {row.teamIdentity ?? "Unassigned"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Contract {row.contractYearsLeft}y · {row.jobStatus.replaceAll("_", " ")}
              </p>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="text-left text-[var(--muted-foreground)]">
              <tr className="border-b">
                <th className="py-2 pr-3">Coach</th>
                <th className="py-2 pr-3">Team</th>
                <th className="py-2 pr-3">Coach Identity</th>
                <th className="py-2 pr-3">Team Identity</th>
                <th className="py-2 pr-3">Contract</th>
                <th className="py-2 pr-3">Hot Seat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.userId} className="border-b">
                  <td className="py-2 pr-3">
                    <Link href={`/coach/profiles/${row.userId}`} className="underline underline-offset-2">
                      {row.coach}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{row.teamAbbr ?? "—"}</td>
                  <td className="py-2 pr-3">{row.coachIdentity ?? "Unassigned"}</td>
                  <td className="py-2 pr-3">{row.teamIdentity ?? "Unassigned"}</td>
                  <td className="py-2 pr-3">{row.contractYearsLeft}y</td>
                  <td className="py-2 pr-3">{row.jobStatus.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
