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

export async function listSeasons() {
  return prisma.season.findMany({
    orderBy: { number: "desc" },
  });
}
