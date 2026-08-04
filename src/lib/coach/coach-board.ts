import { prisma } from "@/lib/prisma";
import { getUserCareerStats } from "@/lib/career";
import { getLeagueSettings, getSeasonStandings } from "@/lib/league";
import { computeReputationScore } from "@/lib/reputation";
import { getReputationGrade } from "@/lib/coach/grades";
import {
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
  coachRepGrade: string;
  gmRepScore: number;
  gmRepGrade: string;
  xp: number;
  record: string;
  wins: number;
  losses: number;
  expectationScore: number;
  contractYearsLeft: number;
  tankingStrikes: number;
  gmStrikes: number;
  jobStatus: string;
  jobRecoveryNote: string;
  coachIdentity: string | null;
  teamIdentity: string | null;
  seasonsWithTeam: number;
};

export async function getCoachBoardRows(seasonId: string): Promise<CoachBoardRow[]> {
  const settings = await getLeagueSettings();
  const standings = await getSeasonStandings(seasonId);
  const standingsMap = new Map(standings.map((s) => [s.franchiseId, s]));

  const memberships = await prisma.leagueMembership.findMany({
    where: { seasonId, isActive: true, user: { deletedAt: null } },
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
  });

  const rows = await Promise.all(
    memberships.map(async (membership) => {
      const repRows = membership.user.reputationReceived;
      const coachRepScore = computeReputationScore(settings.startingRepScore, repRows);
      const gmRepScore = computeReputationScore(
        settings.startingGmRepScore,
        repRows.map((r) => ({ amount: r.gmAmount }))
      );
      const coachRepGrade = getReputationGrade(coachRepScore);
      const gmRepGrade = getReputationGrade(gmRepScore);
      const xp = membership.user.xpAdjustmentsReceived.reduce(
        (sum, row) => sum + row.amount,
        0
      );
      const standing = standingsMap.get(membership.franchiseId);
      const wins = standing?.wins ?? 0;
      const losses = standing?.losses ?? 0;
      const coachProfile = membership.user.coachProfile;
      const expectationScore = coachProfile?.expectationScore ?? 0;
      const status = getJobSecurityStatus({
        coachRepScore,
        gmRepScore,
        expectationScore,
        tankingStrikes: coachProfile?.tankingStrikes ?? 0,
        gmStrikes: coachProfile?.gmStrikes ?? 0,
        hotSeatThreshold: settings.hotSeatThreshold,
        firingThreshold: settings.firingThreshold,
        watchThreshold: settings.watchThreshold,
        override: coachProfile?.hotSeatStatusOverride ?? undefined,
      });
      const history = await getUserCareerStats(membership.userId);
      const seasonsWithTeam = history.bySeason.filter(
        (s) => s.franchiseId === membership.franchiseId
      ).length;

      return {
        userId: membership.userId,
        coach: membership.user.name ?? membership.user.email,
        team: membership.franchise.name,
        teamAbbr: membership.franchise.abbreviation,
        conference: membership.franchise.conference,
        coachRepScore,
        coachRepGrade,
        gmRepScore,
        gmRepGrade,
        xp,
        record: `${wins}-${losses}`,
        wins,
        losses,
        expectationScore,
        contractYearsLeft: coachProfile?.contractYearsLeft ?? 3,
        tankingStrikes: coachProfile?.tankingStrikes ?? 0,
        gmStrikes: coachProfile?.gmStrikes ?? 0,
        jobStatus: status,
        jobRecoveryNote: getRecoveryNote(status),
        coachIdentity: coachProfile?.coachIdentity?.name ?? null,
        teamIdentity: membership.franchise.teamIdentity?.name ?? null,
        seasonsWithTeam,
      };
    })
  );

  return rows.sort((a, b) => b.xp - a.xp);
}
