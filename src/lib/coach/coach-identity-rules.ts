export type CoachIdentityRule = {
  slug: string;
  name: string;
  shortLabel: string;
  summary: string;
  philosophy: string;
  benefits: string[];
  restrictions: string[];
};

export const COACH_IDENTITY_CHANGE_RULE =
  "A Coaching Identity may only be changed once every three seasons, and changing identities resets any unused coaching camp opportunities from the previous offseason.";

export const COACH_IDENTITY_INTRO = [
  "Every head coach has a philosophy. Some coaches build elite quarterbacks. Others dominate in the trenches. Some maximize skill talent, while others build championship defenses.",
  "Each coach must choose one Coaching Identity at the start of the league. This identity represents your coaching specialty and determines which offseason development opportunities your team receives.",
  "Unlike Team Identity, Coaching Identity affects how players improve, not how your roster is acquired.",
] as const;

export const COACH_IDENTITY_RULES: CoachIdentityRule[] = [
  {
    slug: "coach-qb-whisperer",
    name: "QB Whisperer",
    shortLabel: "QB whisperer",
    summary:
      "Your reputation is developing quarterbacks. Young passers reach their potential faster under your system.",
    philosophy: "Elite quarterbacks elevate entire organizations.",
    benefits: [
      "Access to 2 Quarterback Development Camps every offseason.",
      "Veteran quarterbacks (30+) may also attend QB Camp for maintenance instead of regression protection.",
      "Rookie quarterbacks receive priority for offseason development.",
      "25% XP discount on quarterback progression upgrades purchased with league XP.",
      "Can mentor one backup QB each offseason, giving him a chance at a small awareness/throw accuracy boost.",
    ],
    restrictions: [
      "No development camps for wide receivers or running backs.",
      "Offensive line camps reduced by one if your Team Identity would normally grant one.",
      "Investing heavily in the quarterback means fewer resources elsewhere.",
    ],
  },
  {
    slug: "coach-skill-developer",
    name: "Skill Developer",
    shortLabel: "Skill developer",
    summary: "You specialize in maximizing explosive playmakers.",
    philosophy: "Speed, separation, and explosive playmakers change games.",
    benefits: [
      "Access to 2 Offensive Skill Camps every offseason.",
      "Eligible positions: WR, RB, TE.",
      "Offensive skill players receive priority for offseason development.",
      "Offensive skill players under age 25 cost 20% less XP to upgrade.",
    ],
    restrictions: [
      "No quarterback-specific camps.",
      "No offensive line development camps.",
      "Defensive camps reduced by one.",
    ],
  },
  {
    slug: "coach-trench-builder",
    name: "Trench Builder",
    shortLabel: "Trench builder",
    summary: "Games are won at the line of scrimmage.",
    philosophy: "Win the trenches and everything else becomes easier.",
    benefits: [
      "Access to 2 Offensive Line Camps.",
      "Access to 2 Defensive Line Camps.",
      "Offensive and defensive linemen cost 20% less XP to improve.",
      "Veteran offensive linemen may attend maintenance camps to help extend their effectiveness.",
    ],
    restrictions: [
      "No WR/RB development camps.",
      "Quarterback camp unavailable.",
      "Secondary receives no offseason development.",
    ],
  },
  {
    slug: "coach-defensive-guru",
    name: "Defensive Guru",
    shortLabel: "Defensive guru",
    summary: "Defense wins championships.",
    philosophy: "Championship defenses create championship teams.",
    benefits: [
      "Access to 3 Defensive Development Camps every offseason.",
      "Camps may be used on Defensive Line, Linebackers, Cornerbacks, and Safeties.",
      "Defensive players under age 27 cost 20% less XP to improve.",
      "One defensive player may attend an Elite Camp for an additional development opportunity.",
    ],
    restrictions: [
      "Offensive camps reduced to one total.",
      "No quarterback camp.",
      "Skill position camps unavailable.",
    ],
  },
  {
    slug: "coach-rb-guru",
    name: "RB Guru",
    shortLabel: "RB guru",
    summary: "Your offense is built around the running game.",
    philosophy: "Control the clock. Wear defenses down. Run the football.",
    benefits: [
      "Access to 2 Running Back Camps.",
      "Access to 1 Offensive Line Camp.",
      "Running backs under age 27 receive a 25% XP discount.",
      "Rookie RBs receive priority for offseason development.",
      "Veteran RBs may attend maintenance camps to help extend their effectiveness.",
    ],
    restrictions: [
      "No quarterback camps.",
      "Wide receiver camps unavailable.",
      "Tight end development unavailable.",
    ],
  },
  {
    slug: "coach-culture-builder",
    name: "Culture Builder",
    shortLabel: "Culture builder",
    summary:
      "Your greatest strength isn’t a position group—it’s creating an environment where players maximize their potential. You build accountability, leadership, and chemistry throughout the entire organization.",
    philosophy:
      "Great teams aren’t built around one superstar—they’re built around a championship culture where everyone improves together.",
    benefits: [
      "Receive 2 Flexible Development Camps every offseason.",
      "These camps may be used on any position (offense or defense).",
      "Receive 1 Leadership Camp, which may be assigned to any player under 30 years old.",
      "Veteran players (30+) cost 15% less XP to retain or maintain.",
      "No positional restrictions when assigning camps.",
    ],
    restrictions: [
      "Cannot assign more than one camp to the same position group during the same offseason (example: both Flexible Camps cannot be used on wide receivers).",
      "Does not receive the specialized discounts or extra camps available to the other coaching identities.",
      "Sacrifices elite positional development in exchange for maximum roster flexibility.",
    ],
  },
];

export const COACH_IDENTITY_LEAGUE_NOTES = [
  "Coaching Identity affects player development only.",
  "Team Identity affects roster construction.",
  "Every coach must commit to a philosophy, and each philosophy comes with meaningful strengths and weaknesses.",
  "Coaching Identities may only be changed once every three seasons.",
  "There is no best Coaching Identity. Success depends on building a roster that complements both your Coaching Identity and your Team Identity.",
] as const;

export const COACH_IDENTITY_EXAMPLES = [
  "Win Now + Defensive Guru → Build an elite veteran defense to compete for championships immediately.",
  "Draft & Develop + QB Whisperer → Draft and patiently develop your franchise quarterback.",
  "Balanced + Skill Developer → Develop explosive offensive weapons while maintaining roster flexibility.",
  "Rebuilding + Trench Builder → Build dominant offensive and defensive lines before investing in skill positions.",
  "Balanced + Culture Builder → Adapt to your roster’s needs each offseason while maintaining long-term organizational stability.",
] as const;

export const COACH_IDENTITY_CLOSING =
  "Choose wisely. Your Coaching Identity defines how your players develop, just as your Team Identity defines how your roster is built. The best organizations align both into one clear vision.";

/** Short catalog fields synced into IdentityCatalog for assignments UI. */
export function coachIdentityCatalogFields(rule: CoachIdentityRule) {
  return {
    name: rule.name,
    slug: rule.slug,
    coreBenefit: rule.benefits[0] ?? rule.summary,
    restriction: rule.restrictions[0] ?? "See Coaching Identity rules.",
    changeRule: COACH_IDENTITY_CHANGE_RULE,
    xpCost: 0,
    level: rule.shortLabel,
    minRepScore: 0,
  };
}

export function getCoachIdentityRuleBySlug(slug?: string | null) {
  if (!slug) return null;
  return COACH_IDENTITY_RULES.find((rule) => rule.slug === slug) ?? null;
}
