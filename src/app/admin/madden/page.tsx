import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";
import { CopyTextButton } from "@/components/admin/copy-text-button";
import { prisma } from "@/lib/prisma";
import { ensureMaddenExportToken, rotateMaddenExportToken } from "@/actions/madden";
import {
  MADDEN_EXPORT_KIND_LABELS,
  maddenExportUrl,
  maddenExploreUrl,
} from "@/lib/madden/companion";

export default async function AdminMaddenPage() {
  const token = await ensureMaddenExportToken();
  const exportUrl = maddenExportUrl(token);
  const exploreUrl = maddenExploreUrl();
  const dumps = await prisma.maddenExportDump.findMany({
    orderBy: { receivedAt: "desc" },
    take: 40,
    select: {
      id: true,
      kind: true,
      path: true,
      platform: true,
      leagueId: true,
      weekType: true,
      weekNumber: true,
      teamId: true,
      dataType: true,
      byteSize: true,
      success: true,
      message: true,
      listCounts: true,
      payloadKeys: true,
      receivedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">
          Madden Companion export
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Paste this URL into the Companion App export field. EA does not publish
          a schema — KML stores every JSON payload the app sends so we can see
          what Madden 27 actually exports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export URL</CardTitle>
          <CardDescription>
            In the app: Play Franchise → your KML franchise → Export. Paste the
            URL, then export League Info, Teams, Schedule, Rosters, Free Agents,
            and Weekly Stats. The app appends its own paths onto this base.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <code className="block min-w-0 flex-1 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs sm:text-sm">
              {exportUrl}
            </code>
            <CopyTextButton value={exportUrl} label="Copy URL" />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Keep this private. Anyone with the URL can post dumps. Rotate if it
            leaks. Exports from the phone must reach this HTTPS URL — localhost
            will not work.
          </p>
          <form
            action={async () => {
              "use server";
              await rotateMaddenExportToken();
            }}
          >
            <SubmitButton variant="outline" size="sm" pendingText="Rotating...">
              Rotate URL
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visualization URL</CardTitle>
          <CardDescription>
            After you export from the app, open this page to see fields, types,
            and sample rows. It does not change standings, games, or rosters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <code className="block min-w-0 flex-1 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-xs sm:text-sm">
              {exploreUrl}
            </code>
            <CopyTextButton value={exploreUrl} label="Copy URL" />
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/madden/explore">Open export lab</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Received dumps</CardTitle>
          <CardDescription>
            Newest first. Open a dump in the lab to see fields and sample rows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dumps.length === 0 ? (
            <EmptyState
              title="Waiting on the first export"
              description="After you tap Export in the Companion App, payloads land here."
            />
          ) : (
            <ul className="space-y-3">
              {dumps.map((dump) => {
                const counts =
                  dump.listCounts &&
                  typeof dump.listCounts === "object" &&
                  !Array.isArray(dump.listCounts)
                    ? Object.entries(dump.listCounts as Record<string, number>)
                        .map(([key, n]) => `${key} ${n}`)
                        .join(" · ")
                    : "";
                return (
                  <li key={dump.id}>
                    <Link
                      href={`/admin/madden/explore?dump=${dump.id}`}
                      className="block rounded-lg border border-[var(--border)] px-3 py-3 text-sm transition-colors hover:bg-[var(--muted)]"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-medium">
                          {MADDEN_EXPORT_KIND_LABELS[dump.kind]}
                          {dump.dataType ? ` · ${dump.dataType}` : ""}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {format(dump.receivedAt, "MMM d, h:mm:ss a")}
                        </p>
                      </div>
                      <p className="mt-1 break-all text-xs text-[var(--muted-foreground)]">
                        {dump.path}
                        {dump.platform ? ` · ${dump.platform}` : ""}
                        {dump.leagueId ? ` · league ${dump.leagueId}` : ""}
                        {dump.weekType
                          ? ` · ${dump.weekType} week ${dump.weekNumber ?? "?"}`
                          : ""}
                        {dump.teamId ? ` · team ${dump.teamId}` : ""}
                        {` · ${(dump.byteSize / 1024).toFixed(1)} KB`}
                      </p>
                      {counts ? (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {counts}
                        </p>
                      ) : dump.payloadKeys.length > 0 ? (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          keys: {dump.payloadKeys.slice(0, 12).join(", ")}
                          {dump.payloadKeys.length > 12 ? "…" : ""}
                        </p>
                      ) : null}
                      {dump.success === false ? (
                        <p className="mt-1 text-xs text-rose-400">
                          App reported failure
                          {dump.message ? `: ${dump.message}` : ""}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
