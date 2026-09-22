import { prisma } from "@/lib/prisma";

const ABBR_ALIASES: Record<string, string> = {
  AZ: "ARI",
  ARZ: "ARI",
  WSH: "WAS",
  JAC: "JAX",
};

export function canonAbbr(abbr: string) {
  const up = abbr.toUpperCase();
  return ABBR_ALIASES[up] ?? up;
}

function isNumericAbbr(abbr: string) {
  return /^\d+$/.test(abbr);
}

export async function franchiseIdForMaddenTeam(team: {
  franchiseId: string | null;
  abbr: string;
  nickName?: string | null;
  displayName?: string | null;
}) {
  if (team.franchiseId) return team.franchiseId;
  const abbr = canonAbbr(team.abbr);
  if (abbr && abbr !== "UNK" && !isNumericAbbr(abbr)) {
    const franchise = await prisma.franchise.findUnique({
      where: { abbreviation: abbr },
      select: { id: true },
    });
    if (franchise) return franchise.id;
  }

  const label = (team.nickName || team.displayName || "").trim();
  if (!label) return null;
  const franchise = await prisma.franchise.findFirst({
    where: {
      OR: [
        { name: { equals: label, mode: "insensitive" } },
        { name: { endsWith: ` ${label}`, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  return franchise?.id ?? null;
}
