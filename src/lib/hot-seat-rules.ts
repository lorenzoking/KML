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
      "4 consecutive losses: -1 Reputation",
      "6 consecutive losses: additional -2 Reputation",
      "8 consecutive losses: additional -3 Reputation",
      "An 8-game losing streak therefore totals -6 Reputation",
      "Only the highest new threshold reached is deducted — you do not repeatedly lose points every week for remaining above the same threshold",
    ],
  },
  {
    id: "blowout-losses",
    title: "Blowout losses",
    summary:
      "Isolated blowouts are treated differently from repeated blowouts. Ownership cares when the team stops looking competitive.",
    items: [
      "Lose by 21–27 points: warning — no automatic deduction",
      "Lose by 28–34 points: -1 Reputation",
      "Lose by 35+ points: -2 Reputation",
      "3 losses by 21+ points within a 5-game span: additional -2 Reputation",
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
    note: "Gameplay that repeatedly fails to meet KML’s simulation standards can therefore become a legitimate reason for a coach to lose their job. After each game, coaches report their opponent’s Sim Score on the result submission. Commissioners apply Bad Sim deductions as Coaching Reputation ledger entries (category SIM_SCORE).",
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
      "3-game winning streak: +1 Reputation",
      "5-game winning streak: additional +2 Reputation",
      "Beat a 90+ OVR / major contender: no automatic reputation bonus, but may be considered during Hot Seat evaluation",
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
