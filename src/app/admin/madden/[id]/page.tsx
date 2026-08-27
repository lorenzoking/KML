import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { MADDEN_EXPORT_KIND_LABELS } from "@/lib/madden/companion";

export default async function MaddenDumpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dump = await prisma.maddenExportDump.findUnique({
    where: { id },
  });
  if (!dump) notFound();

  const counts =
    dump.listCounts &&
    typeof dump.listCounts === "object" &&
    !Array.isArray(dump.listCounts)
      ? Object.entries(dump.listCounts as Record<string, number>)
      : [];

  const pretty = JSON.stringify(dump.payload, null, 2);
  const truncated = pretty.length > 80_000;
  const shown = truncated ? `${pretty.slice(0, 80_000)}\n… truncated` : pretty;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Companion dump
          </p>
          <h2 className="mt-1 text-xl font-semibold uppercase tracking-wide">
            {MADDEN_EXPORT_KIND_LABELS[dump.kind]}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {format(dump.receivedAt, "MMM d, yyyy h:mm:ss a")} · {dump.byteSize}{" "}
            bytes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/madden/explore">Open in lab</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/madden">Back to exports</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route</CardTitle>
          <CardDescription>
            Path the Companion App posted onto the export URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-[var(--muted-foreground)]">Path </span>
            <code>{dump.path}</code>
          </p>
          <p>
            <span className="text-[var(--muted-foreground)]">Platform </span>
            {dump.platform ?? "—"}
            <span className="text-[var(--muted-foreground)]"> · League </span>
            {dump.leagueId ?? "—"}
            {dump.weekType ? (
              <>
                <span className="text-[var(--muted-foreground)]"> · Week </span>
                {dump.weekType} {dump.weekNumber ?? ""}
              </>
            ) : null}
            {dump.teamId ? (
              <>
                <span className="text-[var(--muted-foreground)]"> · Team </span>
                {dump.teamId}
              </>
            ) : null}
            {dump.dataType ? (
              <>
                <span className="text-[var(--muted-foreground)]"> · Type </span>
                {dump.dataType}
              </>
            ) : null}
          </p>
          {dump.success === false ? (
            <p className="text-rose-400">
              App message: {dump.message || "Export error"}
            </p>
          ) : dump.message ? (
            <p className="text-[var(--muted-foreground)]">{dump.message}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What’s inside</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {counts.length > 0 ? (
            <ul className="space-y-1">
              {counts.map(([key, n]) => (
                <li key={key}>
                  <code>{key}</code> — {n} rows
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[var(--muted-foreground)]">
              No known list fields. Keys:{" "}
              {dump.payloadKeys.length > 0 ? dump.payloadKeys.join(", ") : "none"}
            </p>
          )}
          {dump.payloadKeys.length > 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              All keys: {dump.payloadKeys.join(", ")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw JSON</CardTitle>
          <CardDescription>
            Stored as sent by the app. Use this to map Madden 27 fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[32rem] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs leading-relaxed">
            {shown}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
