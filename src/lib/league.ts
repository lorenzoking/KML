import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";
import { sumXp } from "@/lib/xp";
import {
  computeReputationScore,
  getReputationLabel,
} from "@/lib/reputation";

export async function getLeagueSettings() {
  const settings = await prisma.leagueSetting.findUnique({
    where: { key: "default" },
  });
  if (!settings) {
    throw new Error("League settings not seeded. Run: npm run db:seed");
  }
  return settings;
}

export async function getActiveSeason() {
  const settings = await getLeagueSettings();
  const season = await prisma.season.findUnique({
    where: { number: settings.currentSeason },
  });
  if (!season) {
    throw new Error(`Season ${settings.currentSeason} not found`);
  }
  return { settings, season };
}

export async function getUserMembership(userId: string, seasonId: string) {
  return prisma.leagueMembership.findFirst({
    where: {
      userId,
      seasonId,
      isActive: true,
    },
    include: { franchise: { include: { teamIdentity: true } } },
  });
}

export async function getXpTotal(userId: string) {
  const adjustments = await prisma.xPAdjustment.findMany({
    where: { userId },
    select: { amount: true },
  });
  return sumXp(adjustments);
}

export async function getReputation(userId: string) {
  const settings = await getLeagueSettings();
  const adjustments = await prisma.reputationAdjustment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const score = computeReputationScore(
    settings.startingRepScore,
    adjustments
  );
  return {
    score,
    label: getReputationLabel(score),
    adjustments,
  };
}

export async function getSeasonStandings(seasonId: string) {
  const [franchises, results] = await Promise.all([
    prisma.franchise.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.gameResult.findMany({
      where: { seasonId, isVoided: false },
    }),
  ]);
  return computeStandings(franchises, results);
}

/** Lightweight W-L + form for one franchise without computing full standings. */
export async function getFranchiseSeasonRecord(
  seasonId: string,
  franchiseId: string
) {
  const results = await prisma.gameResult.findMany({
    where: {
      seasonId,
      isVoided: false,
      OR: [{ homeTeamId: franchiseId }, { awayTeamId: franchiseId }],
    },
    orderBy: [{ week: "desc" }, { createdAt: "desc" }],
  });

  let wins = 0;
  let losses = 0;
  let ties = 0;
  const form: string[] = [];

  for (const r of results) {
    const won = r.winnerTeamId === franchiseId;
    const tied = !r.winnerTeamId;
    if (tied) {
      ties += 1;
      form.push("T");
    } else if (won) {
      wins += 1;
      form.push("W");
    } else {
      losses += 1;
      form.push("L");
    }
  }

  return {
    wins,
    losses,
    ties,
    form: form.slice(0, 5).join(""),
  };
}

export async function listSeasons() {
  return prisma.season.findMany({
    orderBy: { number: "desc" },
  });
}
