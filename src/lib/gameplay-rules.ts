export type GameplayRuleSection = {
  id: string;
  title: string;
  summary?: string;
  items: string[];
};

export const GAMEPLAY_MAIN_RULE = {
  title: "Main rule",
  body: "Play realistic football. Do not spam plays, abuse broken mechanics, manipulate AI, or use loopholes for an unfair advantage.",
  note: "If something is not specifically listed but is clearly cheesy or unrealistic, do not do it. Commissioners have final say and can issue warnings, replays, force losses, suspensions, or removals.",
} as const;

export const GAMEPLAY_QUICK_FACTS = [
  { label: "Quarters", value: "8 minutes" },
  { label: "Play clock", value: "25-sec accelerated" },
  { label: "Passing", value: "Revamped only" },
  { label: "Advance", value: "Every 48 hours" },
  { label: "Streaming", value: "Home team streams" },
  { label: "Playbooks", value: "Team default / approved only" },
] as const;

export const GAMEPLAY_RULE_SECTIONS: GameplayRuleSection[] = [
  {
    id: "league-settings",
    title: "League settings",
    items: [
      "8-minute quarters",
      "25-second accelerated clock",
      "Revamped passing only",
      "Timing-based catching on, set to 0 yards",
      "Custom coaches allowed",
      "No custom offensive or defensive playbooks",
      "Use your NFL team’s default playbook or an approved generic playbook",
      "Home team must stream user games on YouTube",
      "League advances every 48 hours",
      "Contact and make a real effort to schedule at least 24 hours before advance",
      "No lying or fabricating messages to get a force win",
      "Manual player progression is not allowed",
      "No player edits or attribute changes unless approved by a commissioner",
    ],
  },
  {
    id: "games-and-cpu",
    title: "Games and CPU",
    items: [
      "Do not quit games",
      "If you disconnect, notify a commissioner immediately and provide proof if requested",
      "A rage quit is a force loss and may result in suspension or removal",
      "Do not restart CPU games without commissioner approval",
      "Play all scheduled CPU games unless a commissioner approves a sim",
      "CPU games follow the same gameplay rules as user games",
      "No stat padding, score running, or exploiting CPU logic",
    ],
  },
  {
    id: "playbooks-and-rosters",
    title: "Playbooks and rosters",
    items: [
      "No custom playbooks",
      "No unrealistic position changes to unlock abilities, exploit ratings, or create unfair mismatches",
      "TEs must weigh at least 220 pounds",
      "Safeties moving to LB must be at least 220 pounds, have less than 85 change of direction, and 86 speed or lower",
      "No WR-to-RB, QB-to-RB, or OL-to-TE changes",
      "Commissioners may approve realistic player exceptions",
    ],
  },
  {
    id: "offense",
    title: "Offense",
    items: [
      "Do not run the exact same play twice in a row, including flipped plays or no-huddle repeats",
      "Do not repeatedly use the same concept from multiple formations just to exploit the defense",
      "Do not immediately sprint or roll out of the pocket every snap",
      "HB Direct is banned",
      "Plays labeled “RZ” or “Red Zone” may only be used inside the opponent’s 20-yard line",
      "Slip screens and angle screens are limited to two total calls per game",
      "WR screens, TE screens, and HB swing routes are allowed, but do not spam them",
      "On screen passes, throw only to the designed target",
      "Quick slants and Texas routes must be thrown quickly; do not wait until they turn into deep crossing or post routes",
      "Keep your offense balanced: no more than 69.9% run or 69.9% pass",
      "RBs may account for no more than 20% of team receptions; 25% if RB1 has Safety Valve",
      "Do not fake snap simply to draw an offside unless it would result in a first down",
      "User playmaker is banned",
    ],
  },
  {
    id: "no-huddle",
    title: "No-huddle",
    items: [
      "No-huddle may only be used after a positive play",
      "Outside of the two-minute drill, let the play clock reach 25 seconds before snapping",
      "There are no no-huddle restrictions during a two-minute drill",
      "Outside of the two-minute drill, no no-huddle after an incompletion, sack, tackle for loss, or other negative play",
      "Outside of the two-minute drill, no no-huddle inside the opponent’s 25-yard line",
      "Outside of the two-minute drill, no no-huddle after failing to convert third down",
      "Outside of the two-minute drill, no no-huddle when losing by 21 or more in the fourth quarter",
    ],
  },
  {
    id: "rpos-and-play-action",
    title: "RPOs and play action",
    items: [
      "No play-action or RPO on third-and-6 or longer",
      "No play-action or RPO on fourth down, except RPOs on fourth-and-1 or fourth-and-2 in legitimate four-down territory",
      "Under-center RPOs are banned",
      "On a read-option RPO, if the QB pulls the ball, the QB must run before throwing",
      "Do not abuse RPOs or make them your entire offense",
    ],
  },
  {
    id: "hot-routes",
    title: "Hot routes",
    items: [
      "Only one hot route per play",
      "Hot routes may only be given to outside WRs",
      "The QB or WR receiving the adjustment must be 90 overall or higher",
      "Allowed hot routes: slant, hitch, go, and out",
      "No other route adjustments are allowed",
    ],
  },
  {
    id: "user-defense",
    title: "User defense",
    items: [
      "You may user any defender, including defensive linemen",
      "Rush at least three defenders on every snap, including a QB spy",
      "Clicking on is allowed, but do not switch onto a defender after the ball is in the air",
      "Do not click off a defender just to let the CPU make the tackle; if you click on, make the tackle yourself",
      "You may only manually move the player you are currently controlling",
      "Use group adjustments for other defenders; do not manually reposition multiple defenders before the snap",
      "If you manually cover an HB or TE in man coverage, stay with that assignment; do not abandon it to lurk another route",
      "If a defender is assigned to blitz, let him blitz; do not send him toward the line and then drop him into random coverage",
    ],
  },
  {
    id: "defensive-personnel",
    title: "Defensive personnel",
    items: [
      "No safeties at sub-linebacker unless they have purple or gold Instinct or Team Player abilities",
      "Goal-line defense is only allowed inside the 10-yard line or on inches-to-go",
      "DL stunts and twists are only allowed from Load, Rush, or Mug fronts",
      "TOM stunts are allowed from any front",
    ],
  },
  {
    id: "fourth-down",
    title: "Fourth down",
    items: [
      "Q1–Q3: Punt when backed up inside your own 40",
      "Q1–Q3: Between your own 40 and the opponent’s 40, go for it at your discretion",
      "Q1–Q3: Inside the opponent’s 40, you may go for it on fourth-and-5 or shorter",
      "Q4: Go for it whenever you choose",
      "Fake punts are only allowed between your own 40 and the opponent’s 40",
    ],
  },
  {
    id: "clock-management",
    title: "Clock management",
    items: [
      "Chew clock cannot be used until the final four minutes of either half",
      "Do not drain clock early solely to limit possessions",
      "In the final four minutes, protecting a legitimate lead is allowed",
    ],
  },
  {
    id: "enforcement",
    title: "Enforcement",
    items: [
      "First issue: warning or correction",
      "Repeated issue in the same game: replay, penalty, or commissioner ruling",
      "Repeated violations across games: suspension, force loss, roster restriction, or removal",
      "Accidents happen; repeated “accidents” are violations",
    ],
  },
];
