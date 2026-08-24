import type { HotSeatStatus } from "@/generated/prisma/client";
import { AT_RISK_JOB_STATUSES, formatJobStatus } from "@/lib/coach/job-security";
import { getReputationGrade, getReputationGradeLabel } from "@/lib/coach/grades";

type PulseGame = {
  status: string;
  week: number;
  userScore: number | null;
  opponentScore: number | null;
  userTeamId: string;
  opponentTeamId: string;
  isForceWin?: boolean;
  userTeam: { abbreviation: string; name: string };
  opponentTeam: { abbreviation: string; name: string };
};

type PulseStory = {
  title: string;
  summary: string;
  body: string;
  eyebrow: string | null;
};

type PulseRep = {
  amount: number;
  reason: string;
  week: number | null;
};

export type DashboardPulseInput = {
  displayName: string | null | undefined;
  teamName: string | null;
  teamAbbr: string | null;
  coachIdentity: string | null;
  currentWeek: number;
  jobStatus: HotSeatStatus | string;
  reputationScore: number;
  weekGame: PulseGame | null;
  myFranchiseId: string | null;
  latestRep: PulseRep | null;
  featured: PulseStory | null;
};

export type DashboardPulse = {
  message: string;
};

export function coachHonorific(name: string | null | undefined): string {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter((part) => part && !/^(iii|ii|iv|jr\.?|sr\.?)$/i.test(part));
  if (parts.length >= 2) return parts[parts.length - 1];
  if (parts[0]) return parts[0];
  return "Coach";
}

export function buildDashboardPulse(input: DashboardPulseInput): DashboardPulse {
  const coach = coachHonorific(input.displayName);
  const week = input.currentWeek;
  const grade = getReputationGrade(input.reputationScore);
  const gradeLabel = getReputationGradeLabel(grade);
  const headline = buildHeadline(input, {
    coach,
    week,
    grade,
    gradeLabel,
    hasLedger: Boolean(input.latestRep && input.latestRep.amount !== 0),
  });
  const reputation = reputationAside(input, grade, gradeLabel);

  return {
    message: reputation ? `${headline} ${reputation}` : headline,
  };
}

function reputationAside(
  input: DashboardPulseInput,
  grade: string,
  gradeLabel: string
): string | null {
  if (!input.latestRep || input.latestRep.amount === 0) return null;

  const points = Math.abs(input.latestRep.amount);
  const pointWord = points === 1 ? "a point" : `${points} points`;
  const reason = naturalReason(input.latestRep.reason);
  const standing = `You’re at ${input.reputationScore} right now — a ${grade}, ${gradeLabel.toLowerCase()}.`;

  if (input.latestRep.amount > 0) {
    return `Your reputation also went up ${pointWord} for ${reason}. ${standing}`;
  }

  return `Your reputation took ${pointWord} off for ${reason}. ${standing}`;
}

function buildHeadline(
  input: DashboardPulseInput,
  ctx: {
    coach: string;
    week: number;
    grade: string;
    gradeLabel: string;
    hasLedger: boolean;
  }
): string {
  const { week, grade, gradeLabel, hasLedger } = ctx;

  if (input.weekGame && input.myFranchiseId) {
    const mineIsUser = input.weekGame.userTeamId === input.myFranchiseId;
    const myScore = mineIsUser ? input.weekGame.userScore : input.weekGame.opponentScore;
    const theirScore = mineIsUser
      ? input.weekGame.opponentScore
      : input.weekGame.userScore;
    const opponent = mineIsUser ? input.weekGame.opponentTeam : input.weekGame.userTeam;
    const them = theTeam(opponent.name);

    if (input.weekGame.isForceWin) {
      if (input.weekGame.status === "PENDING") {
        return `I saw your Week ${week} force win claim against ${them}. I’m waiting for the desk to make it official.`;
      }
      if (myScore == null || theirScore == null) {
        return `Week ${week} is a force win against ${them}. Post the simulated score after the league advances — you’ll already get game-played XP.`;
      }
      return `Week ${week} was a force win against ${them}. The sim score is in (${myScore}–${theirScore}) for standings only.`;
    }

    if (myScore == null || theirScore == null) {
      if (input.weekGame.status === "PENDING") {
        return `I saw your Week ${week} submission against ${them}. I’m just waiting for the desk to make it official.`;
      }
    } else {
      const margin = Math.abs(myScore - theirScore);

      if (input.weekGame.status === "APPROVED") {
        if (myScore > theirScore) {
          if (margin >= 14) {
            return `Good to see you. That Week ${week} game was a statement — you took down ${them} ${myScore}–${theirScore}.`;
          }
          return `Good to see you. Week ${week} is in the books: you beat ${them} ${myScore}–${theirScore}.`;
        }
        if (myScore < theirScore) {
          if (margin >= 14) {
            return hasLedger
              ? `Hey. That one against ${them} got away from you, ${myScore}–${theirScore}.`
              : `Hey. That one against ${them} got away from you, ${myScore}–${theirScore}. You’re still a ${grade} though — ${gradeLabel.toLowerCase()}.`;
          }
          return hasLedger
            ? `Hey. Tough one this week — ${them} got you ${theirScore}–${myScore}.`
            : `Hey. Tough one this week — ${them} got you ${theirScore}–${myScore}. You’re still a ${grade} (${gradeLabel.toLowerCase()}).`;
        }
        return `Hey. Week ${week} ended even with ${them}, ${myScore}–${theirScore}. Split it and move on.`;
      }

      if (input.weekGame.status === "PENDING") {
        return `I saw your Week ${week} score come in against ${them} (${myScore}–${theirScore}). I’m just waiting for the desk to make it official.`;
      }
    }
  }

  if (input.featured && storyMentionsCoach(input.featured, input)) {
    return `Good to see you. You’re in the conversation this week — the front page put you in “${input.featured.title}.”`;
  }

  if (AT_RISK_JOB_STATUSES.has(input.jobStatus as HotSeatStatus)) {
    return `Quick heads-up: your job’s sitting in ${formatJobStatus(String(input.jobStatus)).toLowerCase()} territory. Week ${week} is a chance to change that.`;
  }

  if (input.teamName) {
    if (input.reputationScore >= 93) {
      return `Good to see you. ${input.teamName} are in elite air right now. I’ll be here when Week ${week} is ready.`;
    }
    return `Good to see you. Week ${week} is still open whenever you’re ready — I’ll take it from there once the ${input.teamName} result is in.`;
  }

  return `Good to see you. Once you request a franchise, I can start tracking your week, your reputation, and whatever the league writes about you.`;
}

function theTeam(name: string) {
  const trimmed = name.trim();
  if (/^(the)\s/i.test(trimmed)) return trimmed;
  return `the ${trimmed}`;
}

function naturalReason(reason: string) {
  const cleaned = reason.replace(/^week\s+\d+:\s*/i, "").trim().replace(/\.$/, "");
  if (!cleaned) return "how things have been going";
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
}

function storyMentionsCoach(
  story: PulseStory,
  input: DashboardPulseInput
): boolean {
  const haystack = `${story.title}\n${story.summary}\n${story.body}\n${story.eyebrow ?? ""}`;
  const firstName = (input.displayName ?? "").trim().split(/\s+/)[0];
  const tokens = [
    input.displayName,
    firstName && firstName.length >= 4 ? firstName : null,
    coachHonorific(input.displayName),
    input.teamName,
    input.coachIdentity,
  ]
    .map((token) => token?.trim())
    .filter((token): token is string => Boolean(token && token.length >= 3));

  if (tokens.some((token) => hasToken(haystack, token))) return true;
  if (input.teamAbbr && hasAbbr(haystack, input.teamAbbr)) return true;
  return false;
}

function hasToken(haystack: string, token: string) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

function hasAbbr(haystack: string, abbr: string) {
  const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}
