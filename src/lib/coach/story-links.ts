import { getCoachBoardRows } from "@/lib/coach/coach-board";

export type CoachStoryLink = {
  labels: string[];
  href: string;
};

/** Extra names the desk uses in copy that may not match the profile display name. */
const COACH_ALIAS_GROUPS = [
  ["Petey", "MONEYTEAMPETEY"],
  ["Ren", "Wrinzo"],
  ["Swipe", "Swipa"],
  ["Jordan Stowe"],
  ["Puddin"],
  ["Trent"],
  ["Jsmood"],
  ["Biz"],
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function lastName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

export async function getCoachStoryLinks(seasonId: string): Promise<CoachStoryLink[]> {
  const rows = await getCoachBoardRows(seasonId);
  const lastNameCounts = new Map<string, number>();
  for (const row of rows) {
    const last = lastName(row.coach);
    if (!last) continue;
    const key = normalize(last);
    lastNameCounts.set(key, (lastNameCounts.get(key) ?? 0) + 1);
  }

  return rows.map((row) => {
    const labels = new Set<string>([row.coach]);
    const coachKey = normalize(row.coach);
    for (const group of COACH_ALIAS_GROUPS) {
      if (group.some((alias) => normalize(alias) === coachKey)) {
        for (const alias of group) labels.add(alias);
      }
    }
    const last = lastName(row.coach);
    if (last && (lastNameCounts.get(normalize(last)) ?? 0) === 1) {
      labels.add(last);
    }
    return {
      labels: [...labels],
      href: `/coach/profiles/${row.userId}`,
    };
  });
}

export function linkifyCoachMentions(text: string, coaches: CoachStoryLink[]): string {
  if (!text || coaches.length === 0) return text;

  const terms = coaches
    .flatMap((coach) => coach.labels.map((label) => ({ label, href: coach.href })))
    .filter((term, index, all) => {
      const key = `${normalize(term.label)}:${term.href}`;
      return all.findIndex((other) => `${normalize(other.label)}:${other.href}` === key) === index;
    })
    .sort((a, b) => b.label.length - a.label.length);

  if (!terms.length) return text;

  const protectRe = /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g;
  const chunks: string[] = [];
  let cursor = 0;
  for (const match of text.matchAll(protectRe)) {
    const start = match.index ?? 0;
    chunks.push(replaceCoachNames(text.slice(cursor, start), terms));
    chunks.push(match[0]);
    cursor = start + match[0].length;
  }
  chunks.push(replaceCoachNames(text.slice(cursor), terms));
  return chunks.join("");
}

function replaceCoachNames(
  text: string,
  terms: Array<{ label: string; href: string }>
) {
  if (!text) return text;
  const pattern = terms
    .map((term) => term.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  return text.replace(new RegExp(`\\b(${pattern})\\b`, "gi"), (match) => {
    const term = terms.find((row) => normalize(row.label) === normalize(match));
    if (!term) return match;
    return `[${match}](${term.href})`;
  });
}
