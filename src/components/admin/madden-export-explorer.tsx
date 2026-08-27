"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatLeagueDate } from "@/lib/datetime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { DumpPreview, KindSummary } from "@/lib/madden/preview";

export function MaddenExportExplorer({
  dumps,
  summaries,
  initialDumpId,
}: {
  dumps: DumpPreview[];
  summaries: KindSummary[];
  initialDumpId?: string;
}) {
  const initial =
    initialDumpId && dumps.some((dump) => dump.id === initialDumpId)
      ? dumps.find((dump) => dump.id === initialDumpId) ?? null
      : dumps[0] ?? null;
  const [kind, setKind] = useState<string>(initial?.kind ?? "ALL");
  const [dumpId, setDumpId] = useState<string>(initial?.id ?? "");
  const [fieldQuery, setFieldQuery] = useState("");

  const visibleDumps = useMemo(
    () => (kind === "ALL" ? dumps : dumps.filter((dump) => dump.kind === kind)),
    [dumps, kind]
  );

  const selected =
    visibleDumps.find((dump) => dump.id === dumpId) ?? visibleDumps[0] ?? null;

  const fieldFilter = fieldQuery.trim().toLowerCase();

  if (dumps.length === 0) {
    return (
      <EmptyState
        title="No exports yet"
        description="Paste the export URL in the Companion App, tap Export, then refresh this page."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dumps received</CardDescription>
            <CardTitle className="text-2xl">{dumps.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rows across lists</CardDescription>
            <CardTitle className="text-2xl">
              {summaries.reduce((sum, item) => sum + item.rowCount, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payload types</CardDescription>
            <CardTitle className="text-2xl">{summaries.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setKind("ALL");
            setDumpId(dumps[0]?.id ?? "");
          }}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            kind === "ALL"
              ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)]"
              : "border-[var(--border)] hover:bg-[var(--muted)]"
          }`}
        >
          All
        </button>
        {summaries.map((item) => (
          <button
            key={item.kind}
            type="button"
            onClick={() => {
              setKind(item.kind);
              const next = dumps.find((dump) => dump.kind === item.kind);
              setDumpId(next?.id ?? "");
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              kind === item.kind
                ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            {item.label} · {item.rowCount} rows
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What arrived</CardTitle>
          <CardDescription>
            Each Companion POST is stored raw. Open a dump to inspect fields and a
            sample table. Nothing here writes to standings, games, or rosters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="text-[var(--muted-foreground)]">Payload</span>
              <Select
                value={selected?.id ?? ""}
                onChange={(event) => setDumpId(event.target.value)}
              >
                {visibleDumps.map((dump) => (
                  <option key={dump.id} value={dump.id}>
                    {dump.kindLabel}
                    {dump.dataType ? ` · ${dump.dataType}` : ""}
                    {dump.weekLabel ? ` · ${dump.weekLabel}` : ""}
                    {dump.teamId ? ` · team ${dump.teamId}` : ""}{" "}
                    — {formatLeagueDate(dump.receivedAt, "h:mm:ss a")}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-[var(--muted-foreground)]">Filter fields</span>
              <Input
                value={fieldQuery}
                onChange={(event) => setFieldQuery(event.target.value)}
                placeholder="Search field names…"
              />
            </label>
          </div>

          {selected ? (
            <DumpDetail dump={selected} fieldFilter={fieldFilter} />
          ) : (
            <EmptyState title="No dumps in this filter" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DumpDetail({
  dump,
  fieldFilter,
}: {
  dump: DumpPreview;
  fieldFilter: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{dump.kindLabel}</h3>
            {dump.dataType ? <Badge variant="outline">{dump.dataType}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{dump.hint}</p>
          <p className="mt-2 break-all text-xs text-[var(--muted-foreground)]">
            {dump.path}
            {dump.platform ? ` · ${dump.platform}` : ""}
            {dump.leagueId ? ` · league ${dump.leagueId}` : ""}
            {dump.weekLabel ? ` · ${dump.weekLabel}` : ""}
            {dump.teamId ? ` · team ${dump.teamId}` : ""}
            {` · ${(dump.byteSize / 1024).toFixed(1)} KB`}
            {` · ${formatLeagueDate(dump.receivedAt, "MMM d, h:mm:ss a")}`}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/madden/${dump.id}`}>Raw JSON</Link>
        </Button>
      </div>

      {dump.scalarFields.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Envelope fields
          </p>
          <div className="flex flex-wrap gap-2">
            {dump.scalarFields.map((field) => (
              <span
                key={field.name}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs"
              >
                <span className="text-[var(--muted-foreground)]">{field.name}</span>{" "}
                {field.value}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {dump.lists.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          This payload has no arrays to tabulate.
        </p>
      ) : (
        dump.lists.map((list) => {
          const fields = fieldFilter
            ? list.fields.filter((field) =>
                field.name.toLowerCase().includes(fieldFilter)
              )
            : list.fields;
          return (
            <section key={list.key} className="space-y-3">
              <div>
                <h4 className="font-medium">
                  <code>{list.key}</code>
                </h4>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {list.rowCount} rows · {list.fields.length} fields
                  {list.fields.length > list.sampleColumns.length
                    ? ` · sample table shows ${list.sampleColumns.length} of ${list.fields.length} columns`
                    : ""}
                </p>
              </div>

              {fields.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Filled</TableHead>
                      <TableHead>Examples from this dump</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => (
                      <TableRow key={field.name}>
                        <TableCell className="font-mono text-xs">
                          {field.name}
                        </TableCell>
                        <TableCell className="text-xs text-[var(--muted-foreground)]">
                          {field.types.join(", ")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {field.total > 0
                            ? `${field.filled}/${field.total}`
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-md text-xs text-[var(--muted-foreground)]">
                          {field.examples.join(" · ") || "empty"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No fields match that filter.
                </p>
              )}

              {list.sampleRows.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Sample rows
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {list.sampleColumns.map((column) => (
                          <TableHead key={column} className="whitespace-nowrap">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.sampleRows.map((row, index) => (
                        <TableRow key={`${list.key}-${index}`}>
                          {list.sampleColumns.map((column) => (
                            <TableCell
                              key={column}
                              className="whitespace-nowrap text-xs"
                            >
                              {row[column] ?? "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </section>
          );
        })
      )}
    </div>
  );
}
