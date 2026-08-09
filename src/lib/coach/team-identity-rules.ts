export type TeamIdentityRule = {
  slug: string;
  name: string;
  shortLabel: string;
  tagline: string;
  summary: string;
  philosophy: string;
  freeAgency: string[];
  development: string[];
  trades: string[];
  restrictions: string[];
  tradeExample?: string;
  chooseIf?: string[];
};

export const TEAM_IDENTITY_CHANGE_RULE =
  "A Team Identity may only be changed once every three seasons, unless approved by the league due to extraordinary circumstances (new ownership, coaching change, etc.).";

export const TEAM_IDENTITY_INTRO = [
  "Team Identity represents your franchise’s long-term philosophy. Every franchise must choose one Team Identity at the start of each offseason. Your identity determines how you build your roster, which resources are available to you, and what restrictions you must operate under.",
  "Team Identities create meaningful choices — not every team should have access to every advantage. Every path has strengths, weaknesses, and consequences.",
] as const;

export const TEAM_IDENTITY_SNAPSHOT: Array<{
  slug: string;
  name: string;
  veterans: string;
  draftCapital: string;
  development: string;
  bestFor: string;
}> = [
  {
    slug: "team-win-now",
    name: "Win Now",
    veterans: "Cheaper",
    draftCapital: "More expensive",
    development: "None",
    bestFor: "Championship window open",
  },
  {
    slug: "team-balanced",
    name: "Balanced",
    veterans: "Market price",
    draftCapital: "Market price",
    development: "3 camps",
    bestFor: "Compete without mortgaging future",
  },
  {
    slug: "team-rebuilding",
    name: "Rebuilding",
    veterans: "Age-limited early FA",
    draftCapital: "Slightly cheaper",
    development: "4 camps",
    bestFor: "Young core + stay competitive",
  },
  {
    slug: "team-draft-develop",
    name: "Draft & Develop",
    veterans: "Heavily limited early FA",
    draftCapital: "50% cheaper",
    development: "6 rookie camps",
    bestFor: "Draft is your Free Agency",
  },
];

export const TEAM_IDENTITY_RULES: TeamIdentityRule[] = [
  {
    slug: "team-win-now",
    name: "Win Now",
    shortLabel: "Win now",
    tagline: "My window is NOW.",
    summary:
      "Your organization is fully committed to competing for a championship immediately. Future assets are less valuable than proven NFL talent.",
    philosophy: "Championships are won today—not three years from now.",
    freeAgency: [
      "Full access to all unrestricted free agents from Day 1 of Free Agency.",
      "May pursue any player regardless of age or overall.",
      "Highest priority for veteran acquisitions.",
    ],
    development: [
      "No Rookie Development Camps.",
      "No Veteran Development Camps.",
      "Cannot receive any offseason developmental bonuses for rookies.",
    ],
    trades: [
      "25% Trade Point discount when acquiring veteran / high-impact players.",
      "Draft picks cost 25% more Trade Points to acquire.",
      "No restrictions on trading for veteran players.",
      "Eligible for premium veteran trade opportunities.",
    ],
    restrictions: [
      "Sacrifices development camps and cheap draft capital for immediate roster strength.",
      "Paying a premium whenever you want future draft picks.",
    ],
    tradeExample:
      "A Superstar valued at 10 Trade Points costs Win Now 8. A 1st-round pick valued at 10 costs Win Now about 13.",
    chooseIf: [
      "Your roster is already close to championship caliber.",
      "You believe proven players are more valuable than future assets.",
      "You want discounted access to established talent right now.",
    ],
  },
  {
    slug: "team-balanced",
    name: "Balanced",
    shortLabel: "Balanced",
    tagline: "Win without mortgaging the future.",
    summary:
      "A Balanced franchise blends veteran leadership with young talent. These organizations avoid extreme rebuilding while remaining flexible enough to compete every season. Unlike Win Now, Balanced teams aren’t mortgaging their future for an immediate championship window.",
    philosophy: "Compete today without sacrificing tomorrow.",
    freeAgency: [
      "Full access to Free Agency.",
      "May pursue veterans and younger players equally.",
      "No age-based Free Agency restrictions.",
    ],
    development: [
      "1 Offensive Rookie Camp.",
      "1 Defensive Rookie Camp.",
      "1 Veteran Development Camp — offense or defense of your choice.",
    ],
    trades: [
      "Veteran players = standard Trade Point cost.",
      "Young players = standard Trade Point cost.",
      "Draft picks = standard Trade Point cost.",
      "No age-based or overall-based trade penalties.",
      "May freely trade between veterans, young players, and draft capital.",
      "Eligible for every normal type of trade opportunity.",
    ],
    restrictions: [
      "Does NOT receive Win Now’s 25% veteran / high-impact player discount.",
      "Does NOT receive Draft & Develop’s 50% draft-pick discount.",
      "Does NOT receive the larger developmental packages available to developmental identities.",
      "Must pay full market value for premium talent.",
    ],
    tradeExample:
      "A Superstar valued at 10 Trade Points costs Balanced 10. A 1st-round pick valued at 10 also costs Balanced 10. No discount — and no premium.",
    chooseIf: [
      "You want to compete without committing fully to Win Now or a rebuild.",
      "You want development resources that Win Now gives up.",
      "You want market-price flexibility for both veterans and draft capital.",
    ],
  },
  {
    slug: "team-rebuilding",
    name: "Rebuilding",
    shortLabel: "Rebuild",
    tagline: "Build the foundation first.",
    summary:
      "Your organization is focused on creating a sustainable contender through young talent while remaining competitive.",
    philosophy: "Build the foundation first. Championships come later.",
    freeAgency: [
      "During the first 3 days of Free Agency, you may only offer contracts to players 28 years old or younger.",
      "Limited access to elite aging veterans early in Free Agency.",
    ],
    development: [
      "1 Offensive Veteran Development Camp.",
      "1 Defensive Veteran Development Camp.",
      "1 Offensive Rookie Camp.",
      "1 Defensive Rookie Camp.",
      "Rookie contracts become significantly more valuable.",
    ],
    trades: [
      "25% XP / Trade Point discount when trading for players under 25 years old.",
      "Slightly reduced cost when trading future draft picks.",
    ],
    restrictions: [
      "Cannot sign veteran players over 28 during the first three days of Free Agency.",
      "Veteran rentals are discouraged.",
    ],
    chooseIf: [
      "You want a young core without going full Draft & Develop.",
      "You still want some veteran development support.",
    ],
  },
  {
    slug: "team-draft-develop",
    name: "Draft & Develop",
    shortLabel: "Draft & develop",
    tagline: "The Draft is your Free Agency.",
    summary:
      "Your draft class is your Free Agency. Every resource is invested into identifying, drafting, and developing young talent.",
    philosophy: "The Draft is your Free Agency.",
    freeAgency: [
      "During the first 3 hours of Free Agency, you cannot offer contracts to players who are 85 Overall or higher.",
      "During the first 3 hours of Free Agency, you cannot offer contracts to players who are 28 years old or older.",
    ],
    development: [
      "3 Offensive Rookie Camps.",
      "3 Defensive Rookie Camps.",
      "Rookie contract players receive maximum developmental opportunities.",
      "Additional offseason scouting resources.",
    ],
    trades: [
      "50% Trade Point / XP discount when trading for draft picks.",
      "Cheapest identity for accumulating draft capital.",
    ],
    restrictions: [
      "Minimal access to premium veteran talent.",
      "Cannot aggressively build through Free Agency.",
      "Must rely heavily on the draft for roster improvement.",
    ],
    chooseIf: [
      "You want the best draft-capital discounts in the league.",
      "You’re willing to live with limited early Free Agency access.",
    ],
  },
];

export const WIN_NOW_VS_BALANCED = {
  title: "Win Now vs. Balanced",
  intro:
    "This is the important decision for contending teams. Neither identity is automatically better — Win Now has the higher immediate ceiling; Balanced has better long-term flexibility.",
  examples: [
    {
      label: "Established Superstar available (normal value: 10 Trade Points)",
      winNow: "8 Trade Points — Win Now has the advantage",
      balanced: "10 Trade Points — full market price",
    },
    {
      label: "Future 1st-round pick (normal value: 10 Trade Points)",
      winNow: "13 Trade Points — Win Now pays a premium",
      balanced: "10 Trade Points — Balanced has the advantage",
    },
    {
      label: "Offseason development",
      winNow: "0 Development Camps",
      balanced: "3 Development Camps",
    },
  ],
  winNowSummary: [
    "Veterans cheaper",
    "Draft capital more expensive",
    "Development sacrificed",
    "Immediate roster strength prioritized",
  ],
  balancedSummary: [
    "Veterans at market price",
    "Draft capital at market price",
    "Moderate development",
    "Maximum roster flexibility",
  ],
} as const;

export const TEAM_IDENTITY_LEAGUE_NOTES = [
  "Team Identity affects Free Agency, Trades, Development Camps, and Draft Strategy.",
  "Your chosen identity should reflect how your franchise realistically operates.",
  "Every identity is intentionally balanced so no single strategy is objectively better than another.",
  "Teams are expected to make roster decisions that align with their selected identity. League commissioners may deny transactions that clearly contradict a team’s declared philosophy.",
  "Your Team Identity is a commitment. Choosing one path means giving up the advantages of another.",
] as const;

/** Short catalog fields synced into IdentityCatalog for assignments UI. */
export function teamIdentityCatalogFields(rule: TeamIdentityRule) {
  return {
    name: rule.name,
    slug: rule.slug,
    coreBenefit: rule.freeAgency[0] ?? rule.summary,
    restriction: rule.restrictions[0] ?? "See Team Identity rules.",
    changeRule: TEAM_IDENTITY_CHANGE_RULE,
    xpCost: 0,
    level: rule.shortLabel,
    minRepScore: 0,
  };
}

export function getTeamIdentityRuleBySlug(slug?: string | null) {
  if (!slug) return null;
  return TEAM_IDENTITY_RULES.find((rule) => rule.slug === slug) ?? null;
}
