export type HotSeatRuleSection = {
  id: string;
  title: string;
  summary?: string;
  paragraphs?: string[];
  items?: string[];
  bands?: Array<{ range: string; label: string; detail: string }>;
  examples?: string[];
  note?: string;
};

export const COACHING_REP_INTRO = {
  title: "Coaching Reputation",
  body: "Coaching Reputation is a live rating that follows YOU, not the franchise. Every coach starts at 85 (B). Normal wins and losses do not move it — you have to do something noteworthy, good or bad.",
  note: "Big moments stack. An average team beating a contender by 24 on Primetime can land Beat Contender +2, Primetime Win +2, and Blowout +1 in the same game. The same stacking applies on the way down.",
} as const;

export const COACHING_REP_GRADES = [
  { range: "97–100", label: "A+", detail: "Elite" },
  { range: "93–96", label: "A", detail: "Championship Level" },
  { range: "87–92", label: "B+", detail: "Highly Respected" },
  { range: "83–86", label: "B", detail: "Stable" },
  { range: "75–82", label: "C", detail: "Hot Seat" },
  { range: "70–74", label: "D", detail: "Firing Territory" },
  { range: "Below 70", label: "F", detail: "Termination Level" },
] as const;

export const COACHING_REP_RULE_SECTIONS: HotSeatRuleSection[] = [
  {
    id: "rep-gains",
    title: "Reputation gains",
    summary: "Noteworthy wins move the needle. Ordinary wins do not.",
    items: [
      "Beat a Contender: +2 — an average or lower-level team knocks off a championship-caliber opponent",
      "Major Upset: +3 — a struggling team defeats one of KML’s top teams (replaces Beat a Contender)",
      "Primetime Win: +2 — winning an official KML Primetime matchup",
      "Primetime Upset: +3 — pulling off an upset when the league is watching (replaces Primetime Win)",
      "3-game winning streak: +1 · 5-game: +2 additional · 8-game: +2 additional",
      "Each streak milestone can only be earned once during that streak",
      "Blowout win (21+): +1 — only against a competitive opponent. Running it up on an overmatched team does not count",
    ],
  },
  {
    id: "rep-losses",
    title: "Reputation losses",
    summary: "Pressure comes from how you lose, when you lose, and whether it is becoming a pattern.",
    items: [
      "Major Upset Loss: -3 — an established team takes a major unexpected defeat",
      "Primetime Loss: -2",
      "Primetime Blowout Loss: -3 (replaces Primetime Loss when the margin is 21+)",
      "3-game losing streak: -1 · 5-game: -2 additional · 8-game: -2 additional",
      "Blowout loss (21+): -2",
      "Embarrassing loss (35+): -3 instead of the 21+ blowout penalty",
    ],
  },
  {
    id: "rep-trajectory",
    title: "Season trajectory",
    summary: "Reputation also tracks whether a coach is changing the direction of the season. Each tier is awarded at most once per season.",
    items: [
      "Season Turnaround: +2 — example: start 2–5, recover to .500 or better",
      "Major Turnaround: +3 — example: start 1–6 and fight back into contention",
      "Season Collapse: -2 — example: start 6–2 and fall to .500",
      "Major Collapse: -3 — example: start 8–2 and slide under .500 late",
    ],
  },
  {
    id: "rep-why",
    title: "Why reputation matters",
    summary: "The score feeds job security and Coaching Carousel value. It does not replace commissioner judgment on Bad Sim or conduct.",
    items: [
      "High reputation creates job security, contract opportunities, and market value",
      "Low reputation creates Hot Seat pressure and eventually puts the job in danger",
      "A coach does not lose reputation simply for losing a game",
      "Simply winning games is not enough to become elite — big wins, Primetime, streaks, upsets, and turnarounds build the résumé",
      "Approved games write these adjustments automatically. Voiding a game reverses them. Commissioners can still add manual ledger entries",
    ],
  },
];

export const HOT_SEAT_INTRO = {
  title: "In-season Hot Seat & firing",
  body: "KML coaches are not guaranteed to finish the season simply because they began the year as the franchise’s head coach. Ownership expectations exist throughout the season.",
  note: "A prolonged losing streak, embarrassing losses, poor Sim Scores, or repeated failure to meet organizational expectations can cause a coach’s reputation to decline during the season and potentially result in termination. Coaches will not be fired because of one bad game — in-season firings are reserved for clear patterns of failure.",
} as const;

export const HOT_SEAT_QUICK_FACTS = [
  { label: "Safe", value: "80+" },
  { label: "Pressure", value: "75–79" },
  { label: "Hot Seat", value: "70–74" },
  { label: "Firing eligible", value: "65–69" },
  { label: "Extreme risk", value: "Below 65" },
  { label: "Bad Sim ladder", value: "Warn → -1 → -2+" },
] as const;

export const HOT_SEAT_RULE_SECTIONS: HotSeatRuleSection[] = [
  {
    id: "losing-streaks",
    title: "Losing streaks",
    summary: "Penalties are cumulative. The streak resets once the team wins a game.",
    items: [
      "3 consecutive losses: -1 Reputation (automatic)",
      "5 consecutive losses: additional -2 Reputation (automatic)",
      "8 consecutive losses: additional -2 Reputation (automatic)",
      "An 8-game losing streak therefore totals -5 Reputation from streak milestones",
      "Each milestone is awarded once during that streak. A win resets the streak",
    ],
  },
  {
    id: "blowout-losses",
    title: "Blowout losses",
    summary:
      "Isolated blowouts are treated differently from repeated blowouts. Ownership cares when the team stops looking competitive.",
    items: [
      "Blowout loss (21+): -2 Reputation (automatic)",
      "Embarrassing loss (35+): -3 instead of the 21+ penalty (automatic)",
      "These stack with Primetime, upset, and streak penalties in the same game",
      "Blowout wins (21+) only add +1 against a competitive opponent",
    ],
  },
  {
    id: "sim-scores",
    title: "Bad Sim Scores",
    summary:
      "KML is a simulation football league. A coach’s ability to follow realistic gameplay standards is part of their Coaching Reputation.",
    paragraphs: [
      "Single Poor Sim Score — a single bad Sim Score will generally result in a warning with no reputation deduction. Everyone can have a bad game.",
    ],
    items: [
      "Two Sim Scores of 2 or lower within 4 games: -1 Reputation",
      "Three Sim Scores of 2 or lower within 5 games: additional -2 Reputation",
      "Continued poor Sim play after commissioner warnings: -2 to -5 additional Reputation depending on severity",
    ],
    note: "Gameplay that repeatedly fails to meet KML’s simulation standards can therefore become a legitimate reason for a coach to lose their job. After each game, both coaches report the opponent’s Sim Score — the team that posts the result rates on submit, and the other team rates from the game page. Commissioners apply Bad Sim deductions as Coaching Reputation ledger entries (category SIM_SCORE).",
  },
  {
    id: "hot-seat-bands",
    title: "The in-season Hot Seat",
    summary: "Reputation determines how close a coach is to losing their job.",
    bands: [
      {
        range: "80+",
        label: "Safe",
        detail: "No immediate job-security concerns.",
      },
      {
        range: "75–79",
        label: "Pressure building",
        detail: "Performance is being monitored, but the coach is not yet in immediate danger.",
      },
      {
        range: "70–74",
        label: "Hot Seat",
        detail:
          "The franchise is officially evaluating the coach. Media narratives may begin questioning the coach’s future.",
      },
      {
        range: "65–69",
        label: "Firing eligible",
        detail: "The Commissioner may fire the coach if poor performance continues.",
      },
      {
        range: "Below 65",
        label: "Extreme risk",
        detail: "The coach may be terminated immediately depending on circumstances.",
      },
    ],
  },
  {
    id: "emergency-hot-seat",
    title: "Emergency Hot Seat",
    summary:
      "A coach does not need to begin the season with a poor reputation to find themselves on the Hot Seat. A catastrophic stretch can trigger an Emergency Hot Seat Review.",
    paragraphs: [
      "A review may be triggered when a coach experiences two or more of the following during a 5-game stretch:",
    ],
    items: [
      "5-game losing streak",
      "Multiple 28+ point losses",
      "Three Sim Scores of 2 or lower",
      "Multiple gameplay warnings",
      "Team performing dramatically below expectations",
      "Win Now franchise collapsing despite a championship-caliber roster",
    ],
    note: "The Commissioner will review Coaching Reputation + Team Identity + Roster Expectations + Sim Scores + Recent Results. A coach may then be officially placed on the Hot Seat even if reputation has not yet fallen below 75.",
  },
  {
    id: "midseason-firing",
    title: "Midseason firing",
    summary: "An in-season firing should represent an extreme situation.",
    paragraphs: [
      "A coach becomes eligible for a midseason firing when Reputation reaches 69 or lower AND there is evidence of continued poor performance.",
    ],
    examples: [
      "Extended losing streak",
      "Multiple blowout losses",
      "Consistently poor Sim Scores",
      "Major underachievement",
      "Repeated gameplay violations",
    ],
  },
  {
    id: "immediate-firing",
    title: "Immediate firing exception",
    summary:
      "Extremely poor circumstances may allow the Commissioner to fire a coach before Reputation reaches 69.",
    paragraphs: [
      "This should require at least three major warning signs occurring together, such as:",
    ],
    items: [
      "7+ game losing streak",
      "3+ blowout losses of 28+ points",
      "Repeated Sim Scores of 2 or lower",
      "Multiple gameplay warnings",
      "Extreme underperformance relative to roster expectations",
    ],
    note: "The Commissioner must publicly explain why the firing occurred. This prevents arbitrary firings while still allowing ownership to respond when a franchise completely collapses.",
  },
  {
    id: "turnaround",
    title: "Coaching turnaround",
    summary: "Coaches should have a chance to coach their way off the Hot Seat.",
    items: [
      "3-game winning streak: +1 Reputation (automatic)",
      "5-game winning streak: additional +2 Reputation (automatic)",
      "8-game winning streak: additional +2 Reputation (automatic)",
      "Beat a contender / Primetime / blowouts: see Coaching Reputation above — those now apply automatically on approved games",
      "Hot Seat recovery: if a coach on the Hot Seat goes 4–1 or better over their next 5 games, +2 Reputation and Hot Seat designation may be removed",
    ],
    note: "This creates legitimate comeback storylines — a coach could enter Week 10 looking destined to be fired and completely change the narrative by finishing strong.",
  },
  {
    id: "media-pressure",
    title: "Media pressure",
    summary:
      "The KML Media Department may report on coaches whose jobs are becoming unstable.",
    paragraphs: [
      "Media reports themselves do not change Coaching Reputation. Instead, they reflect what is happening around the franchise.",
    ],
    examples: [
      "Example: Carolina has dropped five consecutive games, including back-to-back losses by 28+ points. Questions emerge about whether ownership still believes the coach is the right man for the job. Reputation 74 · Status HOT SEAT · Next 3 games CRITICAL.",
    ],
  },
  {
    id: "firings-rare",
    title: "Firings should be rare",
    summary: "The purpose of this system is not to constantly remove users from teams.",
    items: [
      "Realistic job security",
      "Consequences for prolonged failure",
      "Pressure during losing streaks",
      "Importance of Sim Scores",
      "Coaching comeback stories",
      "Meaningful media narratives",
      "Real stakes for the Coaching Carousel",
    ],
    note: "A coach who starts at 85 (B) should generally require a legitimately poor stretch or multiple seasons of underperformance to reach firing territory. One loss won’t cost you your job — but if the losses keep coming, the team keeps getting embarrassed, and the football isn’t meeting KML standards, ownership may eventually decide it’s time for a new voice.",
  },
];
