import type { Prisma } from "@/generated/prisma/client";
import { MaddenStatCategory } from "@/generated/prisma/client";

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function payloadList(payload: unknown, key: string) {
  const record = asRecord(payload);
  const value = record?.[key];
  if (!Array.isArray(value)) return [] as Record<string, unknown>[];
  return value.filter(
    (row): row is Record<string, unknown> =>
      Boolean(row) && typeof row === "object" && !Array.isArray(row)
  );
}

export function num(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function str(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export function flag(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return value === true || value === 1 || value === "true";
}

export function teamIdOf(row: Record<string, unknown>) {
  const value = row.teamId ?? row.teamID;
  return value == null || value === "" ? "" : String(value);
}

export function rosterIdOf(row: Record<string, unknown>) {
  const value = row.rosterId ?? row.playerId;
  return value == null || value === "" ? "" : String(value);
}

export function splitName(fullName: string) {
  const trimmed = fullName.trim();
  const dot = trimmed.indexOf(".");
  if (dot > 0 && dot < trimmed.length - 1) {
    return {
      firstName: trimmed.slice(0, dot + 1),
      lastName: trimmed.slice(dot + 1),
    };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: "", lastName: parts[0] ?? trimmed };
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function jsonValue(row: Record<string, unknown>): Prisma.InputJsonValue {
  return row as Prisma.InputJsonValue;
}

export const STAT_LISTS: Array<{
  key: string;
  category: MaddenStatCategory;
}> = [
  { key: "playerPassingStatInfoList", category: MaddenStatCategory.PASSING },
  { key: "playerRushingStatInfoList", category: MaddenStatCategory.RUSHING },
  { key: "playerReceivingStatInfoList", category: MaddenStatCategory.RECEIVING },
  { key: "playerDefensiveStatInfoList", category: MaddenStatCategory.DEFENSE },
  { key: "playerKickingStatInfoList", category: MaddenStatCategory.KICKING },
  { key: "playerPuntingStatInfoList", category: MaddenStatCategory.PUNTING },
];
