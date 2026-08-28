import { MaddenExportKind } from "@/generated/prisma/client";
import {
  displayCompanionWeek,
  MADDEN_EXPORT_KIND_LABELS,
  weekIndexFromPayload,
} from "@/lib/madden/companion";

export const KIND_USE_HINTS: Record<MaddenExportKind, string> = {
  LEAGUE_TEAMS:
    "Team identity — names, abbreviations, conference/division. Could later fill the team directory.",
  STANDINGS:
    "Records and ranks — wins, losses, conference/division. Could later fill standings.",
  SCHEDULE:
    "Matchups and scores by week. Fills open games on the site when Madden already has the score.",
  TEAM_STATS:
    "Team-level weekly stats. Could later power box-score summaries.",
  PLAYER_STATS:
    "Player weekly stats (passing, rushing, receiving, defense, kicking). Could later power leaderboards.",
  TEAM_ROSTER:
    "Players, ratings, positions, contracts. Could later power rosters and the contract desk.",
  FREE_AGENTS:
    "Unsigned players. Could later power a free-agent board.",
  UNKNOWN:
    "Unrecognized payload. Kept raw so new Madden 27 endpoints are still visible.",
};

const SAMPLE_ROW_LIMIT = 8;
const SAMPLE_COLUMN_LIMIT = 14;
const EXAMPLE_LIMIT = 3;
const VALUE_CHAR_LIMIT = 72;
const SCHEMA_ROW_LIMIT = 40;

export type FieldProfile = {
  name: string;
  types: string[];
  examples: string[];
  filled: number;
  total: number;
};

export type ListPreview = {
  key: string;
  rowCount: number;
  fields: FieldProfile[];
  sampleColumns: string[];
  sampleRows: Array<Record<string, string>>;
};

export type DumpPreview = {
  id: string;
  kind: MaddenExportKind;
  kindLabel: string;
  hint: string;
  path: string;
  platform: string | null;
  leagueId: string | null;
  weekType: string | null;
  weekNumber: number | null;
  teamId: string | null;
  dataType: string | null;
  weekLabel: string | null;
  byteSize: number;
  receivedAt: string;
  lists: ListPreview[];
  scalarFields: Array<{ name: string; value: string }>;
};

export type KindSummary = {
  kind: MaddenExportKind;
  label: string;
  dumpCount: number;
  rowCount: number;
  newestAt: string | null;
};

function valueType(value: unknown): string {
  if (value == null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function stringifyValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") {
    return value.length > VALUE_CHAR_LIMIT
      ? `${value.slice(0, VALUE_CHAR_LIMIT)}…`
      : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    const json = JSON.stringify(value);
    return json.length > VALUE_CHAR_LIMIT
      ? `${json.slice(0, VALUE_CHAR_LIMIT)}…`
      : json;
  } catch {
    return String(value);
  }
}

function columnScore(name: string): number {
  const n = name.toLowerCase();
  if (
    /displayname|teamname|firstname|lastname|fullname|playername/.test(n)
  ) {
    return 100;
  }
  if (/^(wins|losses|ties|winpct|homescore|awayscore|score)$/.test(n)) return 92;
  if (/position|overall|ovr|jersey/.test(n)) return 88;
  if (/abbr|city|nick|conference|division|divname/.test(n)) return 84;
  if (/week|schedule|status/.test(n)) return 78;
  if (/salary|caphit|contract|devtrait|age|yearspro/.test(n)) return 74;
  if (/teamid|rosterid|playerid|scheduleid/.test(n)) return 70;
  if (/id$/.test(n)) return 40;
  if (/logo|color|scheme/.test(n)) return 36;
  return 12;
}

function profileList(key: string, rows: unknown[]): ListPreview {
  const objects = rows
    .slice(0, SCHEMA_ROW_LIMIT)
    .filter((row): row is Record<string, unknown> =>
      Boolean(row) && typeof row === "object" && !Array.isArray(row)
    );
  const names = new Set<string>();
  for (const row of objects) {
    for (const name of Object.keys(row)) names.add(name);
  }

  const fields: FieldProfile[] = [...names]
    .sort((a, b) => columnScore(b) - columnScore(a) || a.localeCompare(b))
    .map((name) => {
      const types = new Set<string>();
      const examples: string[] = [];
      let filled = 0;
      for (const row of objects) {
        if (!(name in row)) continue;
        const value = row[name];
        types.add(valueType(value));
        if (value != null && value !== "") {
          filled += 1;
          const shown = stringifyValue(value);
          if (examples.length < EXAMPLE_LIMIT && !examples.includes(shown)) {
            examples.push(shown);
          }
        }
      }
      return {
        name,
        types: [...types].sort(),
        examples,
        filled,
        total: objects.length,
      };
    });

  const sampleColumns = fields.slice(0, SAMPLE_COLUMN_LIMIT).map((field) => field.name);
  const sampleRows = rows.slice(0, SAMPLE_ROW_LIMIT).map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { value: stringifyValue(row) };
    }
    const record = row as Record<string, unknown>;
    const sample: Record<string, string> = {};
    for (const column of sampleColumns) {
      sample[column] = stringifyValue(record[column]);
    }
    return sample;
  });

  return {
    key,
    rowCount: rows.length,
    fields,
    sampleColumns: sampleColumns.length > 0 ? sampleColumns : ["value"],
    sampleRows,
  };
}

function asRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
}

export function buildDumpPreview(dump: {
  id: string;
  kind: MaddenExportKind;
  path: string;
  platform: string | null;
  leagueId: string | null;
  weekType: string | null;
  weekNumber: number | null;
  teamId: string | null;
  dataType: string | null;
  byteSize: number;
  receivedAt: Date;
  payload: unknown;
}): DumpPreview {
  const kind =
    dump.dataType === "team" ? MaddenExportKind.TEAM_STATS : dump.kind;
  const weekNumber =
    weekIndexFromPayload(dump.payload) ?? dump.weekNumber;
  const record = asRecord(dump.payload);
  const lists: ListPreview[] = [];
  const scalarFields: Array<{ name: string; value: string }> = [];

  if (record) {
    for (const [key, value] of Object.entries(record)) {
      if (Array.isArray(value)) {
        lists.push(profileList(key, value));
      } else if (key !== "_raw" && key !== "_unparsed") {
        scalarFields.push({ name: key, value: stringifyValue(value) });
      }
    }
    lists.sort((a, b) => b.rowCount - a.rowCount || a.key.localeCompare(b.key));
  } else if (Array.isArray(dump.payload)) {
    lists.push(profileList("items", dump.payload));
  }

  return {
    id: dump.id,
    kind,
    kindLabel: MADDEN_EXPORT_KIND_LABELS[kind],
    hint: KIND_USE_HINTS[kind],
    path: dump.path,
    platform: dump.platform,
    leagueId: dump.leagueId,
    weekType: dump.weekType,
    weekNumber,
    teamId: dump.teamId,
    dataType: dump.dataType,
    weekLabel: displayCompanionWeek(dump.weekType, weekNumber),
    byteSize: dump.byteSize,
    receivedAt: dump.receivedAt.toISOString(),
    lists,
    scalarFields,
  };
}

export function summarizeKinds(dumps: DumpPreview[]): KindSummary[] {
  const byKind = new Map<MaddenExportKind, KindSummary>();
  for (const dump of dumps) {
    const existing = byKind.get(dump.kind);
    const rowCount = dump.lists.reduce((sum, list) => sum + list.rowCount, 0);
    if (!existing) {
      byKind.set(dump.kind, {
        kind: dump.kind,
        label: dump.kindLabel,
        dumpCount: 1,
        rowCount,
        newestAt: dump.receivedAt,
      });
      continue;
    }
    existing.dumpCount += 1;
    existing.rowCount += rowCount;
    if (!existing.newestAt || dump.receivedAt > existing.newestAt) {
      existing.newestAt = dump.receivedAt;
    }
  }
  return [...byKind.values()].sort((a, b) => b.rowCount - a.rowCount);
}
