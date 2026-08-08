export type TeamIdentityRule = {
  slug: string;
  name: string;
  shortLabel: string;
  summary: string;
  philosophy: string;
  benefits: string[];
  restrictions: string[];
  recommended?: string;
};

export const TEAM_IDENTITY_CHANGE_RULE =
  "A Team Identity may only be changed once every three seasons, unless approved by the league due to extraordinary circumstances (new ownership, coaching change, etc.).";

export const TEAM_IDENTITY_INTRO = [
  "Team Identity represents your franchise’s long-term philosophy. Every franchise must choose one Team Identity at the start of each offseason. Your identity determines how you build your roster, which resources are available to you, and what restrictions you must operate under.",
  "Team Identities are designed to create meaningful choices—not every team should have access to every advantage. Every path has strengths, weaknesses, and consequences, just like in the NFL.",
] as const;

export const TEAM_IDENTITY_RULES: TeamIdentityRule[] = [
  {
    slug: "team-win-now",
    name: "Win Now",
    shortLabel: "Win now",
    summary:
      "Your organization is fully committed to competing for a championship immediately. Future assets are less valuable than proven NFL talent.",
    philosophy: "Championships are won today—not three years from now.",
    benefits: [
      "Full access to all unrestricted free agents from Day 1 of Free Agency.",
      "May pursue any player regardless of age or overall.",
      "Highest priority for veteran acquisitions.",
      "No restrictions on trading for veteran players.",
      "Eligible for premium veteran trade opportunities.",
    ],
    restrictions: [
      "No Rookie Development Camps.",
      "No Veteran Development Camps.",
      "Draft picks cost 25% more XP to acquire in trades.",
      "Cannot receive any offseason developmental bonuses for rookies.",
    ],
    recommended:
      "Recommended for teams expecting to compete for a Super Bowl immediately.",
  },
  {
    slug: "team-rebuilding",
    name: "Rebuilding",
    shortLabel: "Rebuild",
    summary:
      "Your organization is focused on creating a sustainable contender through young talent while remaining competitive.",
    philosophy: "Build the foundation first. Championships come later.",
    benefits: [
      "During the first 3 days of Free Agency, you may only offer contracts to players 28 years old or younger.",
      "Receive 1 Offensive Veteran Development Camp.",
      "Receive 1 Defensive Veteran Development Camp.",
      "Receive 1 Offensive Rookie Camp.",
      "Receive 1 Defensive Rookie Camp.",
      "Rookie contracts become significantly more valuable.",
      "Receive a 25% XP discount when trading for players under 25 years old.",
      "Slightly reduced XP cost when trading future draft picks.",
    ],
    restrictions: [
      "Cannot sign veteran players over 28 during the first three days of Free Agency.",
      "Limited access to elite aging veterans early in Free Agency.",
      "Veteran rentals are discouraged.",
    ],
  },
  {
    slug: "team-draft-develop",
    name: "Draft & Develop",
    shortLabel: "Draft & develop",
    summary:
      "Your draft class is your Free Agency. Every resource is invested into identifying, drafting, and developing young talent.",
    philosophy: "The Draft is your Free Agency.",
    benefits: [
      "During the first 3 days of Free Agency, you cannot offer contracts to players who are 85 Overall or higher, or 28 years old or older.",
      "Receive 3 Offensive Rookie Camps.",
      "Receive 3 Defensive Rookie Camps.",
      "50% XP discount when trading for draft picks.",
      "Rookie contract players receive maximum developmental opportunities.",
      "Additional offseason scouting resources.",
      "Cheapest identity for accumulating draft capital.",
    ],
    restrictions: [
      "Minimal access to premium veteran talent.",
      "Cannot aggressively build through Free Agency.",
      "Must rely heavily on the draft for roster improvement.",
    ],
  },
  {
    slug: "team-balanced",
    name: "Balanced",
    shortLabel: "Balanced",
    summary:
      "A balanced franchise blends veteran leadership with young talent. These organizations avoid extreme rebuilding while remaining flexible enough to compete every season.",
    philosophy: "Compete today without sacrificing tomorrow.",
    benefits: [
      "Full access to Free Agency.",
      "May pursue veterans and younger players equally.",
      "Receive 1 Offensive Rookie Camp.",
      "Receive 1 Defensive Rookie Camp.",
      "Receive 1 Veteran Development Camp (offense or defense of your choice).",
      "Standard trade costs for veterans and draft picks.",
      "Eligible for every type of roster-building strategy.",
      "Can pivot toward contention or rebuilding more easily than any other identity.",
    ],
    restrictions: [
      "Does not receive the elite veteran access of Win Now.",
      "Does not receive the developmental advantages of Rebuilding.",
      "Does not receive the draft discounts of Draft & Develop.",
    ],
  },
];

export const TEAM_IDENTITY_LEAGUE_NOTES = [
  "Team Identity affects Free Agency, Trades, Development Camps, and Draft Strategy.",
  "Your chosen identity should reflect how your franchise realistically operates.",
  "Every identity is intentionally balanced so no single strategy is objectively better than another.",
  "Teams are expected to make roster decisions that align with their selected identity. League commissioners may deny transactions that clearly contradict a team’s declared philosophy.",
  "Your Team Identity is a commitment. Choosing one path means giving up the advantages of another, creating a league where every franchise has a unique roster-building philosophy and long-term strategy.",
] as const;

/** Short catalog fields synced into IdentityCatalog for assignments UI. */
export function teamIdentityCatalogFields(rule: TeamIdentityRule) {
  return {
    name: rule.name,
    slug: rule.slug,
    coreBenefit: rule.benefits[0] ?? rule.summary,
    restriction: rule.restrictions[0] ?? "See Team Identity rules.",
    changeRule: TEAM_IDENTITY_CHANGE_RULE,
    xpCost: 0,
    level: rule.shortLabel,
    minRepScore: 0,
  };
}
