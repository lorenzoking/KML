export type DraftGradeEntry = {
  pick: number;
  coach: string;
  team: string;
  ovr: number;
  off: number;
  def: number;
  grade: string;
  contend: string;
  rebuild: string;
  blurb: string;
};

/**
 * Season 1 team-draft grades.
 * Weighted by Madden 27 overalls, draft slot value, contend vs rebuild posture,
 * and franchise upside (stars / identity / future flexibility).
 */
export const SEASON_1_DRAFT_GRADES: DraftGradeEntry[] = [
  {
    pick: 1,
    coach: "Curry",
    team: "Lions",
    ovr: 87,
    off: 91,
    def: 83,
    grade: "A-",
    contend: "Elite",
    rebuild: "Low",
    blurb:
      "No. 1 overall and a top-three roster is exactly what the first pick should look like. Detroit’s 91 offense can erase early mistakes, and franchise stars on that side of the ball give Curry immediate Super Bowl math. Cap and draft capital won’t be the story — winning will.",
  },
  {
    pick: 2,
    coach: "Wrinzo",
    team: "Patriots",
    ovr: 86,
    off: 87,
    def: 85,
    grade: "A-",
    contend: "High",
    rebuild: "Low",
    blurb:
      "Quietly one of the cleanest two-way clubs on the board. At pick 2, New England’s balance (86 OVR) is premium value without the “must win tomorrow” tax of the Rams/Eagles tier. Strong contend window with room to refine through free agency.",
  },
  {
    pick: 3,
    coach: "Biz",
    team: "Giants",
    ovr: 79,
    off: 80,
    def: 79,
    grade: "C+",
    contend: "Fringe",
    rebuild: "Medium",
    blurb:
      "Taking a 79 OVR club third overall is a tough sell on pure power rankings. The Giants are competitive enough to steal weeks, but Biz will need coaching edge and roster construction to outplay the rating. Future picks/cap matter more here than for the top of the board.",
  },
  {
    pick: 4,
    coach: "Chance",
    team: "Packers",
    ovr: 81,
    off: 82,
    def: 82,
    grade: "B",
    contend: "Medium",
    rebuild: "Medium",
    blurb:
      "Green Bay is the definition of middle-board balance. Not a steal at 4, not a disaster — an 81 overall with even units rewards scheme and discipline. Contending power is real if Chance hits on skill players; rebuild tools are average.",
  },
  {
    pick: 5,
    coach: "Jordan Stowe",
    team: "Rams",
    ovr: 91,
    off: 93,
    def: 88,
    grade: "A+",
    contend: "Elite",
    rebuild: "Very Low",
    blurb:
      "Draft theft. The No. 1 team in Madden 27 (91/93/88) falling to pick 5 is the grade of the night. Star-driven offense, championship-ready defense, and instant contending power. Cap/future picks are secondary — this is a win-now throne.",
  },
  {
    pick: 6,
    coach: "Prime",
    team: "Raiders",
    ovr: 79,
    off: 79,
    def: 77,
    grade: "C+",
    contend: "Fringe",
    rebuild: "Medium",
    blurb:
      "Las Vegas asks for clean football. The rating says bubble team; the pick number says Prime needed a home. Contending power is limited unless stars overperform. Rebuild flexibility is the escape hatch if Year 1 stalls.",
  },
  {
    pick: 7,
    coach: "Lefty",
    team: "Eagles",
    ovr: 88,
    off: 88,
    def: 87,
    grade: "A+",
    contend: "Elite",
    rebuild: "Very Low",
    blurb:
      "Second-best overall roster at pick 7 is outrageous value. Philadelphia’s completeness (88/88/87) means Lefty can win multiple ways. Franchise stars on both sides make this a true contender grade, not a project.",
  },
  {
    pick: 8,
    coach: "Nick",
    team: "Bengals",
    ovr: 83,
    off: 88,
    def: 77,
    grade: "B+",
    contend: "High (offense)",
    rebuild: "Low-Medium",
    blurb:
      "Shootout DNA. An 88 offense at pick 8 is a gift; the 77 defense is the tax. Contending power lives on the scoreboard. If Nick upgrades the front seven, Cincinnati jumps a tier fast.",
  },
  {
    pick: 9,
    coach: "Qon",
    team: "Titans",
    ovr: 75,
    off: 74,
    def: 79,
    grade: "B-",
    contend: "Low",
    rebuild: "High",
    blurb:
      "Hard mode with a purpose. Tennessee’s defense can keep games honest, but the offense rating forces a rebuild mindset. At pick 9 it’s not glamorous — the grade holds because future draft capital and patience can turn this into a multi-year climb.",
  },
  {
    pick: 10,
    coach: "Puddin",
    team: "Broncos",
    ovr: 86,
    off: 85,
    def: 87,
    grade: "A",
    contend: "High",
    rebuild: "Low",
    blurb:
      "One of the best “surprise” boards in Madden 27. Elite defense (87) plus improved offense at pick 10 is contend-now value. Star defensive pieces and turnover creation give Puddin a clear identity.",
  },
  {
    pick: 11,
    coach: "Trent",
    team: "Chiefs",
    ovr: 84,
    off: 90,
    def: 80,
    grade: "A-",
    contend: "High",
    rebuild: "Low",
    blurb:
      "Explosive offense (90) still travels. Mid-first-round pick for a perennial contending identity and star skill talent is strong. Defense is good-not-great, so Trent’s ceiling depends on complementary stops.",
  },
  {
    pick: 12,
    coach: "Noquestions",
    team: "Ravens",
    ovr: 87,
    off: 90,
    def: 87,
    grade: "A+",
    contend: "Elite",
    rebuild: "Very Low",
    blurb:
      "Top-four roster at pick 12. Baltimore’s two-way balance is championship architecture. Contending power is immediate; rebuild metrics barely apply. This is a pure win-now assignment.",
  },
  {
    pick: 13,
    coach: "Jsmood",
    team: "Cowboys",
    ovr: 83,
    off: 87,
    def: 80,
    grade: "B+",
    contend: "High",
    rebuild: "Low-Medium",
    blurb:
      "Dallas still brings offensive firepower and enough defense to hang. At 13, it’s fair market value with upside if stars stay on schedule. Contending window is open; rebuild tools are not the point.",
  },
  {
    pick: 14,
    coach: "Jaylen Stowe",
    team: "Bears",
    ovr: 83,
    off: 85,
    def: 82,
    grade: "B+",
    contend: "Medium-High",
    rebuild: "Medium",
    blurb:
      "Chicago’s all-around climb shows up in the ratings. Good offense, competitive defense, and franchise mode upside. Contending is realistic; future picks/cap still matter if Year 1 is rocky.",
  },
  {
    pick: 15,
    coach: "Bone",
    team: "Jets",
    ovr: 76,
    off: 75,
    def: 79,
    grade: "B-",
    contend: "Low",
    rebuild: "High",
    blurb:
      "Defense keeps Bone in games; offense keeps him honest. Mid-round rebuild with real flexibility. Contending power is deferred — draft capital and developmental stars decide whether this becomes a success story.",
  },
  {
    pick: 16,
    coach: "Dimez",
    team: "Jaguars",
    ovr: 78,
    off: 79,
    def: 79,
    grade: "B",
    contend: "Low-Medium",
    rebuild: "High",
    blurb:
      "One of the cleaner low-tier balances (79/79). Not scary on paper, but a sneaky Franchise build with even units. Rebuild power is the headline; contending is Year 2+ if Dimez hits the board.",
  },
  {
    pick: 17,
    coach: "Oli",
    team: "Chargers",
    ovr: 82,
    off: 85,
    def: 79,
    grade: "B+",
    contend: "Medium-High",
    rebuild: "Medium",
    blurb:
      "Offense-led club that can move the ball on anyone. At 17, Chargers are solid value. Contending hinges on defensive patches; stars on offense buy time.",
  },
  {
    pick: 18,
    coach: "Watermann",
    team: "Texans",
    ovr: 84,
    off: 80,
    def: 87,
    grade: "A-",
    contend: "High",
    rebuild: "Low-Medium",
    blurb:
      "Defense carries (87) and that’s a modern Madden identity. Mid-draft for a top-half overall and elite stops is strong contend posture. Cap/picks help finish the offense.",
  },
  {
    pick: 19,
    coach: "Gotti",
    team: "Falcons",
    ovr: 82,
    off: 83,
    def: 79,
    grade: "B+",
    contend: "Medium",
    rebuild: "Medium",
    blurb:
      "Quietly competitive sleeper. Balanced enough to build a contender without bottoming out. Franchise history says boom/bust — Gotti’s grade rises if he turns medium contend into January games.",
  },
  {
    pick: 20,
    coach: "Dre",
    team: "Buccaneers",
    ovr: 80,
    off: 83,
    def: 79,
    grade: "B",
    contend: "Medium",
    rebuild: "Medium",
    blurb:
      "Solid offense keeps Tampa playable. Not a steal, not a trap — a coach’s team. Contending requires defensive progress; rebuild tools are available if Dre pivots.",
  },
  {
    pick: 21,
    coach: "Pryor",
    team: "Bills",
    ovr: 85,
    off: 91,
    def: 79,
    grade: "A",
    contend: "High",
    rebuild: "Low",
    blurb:
      "Late-round heater. A 91 offense at pick 21 is massive value. Contending power is real every Sunday; the defensive rating is the only leash. Star offensive talent makes Pryor dangerous immediately.",
  },
  {
    pick: 22,
    coach: "Swipe",
    team: "49ers",
    ovr: 85,
    off: 90,
    def: 82,
    grade: "A",
    contend: "High",
    rebuild: "Low",
    blurb:
      "Physical, offense-heavy San Francisco still grades as a contender. Landing a 90 OVR attack this late is excellent. Defense isn’t peak-era dominant, but the star core still travels.",
  },
  {
    pick: 23,
    coach: "MONEYTEAMPETEY",
    team: "Seahawks",
    ovr: 84,
    off: 83,
    def: 82,
    grade: "A-",
    contend: "Medium-High",
    rebuild: "Medium",
    blurb:
      "Efficient, balanced, and underrated at 23. Seattle rewards clean play over splash. Contending is scheme-driven; future flexibility stays intact if PETEY wants to tilt toward youth.",
  },
  {
    pick: 24,
    coach: "Quon",
    team: "Colts",
    ovr: 82,
    off: 83,
    def: 79,
    grade: "B+",
    contend: "Medium",
    rebuild: "Medium",
    blurb:
      "Middle-tier without major holes. Fair value in the 20s. Contending needs a signature star leap; rebuild power is fine if Quon plays the long game.",
  },
  {
    pick: 25,
    coach: "Dooders",
    team: "Cardinals",
    ovr: 78,
    off: 79,
    def: 75,
    grade: "B",
    contend: "Low",
    rebuild: "High",
    blurb:
      "Rebuild with young juice. Defense rating caps the floor, so draft capital and development matter. Contending is distant — the grade is about runway, not January.",
  },
  {
    pick: 26,
    coach: "Slap",
    team: "Saints",
    ovr: 79,
    off: 80,
    def: 75,
    grade: "B-",
    contend: "Low-Medium",
    rebuild: "Medium-High",
    blurb:
      "Offense can keep Slap afloat; defense (75) is the ceiling limiter. Contending needs stop upgrades. Cap/picks become the real weapons if Year 1 is a bridge.",
  },
  {
    pick: 27,
    coach: "Wdub",
    team: "Panthers",
    ovr: 81,
    off: 79,
    def: 82,
    grade: "B+",
    contend: "Medium",
    rebuild: "Medium-High",
    blurb:
      "Defense-first Carolina at 27 is sneaky. An 82 defense gives Wdub a weekly chance while the offense develops. Rebuild power is strong without being cellar-dwelling.",
  },
  {
    pick: 28,
    coach: "Jerm",
    team: "Commanders",
    ovr: 79,
    off: 80,
    def: 77,
    grade: "B",
    contend: "Low-Medium",
    rebuild: "High",
    blurb:
      "Young talent, unfinished product. Perfect late-board Franchise canvas. Contending isn’t free — draft picks and cap space are the path. Grade reflects upside more than present power.",
  },
  {
    pick: 29,
    coach: "Fitz",
    team: "Vikings",
    ovr: 80,
    off: 82,
    def: 79,
    grade: "B+",
    contend: "Medium",
    rebuild: "Medium",
    blurb:
      "No major deficiencies and late-round timing help. Minnesota can hang without being elite. Contending is coachable; rebuild options remain if Fitz wants to reload.",
  },
  {
    pick: 30,
    coach: "Jgold",
    team: "Browns",
    ovr: 77,
    off: 74,
    def: 80,
    grade: "B",
    contend: "Low",
    rebuild: "High",
    blurb:
      "Defense-first survival kit. Offense rating forces patience and creative roster building. Late pick softens the blow — future capital and stop units are the foundation.",
  },
  {
    pick: 31,
    coach: "Mease",
    team: "Dolphins",
    ovr: 74,
    off: 74,
    def: 72,
    grade: "B+",
    contend: "Very Low",
    rebuild: "Elite",
    blurb:
      "Lowest-rated team in Madden 27 — and the ultimate rebuild assignment. At 31, Mease didn’t overpay for pain. Contending power is near-zero now; draft capital, cap space, and youth are the entire thesis. If anyone turns Miami around, it’s legendary.",
  },
  {
    pick: 32,
    coach: "Big Al",
    team: "Steelers",
    ovr: 81,
    off: 79,
    def: 87,
    grade: "A-",
    contend: "Medium-High",
    rebuild: "Medium",
    blurb:
      "Closing gift. An 87 defense at pick 32 is absurd value. Contending via low-scoring, turnover-driven games is viable immediately. Offense needs help, but Big Al stole a foundation.",
  },
];

export function buildDraftGradesArticleBody() {
  const gradeRows = SEASON_1_DRAFT_GRADES.map(
    (g) =>
      `| ${g.pick} | ${g.coach} | ${g.team} | ${g.ovr} | ${g.grade} | ${g.contend} | ${g.rebuild} |`
  ).join("\n");

  const details = SEASON_1_DRAFT_GRADES.map(
    (g) => `## ${g.pick}. ${g.coach} — ${g.team} (${g.grade})

**Madden 27:** ${g.ovr} OVR · ${g.off} OFF · ${g.def} DEF  
**Contending power:** ${g.contend}  
**Rebuild power:** ${g.rebuild}

${g.blurb}`
  ).join("\n\n");

  return `The draft board is locked. Now comes the judgment.

These Season 1 team-draft grades weigh six things: **Madden 27 overalls**, **draft position value**, **franchise identity/history**, **star impact**, **contending power**, and **rebuild power** (future picks, cap flexibility, and developmental runway).

A high overall at a late pick grades better than the same roster taken early. A low overall taken late can still grade well if the rebuild tools are real.

## Grade key

- **A+ / A:** Elite value or elite win-now fit
- **A- / B+:** Strong contend or excellent late value
- **B / B-:** Fair market or project with a path
- **C+:** Tough value relative to pick slot

## Quick board

| Pick | Coach | Team | OVR | Grade | Contend | Rebuild |
| --- | --- | --- | --- | --- | --- | --- |
${gradeRows}

## Full explanations

${details}

## Biggest winners

- **Jordan Stowe (Rams, A+):** Best roster in the game at pick 5.
- **Lefty (Eagles, A+):** Near-perfect two-way club at pick 7.
- **Noquestions (Ravens, A+):** Top-tier balance falling to 12.
- **Pryor (Bills, A) & Swipe (49ers, A):** Premium offenses in the 20s.
- **Big Al (Steelers, A-):** Elite defense with the last pick.

## Hardest assignments

- **Mease (Dolphins):** Lowest overall in Madden 27 — rebuild legend track.
- **Qon (Titans) & Bone (Jets):** Defense can survive; offense must be built.
- **Biz (Giants):** Early pick on a mid/low overall raises the bar.

Draft grades don’t win games. Coaching does. But the board tells us who starts with a throne — and who starts with a blueprint.`;
}
