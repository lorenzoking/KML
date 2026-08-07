import {
  PrismaClient,
  Role,
  GameType,
  SubmissionStatus,
  IdentityType,
  IdentityStatus,
  ReputationCategory,
  CarouselMoveType,
  CarouselApplicationStatus,
  PlayoffResult,
  ExpectationResult,
} from "@prisma/client";

const prisma = new PrismaClient();

const NFL_TEAMS = [
  { name: "Arizona Cardinals", abbreviation: "ARI", city: "Arizona", conference: "NFC", division: "West", primaryColor: "#97233F", sortOrder: 1 },
  { name: "Atlanta Falcons", abbreviation: "ATL", city: "Atlanta", conference: "NFC", division: "South", primaryColor: "#A71930", sortOrder: 2 },
  { name: "Baltimore Ravens", abbreviation: "BAL", city: "Baltimore", conference: "AFC", division: "North", primaryColor: "#241773", sortOrder: 3 },
  { name: "Buffalo Bills", abbreviation: "BUF", city: "Buffalo", conference: "AFC", division: "East", primaryColor: "#00338D", sortOrder: 4 },
  { name: "Carolina Panthers", abbreviation: "CAR", city: "Carolina", conference: "NFC", division: "South", primaryColor: "#0085CA", sortOrder: 5 },
  { name: "Chicago Bears", abbreviation: "CHI", city: "Chicago", conference: "NFC", division: "North", primaryColor: "#0B162A", sortOrder: 6 },
  { name: "Cincinnati Bengals", abbreviation: "CIN", city: "Cincinnati", conference: "AFC", division: "North", primaryColor: "#FB4F14", sortOrder: 7 },
  { name: "Cleveland Browns", abbreviation: "CLE", city: "Cleveland", conference: "AFC", division: "North", primaryColor: "#311D00", sortOrder: 8 },
  { name: "Dallas Cowboys", abbreviation: "DAL", city: "Dallas", conference: "NFC", division: "East", primaryColor: "#003594", sortOrder: 9 },
  { name: "Denver Broncos", abbreviation: "DEN", city: "Denver", conference: "AFC", division: "West", primaryColor: "#FB4F14", sortOrder: 10 },
  { name: "Detroit Lions", abbreviation: "DET", city: "Detroit", conference: "NFC", division: "North", primaryColor: "#0076B6", sortOrder: 11 },
  { name: "Green Bay Packers", abbreviation: "GB", city: "Green Bay", conference: "NFC", division: "North", primaryColor: "#203731", sortOrder: 12 },
  { name: "Houston Texans", abbreviation: "HOU", city: "Houston", conference: "AFC", division: "South", primaryColor: "#03202F", sortOrder: 13 },
  { name: "Indianapolis Colts", abbreviation: "IND", city: "Indianapolis", conference: "AFC", division: "South", primaryColor: "#002C5F", sortOrder: 14 },
  { name: "Jacksonville Jaguars", abbreviation: "JAX", city: "Jacksonville", conference: "AFC", division: "South", primaryColor: "#006778", sortOrder: 15 },
  { name: "Kansas City Chiefs", abbreviation: "KC", city: "Kansas City", conference: "AFC", division: "West", primaryColor: "#E31837", sortOrder: 16 },
  { name: "Las Vegas Raiders", abbreviation: "LV", city: "Las Vegas", conference: "AFC", division: "West", primaryColor: "#000000", sortOrder: 17 },
  { name: "Los Angeles Chargers", abbreviation: "LAC", city: "Los Angeles", conference: "AFC", division: "West", primaryColor: "#0080C6", sortOrder: 18 },
  { name: "Los Angeles Rams", abbreviation: "LAR", city: "Los Angeles", conference: "NFC", division: "West", primaryColor: "#003594", sortOrder: 19 },
  { name: "Miami Dolphins", abbreviation: "MIA", city: "Miami", conference: "AFC", division: "East", primaryColor: "#008E97", sortOrder: 20 },
  { name: "Minnesota Vikings", abbreviation: "MIN", city: "Minnesota", conference: "NFC", division: "North", primaryColor: "#4F2683", sortOrder: 21 },
  { name: "New England Patriots", abbreviation: "NE", city: "New England", conference: "AFC", division: "East", primaryColor: "#002244", sortOrder: 22 },
  { name: "New Orleans Saints", abbreviation: "NO", city: "New Orleans", conference: "NFC", division: "South", primaryColor: "#D3BC8D", sortOrder: 23 },
  { name: "New York Giants", abbreviation: "NYG", city: "New York", conference: "NFC", division: "East", primaryColor: "#0B2265", sortOrder: 24 },
  { name: "New York Jets", abbreviation: "NYJ", city: "New York", conference: "AFC", division: "East", primaryColor: "#125740", sortOrder: 25 },
  { name: "Philadelphia Eagles", abbreviation: "PHI", city: "Philadelphia", conference: "NFC", division: "East", primaryColor: "#004C54", sortOrder: 26 },
  { name: "Pittsburgh Steelers", abbreviation: "PIT", city: "Pittsburgh", conference: "AFC", division: "North", primaryColor: "#FFB612", sortOrder: 27 },
  { name: "San Francisco 49ers", abbreviation: "SF", city: "San Francisco", conference: "NFC", division: "West", primaryColor: "#AA0000", sortOrder: 28 },
  { name: "Seattle Seahawks", abbreviation: "SEA", city: "Seattle", conference: "NFC", division: "West", primaryColor: "#002244", sortOrder: 29 },
  { name: "Tampa Bay Buccaneers", abbreviation: "TB", city: "Tampa Bay", conference: "NFC", division: "South", primaryColor: "#D50A0A", sortOrder: 30 },
  { name: "Tennessee Titans", abbreviation: "TEN", city: "Tennessee", conference: "AFC", division: "South", primaryColor: "#0C2340", sortOrder: 31 },
  { name: "Washington Commanders", abbreviation: "WAS", city: "Washington", conference: "NFC", division: "East", primaryColor: "#5A1414", sortOrder: 32 },
] as const;

const DEFAULT_RULES = `# Kings Madden League — Rulebook

## Core Standards
- One coach per franchise.
- Only one person submits each game result.
- Commissioners approve scores before they count toward standings or XP.
- A bad record alone is not tanking. Intentional losing requires documented evidence.

## Game Submission
1. Play your scheduled game.
2. Submit season, week, game type, opponent, and final score.
3. Wait for commissioner approval.
4. Approved results update standings and XP automatically.

## XP (MVP)
- Game played: configurable in League Settings (default 1)
- Win bonus: configurable in League Settings (default 4)
- Commissioners may apply manual XP adjustments with a reason.

## Coach Reputation
- Every coach starts with a baseline reputation score.
- Commissioners apply positive or negative adjustments with a reason.
- Labels: Elite, Stable, Pressured, Hot Seat.

## Coaching Carousel
- Coaches start on 3-year contracts with a B baseline reputation.
- Re-signing or extending with your current team costs 0 XP and requires B or higher.
- Changing teams during carousel requires B or higher and costs 25 XP.
- Market order is coaching reputation first, then career win percentage.

## Sportsmanship
- Field a competitive lineup and make a good-faith attempt to win.
- Healthy starters cannot be benched solely to weaken the team.
- No intentional safeties, clock sabotage, or giveaway plays.
`;

async function main() {
  console.log("Seeding Kings Madden League...");

  // Destructive seed deletes ALL app users (not Supabase Auth accounts).
  // Require an explicit opt-in so production Google users are not wiped.
  if (process.env.ALLOW_DB_RESET !== "true") {
    throw new Error(
      [
        "Refusing to seed: this script wipes app users and league data.",
        "Set ALLOW_DB_RESET=true only for local/demo resets.",
        "For production schema updates use: npx prisma migrate deploy",
        "To restore Auth users into Manage users, use Admin → Sync from Supabase Auth.",
      ].join("\n")
    );
  }

  console.warn(
    "ALLOW_DB_RESET=true — wiping app tables (Supabase Auth users are NOT deleted)."
  );

  await prisma.carouselApplication.deleteMany();
  await prisma.carouselVacancy.deleteMany();
  await prisma.coachSeasonReview.deleteMany();
  await prisma.coachProfile.deleteMany();
  await prisma.identityCatalog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.xPAdjustment.deleteMany();
  await prisma.reputationAdjustment.deleteMany();
  await prisma.gameResult.deleteMany();
  await prisma.gameSubmission.deleteMany();
  await prisma.leagueMembership.deleteMany();
  await prisma.leagueSetting.deleteMany();
  await prisma.season.deleteMany();
  await prisma.franchise.deleteMany();
  await prisma.user.deleteMany();

  for (const team of NFL_TEAMS) {
    await prisma.franchise.create({ data: team });
  }

  const season = await prisma.season.create({
    data: {
      number: 1,
      name: "Season 1",
      isActive: true,
    },
  });

  await prisma.leagueSetting.create({
    data: {
      key: "default",
      leagueName: "Kings Madden League",
      currentSeason: 1,
      currentWeek: 3,
      xpGamePlayed: 1,
      xpWinBonus: 4,
      startingRepScore: 75,
      startingGmRepScore: 75,
      hotSeatThreshold: 59,
      firingThreshold: 44,
      watchThreshold: 70,
      carouselMinCoachRep: 75,
      buyoutMinCoachRep: 75,
      buyoutXpCost: 25,
      startingContractYears: 3,
      carouselOpen: true,
      rulesMarkdown: DEFAULT_RULES,
    },
  });

  const commissioner = await prisma.user.create({
    data: {
      email: "commissioner@kml.local",
      name: "Commissioner King",
      role: Role.COMMISSIONER,
    },
  });

  const coaches = await Promise.all(
    [
      { email: "coach.buf@kml.local", name: "Alex Rivers", team: "BUF" },
      { email: "coach.kc@kml.local", name: "Jordan Hale", team: "KC" },
      { email: "coach.phi@kml.local", name: "Sam Ortiz", team: "PHI" },
      { email: "coach.sf@kml.local", name: "Casey Brooks", team: "SF" },
      { email: "coach.det@kml.local", name: "Riley Quinn", team: "DET" },
    ].map((c) =>
      prisma.user.create({
        data: { email: c.email, name: c.name, role: Role.USER },
      }).then(async (user) => ({ user, abbr: c.team }))
    )
  );

  const franchises = await prisma.franchise.findMany();
  const byAbbr = Object.fromEntries(franchises.map((f) => [f.abbreviation, f]));

  const teamIdentities = await Promise.all(
    [
      {
        name: "Win Now",
        slug: "team-win-now",
        coreBenefit: "Aggressive veteran moves and playoff push focus.",
        restriction: "Must target playoffs in 2 of every 3 seasons.",
        changeRule: "Offseason only, once every 2 seasons.",
        xpCost: 15,
        level: "Elite",
        minRepScore: 85,
      },
      {
        name: "Balanced",
        slug: "team-balanced",
        coreBenefit: "Flexible roster strategy with moderate expectations.",
        restriction: "Avoid repeated bottom-tier finishes.",
        changeRule: "Offseason only, once every 2 seasons.",
        xpCost: 10,
        level: "Strong",
        minRepScore: 70,
      },
      {
        name: "Rebuilding",
        slug: "team-rebuilding",
        coreBenefit: "Youth development patience and long-term planning.",
        restriction: "Progress required year-over-year.",
        changeRule: "Locked for 2 seasons once chosen.",
        xpCost: 5,
        level: "Secure",
        minRepScore: 55,
      },
      {
        name: "Draft & Develop",
        slug: "team-draft-develop",
        coreBenefit: "Extra rookie development focus and scheme continuity.",
        restriction: "Limited splash veteran acquisitions.",
        changeRule: "Offseason only.",
        xpCost: 8,
        level: "Builder",
        minRepScore: 60,
      },
    ].map((identity) =>
      prisma.identityCatalog.create({
        data: {
          ...identity,
          type: IdentityType.TEAM,
          status: IdentityStatus.AVAILABLE,
        },
      })
    )
  );

  const coachIdentities = await Promise.all(
    [
      {
        name: "QB Whisperer",
        slug: "coach-qb-whisperer",
        coreBenefit: "Quarterback growth and passing consistency emphasis.",
        restriction: "Must keep pass efficiency above league baseline.",
        changeRule: "Offseason only unless commissioner waiver.",
        xpCost: 10,
        level: "Specialist",
        minRepScore: 70,
      },
      {
        name: "RB Guru",
        slug: "coach-rb-guru",
        coreBenefit: "Run-game efficiency and RB progression boosts.",
        restriction: "Must maintain run-game identity share.",
        changeRule: "Offseason only unless commissioner waiver.",
        xpCost: 10,
        level: "Specialist",
        minRepScore: 70,
      },
      {
        name: "Skill Developer",
        slug: "coach-skill-developer",
        coreBenefit: "WR/TE development and depth acceleration.",
        restriction: "Requires active rotation management.",
        changeRule: "Offseason only.",
        xpCost: 8,
        level: "Builder",
        minRepScore: 60,
      },
      {
        name: "Trench Builder",
        slug: "coach-trench-builder",
        coreBenefit: "OL/DL unit progression and physical identity.",
        restriction: "Prioritize line investment over splash skill adds.",
        changeRule: "Offseason only.",
        xpCost: 8,
        level: "Builder",
        minRepScore: 60,
      },
      {
        name: "Defensive Guru",
        slug: "coach-defensive-guru",
        coreBenefit: "Defensive consistency and takeaway pressure.",
        restriction: "Must maintain top-half defensive standards.",
        changeRule: "Offseason only unless waiver.",
        xpCost: 12,
        level: "Elite",
        minRepScore: 75,
      },
    ].map((identity) =>
      prisma.identityCatalog.create({
        data: {
          ...identity,
          type: IdentityType.COACH,
          status: IdentityStatus.AVAILABLE,
        },
      })
    )
  );

  // Assign a few team identities for demo visibility.
  await prisma.franchise.update({
    where: { id: byAbbr.BUF.id },
    data: { teamIdentityId: teamIdentities[0].id },
  });
  await prisma.franchise.update({
    where: { id: byAbbr.KC.id },
    data: { teamIdentityId: teamIdentities[0].id },
  });
  await prisma.franchise.update({
    where: { id: byAbbr.PHI.id },
    data: { teamIdentityId: teamIdentities[1].id },
  });
  await prisma.franchise.update({
    where: { id: byAbbr.SF.id },
    data: { teamIdentityId: teamIdentities[3].id },
  });
  await prisma.franchise.update({
    where: { id: byAbbr.DET.id },
    data: { teamIdentityId: teamIdentities[2].id },
  });

  for (const [index, { user, abbr }] of coaches.entries()) {
    await prisma.leagueMembership.create({
      data: {
        userId: user.id,
        franchiseId: byAbbr[abbr].id,
        seasonId: season.id,
        isActive: true,
        startedWeek: 1,
      },
    });

    await prisma.reputationAdjustment.create({
      data: {
        userId: user.id,
        amount: 0,
        gmAmount: 0,
        category: ReputationCategory.GENERAL,
        seasonId: season.id,
        week: 1,
        reason: "Starting reputation baseline",
        createdById: commissioner.id,
      },
    });

    await prisma.coachProfile.create({
      data: {
        userId: user.id,
        discordName: `@${(user.name ?? "coach").toLowerCase().replace(/\s+/g, "")}`,
        selectionPick: index + 1,
        coachIdentityId: coachIdentities[index % coachIdentities.length].id,
        expectationScore: 72 - index * 2,
        contractYearsLeft: 3,
      },
    });

    await prisma.coachSeasonReview.create({
      data: {
        userId: user.id,
        seasonId: season.id,
        playoffResult: PlayoffResult.NONE,
        expectationResult: ExpectationResult.PENDING,
      },
    });
  }

  // Sample approved games for week 1–2
  const sampleGames = [
    { submitter: coaches[0], opp: "MIA", userScore: 28, oppScore: 21, week: 1 },
    { submitter: coaches[1], opp: "DEN", userScore: 31, oppScore: 17, week: 1 },
    { submitter: coaches[2], opp: "DAL", userScore: 24, oppScore: 27, week: 1 },
    { submitter: coaches[3], opp: "SEA", userScore: 20, oppScore: 13, week: 2 },
    { submitter: coaches[4], opp: "CHI", userScore: 35, oppScore: 14, week: 2 },
  ];

  for (const game of sampleGames) {
    const userTeam = byAbbr[game.submitter.abbr];
    const oppTeam = byAbbr[game.opp];
    const won = game.userScore > game.oppScore;

    const submission = await prisma.gameSubmission.create({
      data: {
        seasonId: season.id,
        week: game.week,
        gameType: GameType.REGULAR_SEASON,
        submitterId: game.submitter.user.id,
        userTeamId: userTeam.id,
        opponentTeamId: oppTeam.id,
        userScore: game.userScore,
        opponentScore: game.oppScore,
        notes: "Seeded demo result",
        status: SubmissionStatus.APPROVED,
        reviewedById: commissioner.id,
        reviewedAt: new Date(),
        decisionNote: "Approved in seed",
      },
    });

    await prisma.gameResult.create({
      data: {
        submissionId: submission.id,
        seasonId: season.id,
        week: game.week,
        gameType: GameType.REGULAR_SEASON,
        homeTeamId: userTeam.id,
        awayTeamId: oppTeam.id,
        homeScore: game.userScore,
        awayScore: game.oppScore,
        winnerTeamId: won ? userTeam.id : game.userScore < game.oppScore ? oppTeam.id : null,
      },
    });

    await prisma.xPAdjustment.create({
      data: {
        userId: game.submitter.user.id,
        franchiseId: userTeam.id,
        seasonId: season.id,
        amount: 1,
        reason: `Week ${game.week} game played`,
        isAutomatic: true,
        submissionId: submission.id,
        createdById: commissioner.id,
      },
    });

    if (won) {
      await prisma.xPAdjustment.create({
        data: {
          userId: game.submitter.user.id,
          franchiseId: userTeam.id,
          seasonId: season.id,
          amount: 4,
          reason: `Week ${game.week} win bonus`,
          isAutomatic: true,
          submissionId: submission.id,
          createdById: commissioner.id,
        },
      });
    }
  }

  // Pending submission for approval demo
  await prisma.gameSubmission.create({
    data: {
      seasonId: season.id,
      week: 3,
      gameType: GameType.REGULAR_SEASON,
      submitterId: coaches[0].user.id,
      userTeamId: byAbbr.BUF.id,
      opponentTeamId: byAbbr.NYJ.id,
      userScore: 24,
      opponentScore: 20,
      notes: "Close divisional win — awaiting approval",
      status: SubmissionStatus.PENDING,
    },
  });

  // Manual XP / reputation samples
  await prisma.xPAdjustment.create({
    data: {
      userId: coaches[1].user.id,
      franchiseId: byAbbr.KC.id,
      seasonId: season.id,
      amount: 3,
      reason: "Streamed league night",
      isAutomatic: false,
      createdById: commissioner.id,
    },
  });

  await prisma.reputationAdjustment.create({
    data: {
      userId: coaches[2].user.id,
      amount: -5,
      gmAmount: -2,
      category: ReputationCategory.CONDUCT,
      seasonId: season.id,
      week: 2,
      reason: "Late game without communication",
      evidenceUrl: "https://example.com/league/late-game-note",
      createdById: commissioner.id,
    },
  });

  await prisma.reputationAdjustment.create({
    data: {
      userId: coaches[3].user.id,
      amount: 8,
      gmAmount: 3,
      category: ReputationCategory.BONUS,
      seasonId: season.id,
      week: 2,
      reason: "Strong sportsmanship and timely submissions",
      createdById: commissioner.id,
    },
  });

  const vacancy = await prisma.carouselVacancy.create({
    data: {
      seasonId: season.id,
      franchiseId: byAbbr.CHI.id,
      reason: "Opening after offseason firing",
      isOpen: true,
    },
  });

  await prisma.carouselApplication.create({
    data: {
      seasonId: season.id,
      applicantId: coaches[0].user.id,
      currentTeamId: byAbbr.BUF.id,
      vacancyId: vacancy.id,
      requestedTeamId: byAbbr.CHI.id,
      moveType: CarouselMoveType.VACANCY_APPLICATION,
      buyoutEligible: true,
      xpCost: 25,
      priorityScore: 81.2,
      status: CarouselApplicationStatus.PENDING,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: commissioner.id,
      action: "SEED_DATABASE",
      entityType: "League",
      entityId: "default",
      metadata: {
        season: 1,
        teams: 32,
        sampleUsers: coaches.length + 1,
        coachIdentityCatalog: coachIdentities.length,
        teamIdentityCatalog: teamIdentities.length,
      },
    },
  });

  console.log("Seed complete.");
  console.log("Commissioner (dev login): commissioner@kml.local");
  console.log("Sample coaches: coach.buf@kml.local, coach.kc@kml.local, coach.phi@kml.local, ...");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
