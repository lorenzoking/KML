import { MaddenStatCategory } from "@/generated/prisma/client";
import {
  formatRecord,
  formatSacks,
  formatStat,
  isQuarterback,
  isRookie,
  playerName,
} from "@/lib/madden/display";
import {
  getLeaders,
  getSeasonPlayerTotals,
  latestStatWeek,
  type SeasonPlayerTotal,
} from "@/lib/madden/query";

export type AwardCandidate = {
  rosterId: string;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNum: number;
  teamAbbr: string;
  teamName: string;
  teamColor: string;
  record: string;
  score: number;
  headline: string;
  detail: string;
};

export type AwardRace = {
  id: "mvp" | "opoty" | "dpoty" | "roy";
  title: string;
  short: string;
  blurb: string;
  candidates: AwardCandidate[];
};

export type SeasonPulse = {
  label: string;
  value: string;
  unit: string;
  name: string;
  teamAbbr: string;
  teamColor: string;
};

export type WeekHeater = {
  label: string;
  name: string;
  teamAbbr: string;
  teamColor: string;
  line: string;
  href: string;
};

const RACE_SIZE = 5;

function offensiveValue(player: SeasonPlayerTotal) {
  return (
    player.passYds / 25 +
    player.passTDs * 4 -
    player.passInts * 2 +
    player.rushYds / 10 +
    player.rushTDs * 6 +
    player.recYds / 10 +
    player.recTDs * 6 +
    player.recCatches * 0.4
  );
}

function skillValue(player: SeasonPlayerTotal) {
  return (
    player.rushYds / 10 +
    player.rushTDs * 6 +
    player.recYds / 10 +
    player.recTDs * 6 +
    player.recCatches * 0.5
  );
}

function defensiveValue(player: SeasonPlayerTotal) {
  return player.defSacks * 12 + player.defInts * 12 + player.defTackles * 0.4;
}

function mvpScore(player: SeasonPlayerTotal) {
  const games = Math.max(1, player.wins + player.losses + player.ties);
  return offensiveValue(player) + player.wins * 5 + (player.wins / games) * 12;
}

function royScore(player: SeasonPlayerTotal) {
  return Math.max(offensiveValue(player), defensiveValue(player));
}

function candidate(
  player: SeasonPlayerTotal,
  score: number,
  headline: string,
  detail: string
): AwardCandidate {
  return {
    rosterId: player.rosterId,
    name: player.name,
    firstName: player.firstName,
    lastName: player.lastName,
    position: player.position,
    jerseyNum: player.jerseyNum,
    teamAbbr: player.teamAbbr,
    teamName: player.teamName,
    teamColor: player.teamColor,
    record: formatRecord(player.wins, player.losses, player.ties),
    score,
    headline,
    detail,
  };
}

function qbHeadline(player: SeasonPlayerTotal) {
  return `${formatStat(player.passYds)} yds · ${player.passTDs} TD · ${player.passInts} INT`;
}

function skillHeadline(player: SeasonPlayerTotal) {
  if (player.rushYds >= player.recYds) {
    return `${formatStat(player.rushYds)} rush yds · ${player.rushTDs} TD`;
  }
  return `${player.recCatches} rec · ${formatStat(player.recYds)} yds · ${player.recTDs} TD`;
}

function defenseHeadline(player: SeasonPlayerTotal) {
  return `${formatSacks(player.defSacks)} sacks · ${player.defInts} INT · ${formatStat(player.defTackles)} tkl`;
}

function topBy(
  players: SeasonPlayerTotal[],
  scoreOf: (player: SeasonPlayerTotal) => number,
  headlineOf: (player: SeasonPlayerTotal) => string,
  detailOf: (player: SeasonPlayerTotal) => string
) {
  return players
    .map((player) => ({ player, score: scoreOf(player) }))
    .filter((row) => row.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, RACE_SIZE)
    .map((row) =>
      candidate(row.player, row.score, headlineOf(row.player), detailOf(row.player))
    );
}

function buildRaces(players: SeasonPlayerTotal[]): AwardRace[] {
  const offense = players.filter(
    (player) => !isQuarterback(player.position) && skillValue(player) > 0
  );
  const defense = players.filter((player) => defensiveValue(player) > 0);
  const rookies = players.filter((player) => isRookie(player.yearsPro, player.position));

  return [
    {
      id: "mvp",
      title: "Most Valuable Player",
      short: "MVP",
      blurb: "Production plus winning. QBs usually sit here — unless a skill player is eating.",
      candidates: topBy(
        players,
        mvpScore,
        (player) =>
          isQuarterback(player.position) ? qbHeadline(player) : skillHeadline(player),
        (player) => `${player.teamAbbr} ${formatRecord(player.wins, player.losses, player.ties)}`
      ),
    },
    {
      id: "opoty",
      title: "Offensive Player of the Year",
      short: "OPOTY",
      blurb: "Non-QB skill work. Rushing, receiving, and touchdowns — not just volume.",
      candidates: topBy(
        offense,
        skillValue,
        skillHeadline,
        (player) => `${player.position} · ${player.teamAbbr}`
      ),
    },
    {
      id: "dpoty",
      title: "Defensive Player of the Year",
      short: "DPOTY",
      blurb: "Sacks first, takeaways second, tackles to break ties.",
      candidates: topBy(
        defense,
        defensiveValue,
        defenseHeadline,
        (player) => `${player.position} · ${player.teamAbbr}`
      ),
    },
    {
      id: "roy",
      title: "Rookie of the Year",
      short: "ROY",
      blurb: "Year-zero players only. Offense and defense in one race.",
      candidates: topBy(
        rookies,
        royScore,
        (player) =>
          defensiveValue(player) > offensiveValue(player)
            ? defenseHeadline(player)
            : isQuarterback(player.position)
              ? qbHeadline(player)
              : skillHeadline(player),
        (player) => `${player.position} · ${player.teamAbbr}`
      ),
    },
  ];
}

function buildPulse(players: SeasonPlayerTotal[]): SeasonPulse[] {
  const pick = (
    label: string,
    unit: string,
    metric: (player: SeasonPlayerTotal) => number,
    format: (value: number) => string
  ): SeasonPulse | null => {
    const leader = [...players].sort((a, b) => metric(b) - metric(a))[0];
    if (!leader || metric(leader) <= 0) return null;
    return {
      label,
      value: format(metric(leader)),
      unit,
      name: leader.name,
      teamAbbr: leader.teamAbbr,
      teamColor: leader.teamColor,
    };
  };

  return [
    pick("Passing", "yds", (p) => p.passYds, formatStat),
    pick("Rushing", "yds", (p) => p.rushYds, formatStat),
    pick("Receiving", "yds", (p) => p.recYds, formatStat),
    pick("Sacks", "sacks", (p) => p.defSacks, formatSacks),
  ].filter((row): row is SeasonPulse => row != null);
}

async function buildHeaters(weekIndex: number): Promise<WeekHeater[]> {
  const href = `/league/leaders?week=${weekIndex}`;
  const [passing, rushing, receiving, defense] = await Promise.all([
    getLeaders(weekIndex, MaddenStatCategory.PASSING, 1),
    getLeaders(weekIndex, MaddenStatCategory.RUSHING, 1),
    getLeaders(weekIndex, MaddenStatCategory.RECEIVING, 1),
    getLeaders(weekIndex, MaddenStatCategory.DEFENSE, 1),
  ]);

  const color = (row: { team: { franchise?: { primaryColor: string } | null } }) =>
    row.team.franchise?.primaryColor &&
    row.team.franchise.primaryColor.toLowerCase() !== "#000000"
      ? row.team.franchise.primaryColor
      : "#d4af37";

  const heaters: WeekHeater[] = [];
  const pass = passing[0];
  if (pass) {
    heaters.push({
      label: "Air raid",
      name: playerName(pass.player) || pass.fullName,
      teamAbbr: pass.team.abbr,
      teamColor: color(pass),
      line: `${formatStat(pass.passYds)} yds · ${pass.passTDs} TD`,
      href,
    });
  }
  const rush = rushing[0];
  if (rush) {
    heaters.push({
      label: "Ground game",
      name: playerName(rush.player) || rush.fullName,
      teamAbbr: rush.team.abbr,
      teamColor: color(rush),
      line: `${formatStat(rush.rushYds)} yds · ${rush.rushTDs} TD`,
      href,
    });
  }
  const rec = receiving[0];
  if (rec) {
    heaters.push({
      label: "Target hog",
      name: playerName(rec.player) || rec.fullName,
      teamAbbr: rec.team.abbr,
      teamColor: color(rec),
      line: `${rec.recCatches} for ${formatStat(rec.recYds)} · ${rec.recTDs} TD`,
      href,
    });
  }
  const def = defense[0];
  if (def) {
    heaters.push({
      label: "Chaos agent",
      name: playerName(def.player) || def.fullName,
      teamAbbr: def.team.abbr,
      teamColor: color(def),
      line: `${formatSacks(def.defSacks)} sacks · ${def.defInts} INT`,
      href,
    });
  }
  return heaters;
}

export async function getLeagueBoard() {
  const [totals, weekIndex] = await Promise.all([
    getSeasonPlayerTotals(),
    latestStatWeek(),
  ]);
  const heaters = weekIndex != null ? await buildHeaters(weekIndex) : [];
  return {
    weekIndex,
    races: buildRaces(totals),
    pulse: buildPulse(totals),
    heaters,
  };
}

export function raceLeader(race: AwardRace) {
  return race.candidates[0] ?? null;
}

export function leadMargin(race: AwardRace) {
  const [first, second] = race.candidates;
  if (!first || !second) return null;
  const gap = first.score - second.score;
  const tight = gap / Math.max(first.score, 1) < 0.08;
  return { gap, tight, challenger: second.name };
}
