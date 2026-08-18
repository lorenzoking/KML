import { prisma } from "@/lib/prisma";
import { getLeagueSettings, getSeasonStandings } from "@/lib/league";
import {
  computeGmReputationScore,
  computeReputationScore,
  getGmReputationStatus,
  type GmReputationStatus,
} from "@/lib/reputation";
import { getReputationGrade, type ReputationGrade } from "@/lib/coach/grades";
import { HotSeatStatus } from "@prisma/client";
import {
  getJobSecurityScore,
  getJobSecurityStatus,
  getRecoveryNote,
} from "@/lib/coach/job-security";

export type CoachBoardRow = {
  userId: string;
  coach: string;
  team: string | null;
  teamAbbr: string | null;
  conference: string | null;
  coachRepScore: number;
  coachRepGrade: ReputationGrade;
  gmRepScore: number;
  gmRepGrade: string;
  gmRepStatus: GmReputationStatus;
  xp: number;
  record: string;
  wins: number;
  losses: number;
  expectationScore: number;
  contractYearsLeft: number;
  tankingStrikes: number;
  gmStrikes: number;
  jobStatus: HotSeatStatus;
  jobScore: number;
  jobRecoveryNote: string;
  coachIdentity: string | null;
  teamIdentity: string | null;
  seasonsWithTeam: number;
};

async function loadCoachBoardRows(
  seasonId: string,
  userId?: string
): Promise<CoachBoardRow[]> {
  const [settings, standings, memberships, stintHistory] = await Promise.all([
    getLeagueSettings(),
    getSeasonStandings(seasonId),
    prisma.leagueMembership.findMany({
      where: {
        seasonId,
        isActive: true,
        user: { deletedAt: null },
        ...(userId ? { userId } : {}),
      },
      include: {
        user: {
          include: {
            reputationReceived: true,
            xpAdjustmentsReceived: {
              where: { seasonId },
            },
            coachProfile: {
              include: { coachIdentity: true },
            },
          },
        },
        franchise: {
          include: { teamIdentity: true },
        },
      },
    }),
    prisma.leagueMembership.findMany({
      where: userId ? { userId } : { user: { deletedAt: null } },
      select: { userId: true, franchiseId: true, seasonId: true },
    }),
  ]);
  const standingsMap = new Map(standings.map((s) => [s.franchiseId, s]));

  // Count unique seasons per coach/team in one query. The prior implementation
  // ran a full career/game scan once per coach, which became very expensive.
  const seasonsByCoachTeam = new Map<string, Set<string>>();
  for (const stint of stintHistory) {
    const key = `${stint.userId}:${stint.franchiseId}`;
    const seasons = seasonsByCoachTeam.get(key) ?? new Set<string>();
    seasons.add(stint.seasonId);
    seasonsByCoachTeam.set(key, seasons);
  }

  const rows = memberships.map((membership) => {
      const repRows = membership.user.reputationReceived;
      const coachRepScore = computeReputationScore(settings.startingRepScore, repRows);
      const gmRepScore = computeGmReputationScore(
        settings.startingGmRepScore,
        repRows
      );
      const coachRepGrade = getReputationGrade(coachRepScore);
      const gmRepGrade = getReputationGrade(gmRepScore);
      const gmRepStatus = getGmReputationStatus(gmRepScore);
      const xp = membership.user.xpAdjustmentsReceived.reduce(
        (sum, row) => sum + row.amount,
        0
      );
      const standing = standingsMap.get(membership.franchiseId);
      const wins = standing?.wins ?? 0;
      const losses = standing?.losses ?? 0;
      const coachProfile = membership.user.coachProfile;
      const expectationScore = coachProfile?.expectationScore ?? 0;
      const jobInput = {
        coachRepScore,
        gmRepScore,
        expectationScore,
        tankingStrikes: coachProfile?.tankingStrikes ?? 0,
        gmStrikes: coachProfile?.gmStrikes ?? 0,
        hotSeatThreshold: settings.hotSeatThreshold,
        firingThreshold: settings.firingThreshold,
        watchThreshold: settings.watchThreshold,
        override: coachProfile?.hotSeatStatusOverride ?? undefined,
      };
      const jobScore = getJobSecurityScore(jobInput);
      const status = getJobSecurityStatus(jobInput);
      const seasonsWithTeam =
        seasonsByCoachTeam.get(
          `${membership.userId}:${membership.franchiseId}`
        )?.size ?? 0;

      return {
        userId: membership.userId,
        coach: membership.user.name?.trim() || "Unnamed coach",
        team: membership.franchise.name,
        teamAbbr: membership.franchise.abbreviation,
        conference: membership.franchise.conference,
        coachRepScore,
        coachRepGrade,
        gmRepScore,
        gmRepGrade,
        gmRepStatus,
        xp,
        record: `${wins}-${losses}`,
        wins,
        losses,
        expectationScore,
        contractYearsLeft: coachProfile?.contractYearsLeft ?? 3,
        tankingStrikes: coachProfile?.tankingStrikes ?? 0,
        gmStrikes: coachProfile?.gmStrikes ?? 0,
        jobStatus: status,
        jobScore,
        jobRecoveryNote: getRecoveryNote(status),
        coachIdentity: coachProfile?.coachIdentity?.name ?? null,
        teamIdentity: membership.franchise.teamIdentity?.name ?? null,
        seasonsWithTeam,
      };
    });

  return rows.sort((a, b) => b.xp - a.xp);
}

export async function getCoachBoardRows(
  seasonId: string
): Promise<CoachBoardRow[]> {
  return loadCoachBoardRows(seasonId);
}

export async function getCoachBoardRow(
  userId: string,
  seasonId: string
): Promise<CoachBoardRow | null> {
  const rows = await loadCoachBoardRows(seasonId, userId);
  return rows[0] ?? null;
}
