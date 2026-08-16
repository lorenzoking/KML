import { prisma } from "@/lib/prisma";

export type CoachStoryLink = {
  userId: string;
  href: string;
  teamLabels: string[];
};

const TEAM_HEADERS = new Set(["team", "side", "franchise"]);
const MATCHUP_HEADERS = new Set(["matchup"]);
const COACH_HEADERS = new Set(["coach", "coaches", "league coach"]);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function plainText(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nicknameFromFranchise(name: string, city: string) {
  const stripped = name.replace(new RegExp(`^${escapeRegExp(city)}\\s+`, "i"), "").trim();
  return stripped || name;
}

export async function getCoachStoryLinks(seasonId: string): Promise<CoachStoryLink[]> {
  const memberships = await prisma.leagueMembership.findMany({
    where: {
      seasonId,
      isActive: true,
      user: { deletedAt: null },
    },
    include: {
      user: { select: { id: true } },
      franchise: { select: { name: true, city: true, abbreviation: true } },
    },
  });

  const cityCounts = new Map<string, number>();
  for (const row of memberships) {
    const city = normalize(row.franchise.city);
    cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
  }

  return memberships.map((row) => {
    const nick = nicknameFromFranchise(row.franchise.name, row.franchise.city);
    const teamLabels = [row.franchise.name, nick, row.franchise.abbreviation];
    if ((cityCounts.get(normalize(row.franchise.city)) ?? 0) === 1) {
      teamLabels.push(row.franchise.city);
    }

    return {
      userId: row.user.id,
      href: `/coach/profiles/${row.user.id}`,
      teamLabels: unique(teamLabels),
    };
  });
}

export function resolveTeamsInText(
  text: string,
  coaches: CoachStoryLink[]
): CoachStoryLink[] {
  const haystack = plainText(text);
  if (!haystack) return [];

  const hits: Array<{ index: number; length: number; coach: CoachStoryLink }> = [];
  for (const coach of coaches) {
    const labels = [...coach.teamLabels].sort((a, b) => b.length - a.length);
    for (const label of labels) {
      const re = new RegExp(`\\b${escapeRegExp(label)}\\b`, "gi");
      for (const match of haystack.matchAll(re)) {
        hits.push({
          index: match.index ?? 0,
          length: match[0].length,
          coach,
        });
      }
    }
  }

  hits.sort((a, b) => a.index - b.index || b.length - a.length);
  const used = new Set<string>();
  const resolved: CoachStoryLink[] = [];
  let cursor = -1;
  for (const hit of hits) {
    if (hit.index < cursor) continue;
    if (used.has(hit.coach.userId)) continue;
    used.add(hit.coach.userId);
    resolved.push(hit.coach);
    cursor = hit.index + hit.length;
  }
  return resolved;
}

function wrapWithLink(text: string, href: string) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (/\[[^\]]+\]\([^)]+\)/.test(trimmed)) return text;
  const bold = trimmed.match(/^\*\*(.*)\*\*$/);
  if (bold) return `**[${bold[1]}](${href})**`;
  return `[${trimmed}](${href})`;
}

function linkTeamNamesInText(text: string, coaches: CoachStoryLink[]) {
  if (!text || coaches.length === 0) return text;
  const labels = coaches
    .flatMap((coach) => coach.teamLabels.map((label) => ({ label, href: coach.href })))
    .sort((a, b) => b.label.length - a.label.length);

  let next = text;
  for (const term of labels) {
    next = replaceOutsideLinks(next, (chunk) =>
      chunk.replace(
        new RegExp(`(\\*\\*)?\\b(${escapeRegExp(term.label)})\\b(\\*\\*)?`, "gi"),
        (_match, openBold: string | undefined, name: string, closeBold: string | undefined) => {
          const linked = `[${name}](${term.href})`;
          if (openBold && closeBold) return `**${linked}**`;
          return `${openBold ?? ""}${linked}${closeBold ?? ""}`;
        }
      )
    );
  }
  return next;
}

function linkSplitCoaches(cell: string, teams: CoachStoryLink[]) {
  if (teams.length === 1) return wrapWithLink(cell, teams[0].href);

  const parts = cell.split(/(\s+vs\.?\s+)/i);
  const names = parts.filter((_, index) => index % 2 === 0);
  const separators = parts.filter((_, index) => index % 2 === 1);
  if (names.length !== teams.length) {
    return teams.length ? wrapWithLink(cell, teams[0].href) : cell;
  }

  return names
    .map((name, index) => `${wrapWithLink(name, teams[index].href)}${separators[index] ?? ""}`)
    .join("");
}

function headerKind(
  header: string,
  headers: string[]
): "team" | "matchup" | "coach" | "other" {
  const key = normalize(header.replace(/\*/g, ""));
  if (TEAM_HEADERS.has(key)) return "team";
  if (MATCHUP_HEADERS.has(key)) return "matchup";
  if (COACH_HEADERS.has(key)) return "coach";
  if (key === "name" && headers.some((h) => TEAM_HEADERS.has(normalize(h)))) return "coach";
  return "other";
}

/** Link coach/team cells in article charts using the assigned franchise, not the nickname in copy. */
export function linkTableRow(
  headers: string[],
  cells: string[],
  coaches: CoachStoryLink[]
): string[] {
  if (!coaches.length) return cells;

  const kinds = headers.map((header) => headerKind(header, headers));
  const teamText = cells
    .filter((_, index) => kinds[index] === "team" || kinds[index] === "matchup")
    .join(" ");
  const teams = resolveTeamsInText(teamText, coaches);
  if (!teams.length) return cells;

  return cells.map((cell, index) => {
    const kind = kinds[index];
    if (kind === "team" || kind === "matchup") {
      return linkTeamNamesInText(cell, coaches);
    }
    if (kind === "coach") {
      return linkSplitCoaches(cell, teams);
    }
    return cell;
  });
}

function replaceOutsideLinks(text: string, replaceChunk: (chunk: string) => string) {
  const protectRe = /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g;
  const chunks: string[] = [];
  let cursor = 0;
  for (const match of text.matchAll(protectRe)) {
    const start = match.index ?? 0;
    chunks.push(replaceChunk(text.slice(cursor, start)));
    chunks.push(match[0]);
    cursor = start + match[0].length;
  }
  chunks.push(replaceChunk(text.slice(cursor)));
  return chunks.join("");
}
