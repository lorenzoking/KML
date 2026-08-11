export type GmReputationRuleSection = {
  id: string;
  title: string;
  summary?: string;
  paragraphs?: string[];
  items?: string[];
  bands?: Array<{ range: string; label: string; detail: string }>;
  note?: string;
};

export const GM_REPUTATION_INTRO = {
  title: "GM Reputation System",
  body: "Each coach has a public GM Reputation Score. It tracks how you manage the front office — trades, overpays, and decision-making — separate from Coaching Reputation on the field.",
  note: "Trades affect your GM identity. Elite players should feel rare and powerful. Bad decisions compound over time, and the league starts to feel like real NFL front-office politics.",
} as const;

export const GM_REPUTATION_QUICK_FACTS = [
  { label: "High", value: "80+" },
  { label: "Neutral", value: "65–79" },
  { label: "Low", value: "Below 65" },
  { label: "Starts at", value: "B / ~75" },
] as const;

export const GM_REPUTATION_RULE_SECTIONS: GmReputationRuleSection[] = [
  {
    id: "tiers",
    title: "Reputation tiers",
    summary: "Your GM score is public and shapes how trades are handled.",
    bands: [
      {
        range: "80+",
        label: "High reputation",
        detail: "Easier trade approvals and less commissioner scrutiny.",
      },
      {
        range: "65–79",
        label: "Neutral",
        detail: "Standard trade rules apply.",
      },
      {
        range: "Below 65",
        label: "Low reputation (bad traders)",
        detail:
          "All trades require approval review, first-round picks need a league vote, and every deal gets increased scrutiny.",
      },
    ],
  },
  {
    id: "low-triggers",
    title: "What triggers Low reputation",
    summary: "Low GM reputation is earned through patterns, not one mistake.",
    items: [
      "Multiple D/F grade trades",
      "Failed trade penalties",
      "Repeated overpay behavior",
    ],
  },
  {
    id: "low-effects",
    title: "Effects of Low reputation",
    items: [
      "All trades require approval review",
      "Cannot trade 1st round picks without a league vote",
      "Increased scrutiny on all deals",
    ],
  },
  {
    id: "why-it-matters",
    title: "Why this matters",
    items: [
      "Trades affect your GM identity",
      "Elite players feel rare and powerful",
      "Bad decisions actually compound over time",
      "The league starts to feel like real NFL front-office politics",
    ],
  },
];
