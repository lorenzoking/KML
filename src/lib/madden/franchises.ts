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

export async function franchiseIdForMaddenTeam(team: {
  franchiseId: string | null;
  abbr: string;
}) {
  if (team.franchiseId) return team.franchiseId;
  const abbr = canonAbbr(team.abbr);
  if (!abbr || abbr === "UNK") return null;
  const franchise = await prisma.franchise.findUnique({
    where: { abbreviation: abbr },
    select: { id: true },
  });
  return franchise?.id ?? null;
}
