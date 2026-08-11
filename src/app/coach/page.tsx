import Link from "next/link";
import { getActiveSeason } from "@/lib/league";
import { getCoachBoardRows } from "@/lib/coach/coach-board";
import { getXpStandings } from "@/lib/coach/xp-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  conference?: string;
}>;

export default async function CoachOverviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const status = (params.status ?? "").trim().toUpperCase();
  const conference = (params.conference ?? "").trim().toUpperCase();

  const { season, settings } = await getActiveSeason();
  const [rows, xpRows] = await Promise.all([
    getCoachBoardRows(season.id),
    getXpStandings(season.id),
  ]);

  const filtered = rows.filter((row) => {
    const qMatch =
      !q ||
      row.coach.toLowerCase().includes(q) ||
      (row.teamAbbr ?? "").toLowerCase().includes(q) ||
      (row.coachIdentity ?? "").toLowerCase().includes(q);
    const statusMatch = !status || row.jobStatus === status;
    const conferenceMatch = !conference || row.conference === conference;
    return qMatch && statusMatch && conferenceMatch;
  });

  const topXp = xpRows[0];
  const topCoachRep = [...rows].sort((a, b) => b.coachRepScore - a.coachRepScore)[0];
  const hotSeats = rows.filter(
    (r) => r.jobStatus === "HOT_SEAT" || r.jobStatus === "FIRING_ELIGIBLE"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric title="Season" value={`S${settings.currentSeason} · W${settings.currentWeek}`} />
        <Metric title="Tracked coaches" value={String(rows.length)} />
        <Metric title="Hot seat coaches" value={String(hotSeats)} />
        <Metric
          title="Top XP coach"
          value={topXp ? `${topXp.coach} (${topXp.totalXp})` : "No data"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top leaders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              XP Leader:{" "}
              <span className="font-medium">
                {topXp ? `${topXp.coach} (${topXp.teamAbbr})` : "N/A"}
              </span>
            </p>
            <p>
              Coach Rep Leader:{" "}
              <span className="font-medium">
                {topCoachRep ? `${topCoachRep.coach} (${topCoachRep.coachRepScore})` : "N/A"}
              </span>
            </p>
            <p>
              Open Carousel:{" "}
              <span className="font-medium">{settings.carouselOpen ? "Yes" : "No"}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/coach/me" className="rounded-md border px-3 py-2 text-center text-sm">
              My profile
            </Link>
            <Link href="/coach/xp" className="rounded-md border px-3 py-2 text-center text-sm">
              XP standings
            </Link>
            <Link href="/coach/hot-seat" className="rounded-md border px-3 py-2 text-center text-sm">
              Hot seat board
            </Link>
            <Link href="/coach/carousel" className="rounded-md border px-3 py-2 text-center text-sm">
              Carousel
            </Link>
            <Link href="/coach/reputation" className="rounded-md border px-3 py-2 text-center text-sm">
              Reputation log
            </Link>
            <Link
              href="/rules?tab=gm-reputation"
              className="rounded-md border px-3 py-2 text-center text-sm"
            >
              GM Reputation rules
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coach board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-2 sm:grid-cols-3">
            <Input name="q" placeholder="Search coach, team, identity" defaultValue={params.q ?? ""} />
            <Input name="status" placeholder="Status (SECURE, HOT_SEAT...)" defaultValue={params.status ?? ""} />
            <Input name="conference" placeholder="Conference (AFC/NFC)" defaultValue={params.conference ?? ""} />
          </form>
          <div className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <div key={row.userId} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/coach/profiles/${row.userId}`} className="font-medium underline underline-offset-2">
                    {row.coach}
                  </Link>
                  <span className="text-xs text-[var(--muted-foreground)]">{row.teamAbbr}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Record {row.record} · XP {row.xp} · Rep {row.coachRepScore} ({row.coachRepGrade})
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  GM Rep {row.gmRepScore} ({row.gmRepGrade} · {row.gmRepStatus}) ·{" "}
                  {row.jobStatus.replaceAll("_", " ")}
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
                  <th className="py-2 pr-3">Record</th>
                  <th className="py-2 pr-3">XP</th>
                  <th className="py-2 pr-3">Rep</th>
                  <th className="py-2 pr-3">GM Rep</th>
                  <th className="py-2 pr-3">Job Security</th>
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
                    <td className="py-2 pr-3">{row.teamAbbr}</td>
                    <td className="py-2 pr-3">{row.record}</td>
                    <td className="py-2 pr-3">{row.xp}</td>
                    <td className="py-2 pr-3">
                      {row.coachRepScore} ({row.coachRepGrade})
                    </td>
                    <td className="py-2 pr-3">
                      {row.gmRepScore} ({row.gmRepGrade} · {row.gmRepStatus})
                    </td>
                    <td className="py-2 pr-3">{row.jobStatus.replaceAll("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[var(--muted-foreground)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-base font-semibold sm:text-xl">{value}</p>
      </CardContent>
    </Card>
  );
}
