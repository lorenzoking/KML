import { StoryCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { buildDraftGradesArticleBody } from "@/lib/draft-grades";
import { safeEnsureDefaultStoryPolls } from "@/lib/story-engagement";

export const STORY_CATEGORY_LABELS: Record<StoryCategory, string> = {
  FEATURE: "Front page",
  GAME_OF_WEEK: "Game of the week",
  PLAYER_OF_WEEK: "Players of the week",
  COACHING: "Coaching storyline",
  DRAFT: "Draft desk",
  LEAGUE: "League desk",
};

/** League-wire art, grouped by week under /public/stories. */
const STORY_ASSETS = {
  firstChampion: "/stories/features/morning-show-first-champion.png",
  hotSeat: "/stories/features/morning-show-hot-seat.png",
  tradeRumors: "/stories/features/trade-rumors.png",
  week1Primetime: "/stories/wk1/primetime.png",
  week1Potw: "/stories/wk1/potw.png",
  week2Primetime: "/stories/wk2/primetime.png",
  week2MorningShow: "/stories/wk2/morning-show.png",
  week2Potw: "/stories/wk2/potw.png",
  week3Primetime: "/stories/wk3/primetime.png",
  week3Potw: "/stories/wk3/potw.png",
  week4Primetime: "/stories/wk4/primetime.png",
  week4Potw: "/stories/wk4/potw.png",
  week5Primetime: "/stories/wk5/primetime.png",
  week7Primetime: "/stories/wk7/primetime.png",
  week7PowerRankings: "/stories/wk7/power-rankings.png",
  week8SwipeTrade: "/stories/wk8/swipatrade.PNG",
} as const;

const DEFAULT_STORIES = [
  {
    slug: "season-1-week-9-hot-seat",
    category: StoryCategory.FEATURE,
    title: "The Hot Seat: who’s safe, who’s cooked, and Stephen A. already picked a champion",
    eyebrow: "KML Morning Show · Coaching reputation",
    summary:
      "Eight weeks of Companion tape and a live reputation ledger. Ren sits at Elite 99 with Jenna King as the in-game head coach — KML’s first female HC. Chance is the other 95. Then the desk lights the chair: Puddin is Extreme Risk at 61, Curry is on the Hot Seat at 5–2, and Jbone and Jerm are in the fire with him.",
    body: `![KML Morning Show — The Hot Seat](${STORY_ASSETS.hotSeat})

The KML Morning Show did not come to talk trades this week. **Stephen A. and Shannon** slammed the desk on the only board that still has teeth after eight weeks of live football: **Coaching Reputation.**

The Companion App dumped the tape. The website dumped the ledger. When the name on the site and the name in Madden are not the same person, the desk treats them as **equals on the coaching staff**. Head coach. User. Same fire.

Do not get this one twisted: **Ren and Renzo King are the same person.** That is the KML user. The head coach actually walking the Patriots sideline in Madden is **Jenna King** — **the first female head coach in KML.** Ren’s grade. Jenna’s headset. One 8–0.

**Elite is 93. Hot Seat is 74 and below. Below 65 is Extreme Risk.** Puddin is already there.

## Stephen A.: I’m taking the Patriots

The left side of the graphic did not hedge.

**“I’m taking the Patriots. Ren. Jenna King on the sideline. 8–0. Elite 99. First female head coach in KML. That’s a championship staff. Puddin? An 86 overall and one win. That’s a firing.”**

That is the prediction. Stamp it or fade it. The numbers behind it are not vibes.

**Ren** — also **Renzo King** on the site and the export — is the user the Discord already knew. **Jenna King** is the name on the Madden headset. Same building. Same 8–0. Same **+175** (306–131). **Drake Maye** leads the league at **2,444 yards and 28 touchdowns**. New England still allows **16.4 points a game** — stingiest defense in the Companion dump. **40 XP. Reputation 99. The only A+ on the board.**

Week 1 called them the dark horse. Week 7 called them Elite. Week 9 is calling them the favorite.

Shannon did not come to crown anyone. Shannon came to light the chair.

**“Curry went 4–0 then got 44–3’d by Chance. That’s how a 1-pick goes from the throne to the Hot Seat at 5–2.”**

## How the desk reads the ledger

Coaching Reputation follows the **coach**, not the helmet. Everybody started at **85 (B)**. Ordinary wins do not move it. Blowouts, Primetime, streaks, and embarrassing tapes do.

| Score | Grade | Label | Job security |
| --- | --- | --- | --- |
| **97–100** | A+ | Elite | Secure |
| **93–96** | A | Championship level | Secure |
| **87–92** | B+ | Highly respected | Safe |
| **83–86** | B | Stable | Safe |
| **75–82** | C | Pressured / Hot Seat math | Pressure building |
| **70–74** | D | Firing territory | Official Hot Seat |
| **Below 70** | F | Termination level | Extreme risk — the commissioner can move now |

The live standings board already stamped every staff. This is not a preview. This is the grade book after Week 8.

## The best coaches in the league

Record is the floor. Reputation is the argument. Roster overall is the excuse. The desk used all three — plus the Companion names sitting on each franchise.

### 1. Ren · HC Jenna King · Patriots — 8–0 · +175 · 85 OVR · Elite 99 · 40 XP

**The championship staff. First female head coach in the league.**

No other desk is 8–0. No other coach is 99. **Ren** is the user — **Renzo King** is the same person. **Jenna King** is the in-game head coach. **TreVeyon Henderson** just ran for **200**. Maye already has the passing throne. The Week 7 board argued Lefty vs Ren for #1. Then Dallas dropped **61–35** on Philadelphia and the argument died.

Stephen A. is not picking a sleeper. He is picking the form team, the rating of the user, the headset in Foxborough, and the cleanest two-way tape in Madden 27.

### 2. Chance Allred · Packers — 5–3 · +73 · 81 OVR · Elite 95 · 28 XP

**The other Elite. The 81 overall that keeps cooking 86s.**

Chance has been telling the league he’s the best in it. The ledger finally agreed. **Elite 95** on the **lowest-rated roster in the top 10**. Week 7 was the receipt: **44–3 over Curry’s Lions.** Jordan Love had already gone **338/4/0** in Week 6. Week 8 was a 43–35 loss to Carolina. The 5–3 is not a collapse. It is a staff that just got done embarrassing the 1-pick.

If you rank the user over the spreadsheet, Chance is in the Ren conversation. The 81 overall is the only thing keeping him second.

### 3. Big Al / Almon Young III · Steelers — 6–2 · +63 · 84 OVR · Stable 91 · 28 XP

**The sleeper that hit.**

Stephen A. called it in Week 1: **the Steelers are sleepers. Coach Al can ball.** The Companion name on Pittsburgh is **Almon Young III**. Same staff. Last pick of the draft. **87 defense** then, **6–2** now, **five straight** into the Week 8 board, **303 points scored**, **Patrick Queen** with **seven interceptions** in the award race.

91 is not Elite yet. It is the highest non-Elite stamp in the league. A last-pick staff sitting next to the 8–0 and the 95 is the whole point of KML.

### 4. Petey / Phillip Reaves · Seahawks — 6–2 · +66 · 84 OVR · Stable 89 · 32 XP

**Morning Show chalk. Still walking.**

**Petey** is the name the first-champion graphic sold. **Phillip Reaves** is the name the export printed in Seattle. **Jaxon Smith-Njigba** leads the league at **1,033 yards**. Seattle allows **20.0 points a game** — second only to New England. **32 XP** is second on the board. The 6–2 is the chalk answering the slow start.

### 5. Oli / Oliver Cardenas · Chargers — 4–3 · +54 · 82 OVR · Stable 90 · 22 XP

**269, then 293. The loudest offense that will not get buried for a 4–3.**

Los Angeles still grades as a **82 overall** and still scores like a 90. Companion team offense has the Chargers at **41.9 points a game**. A 90 reputation at 4–3 is how the desk says the tape is better than the record.

### 6. Lefty / xLeftsideee · Eagles — 7–1 · +110 · 87 OVR · Stable 86 · 26 XP

**The best remaining roster among the unbeatens — until they weren’t unbeaten.**

**Lefty** is the league name. **xLeftsideee** is the Madden desk. **Saquon Barkley** holds the early MVP crown: **1,159 scrimmage yards, 15 touchdowns, 1,052 rushing**. Philadelphia is **7–1** and **308 points**. Then **Coach Javon Smith** dropped **61–35** on them in Week 7 and the reputation fell from the Elite doorstep (**92**) to **86 Stable**.

That is still a top-two team. It is no longer a top-two coaching grade. The 61–35 is why.

### The rest of the respected room

| Staff | Club | Record | OVR | Rep | The tape |
| --- | --- | --- | --- | --- | --- |
| **Raine Reed** | Ravens | **7–1** · +50 | 85 | **88 Stable** | Quiet 7–1. Henry still the hammer. Five-game heater. |
| **Trent / Trentan Carpenter** | Chiefs | **5–2** · +42 | 85 | **88 Stable** | Just **shut out Denver 21–0**. Walker still eating. |
| **Mease** | Dolphins | **4–3** · +41 | **78** | **86 Stable** | Lowest-rated club that is still beating the rating. 21.6 points allowed. |
| **Tha Don / Dre** | Buccaneers | **5–3** · +43 | 84 | **85 Stable** | 29 XP. Still a real 5–3 after the 52–49 war and a 45–40 loss to vacant Atlanta. |
| **Jaylen Stowe** | Bears | **5–3** · −1 | 84 | **81 Pressured** | Survived 217 in Week 6. Then Ren dropped **69–21** on Chicago. The 81 is the scar. |

## The call-out: underperforming staffs

Talent on the roster is not the same as talent on the sticks. These desks were handed contend clubs — or at least competitive overalls — and the Companion record is not catching the rating.

### Puddin / michael richard II · Broncos — 1–7 · 86 OVR · 61 Extreme Risk

**The worst record-to-roster gap in KML Reborn. Termination level.**

Denver was a **pick-10 surprise board**: elite defense, 86 overall, win-now identity. **Puddin** is the league name. **michael richard II** is the name Madden printed. Same staff. **One win. 140 points scored. 289 allowed. −149.** Kansas City just **shut them out 21–0**.

**61** is not Hot Seat. **61 is below 65.** The rulebook’s own language is **Extreme Risk — the coach may be terminated immediately depending on circumstances.** Win Now franchise. Championship-caliber roster. Catastrophic stretch. That is the Emergency Hot Seat checklist with the boxes already ticked.

Stephen A. did not stutter. **That’s a firing.**

### Curry / Kyerin Curry · Lions — 5–2 · 86 OVR · 71 Hot Seat

**5–2 and already in the chair. That is how loud a 44–3 is.**

Curry took the **No. 1 overall pick** and a **91-offense** Lions club. **Jahmyr Gibbs** is still in the MVP race at **1,187 scrimmage yards and 15 scores**. Detroit is **5–2**. And the reputation board still stamped **Hot Seat 71** — **D, firing territory**.

The tape explains the grade:

- **Konrad Fitzgerald’s Cardinals ended 4–0**, 38–28, in Week 5
- **Chance ended the get-right**, **44–3**, in Week 7 — an embarrassing-loss band (35+)
- Week 8 survived **Minnesota 50–49** in a 49–50 war. That is not a statement. That is oxygen.

A 1-pick is not allowed to look like that. Ownership expectations on a Win Now 86 are January. **71** says the ledger already filed the collapse.

### Pryor · Bills — 1–6 · 83 OVR · 76 Pressured

**A 91-offense draft grade. One win.**

Pryor stole a premium attack at pick 21. Buffalo is **83 overall** and **1–6**, **142–188**, five straight losses. **76** is Pressure building, not yet the chair — but a 1–6 on that roster is how you walk into 74. Next up is Minnesota. Two struggling staffs. Somebody has to stop the bleeding.

### Jerm / Jerimey Jones “JERM” · Commanders — 1–6 · 83 OVR · 74 Hot Seat

**Official chair. Sold Daron Payne for a fifth. 108 points scored.**

**Jerm** is the league name. **Jerimey Jones “JERM”** is the Companion print. **1–6. 108–194. Hot Seat 74.** Deadline day he flipped **Daron Payne** to Curry for a **2027 fifth (2 points)**. Rebuild math on a 1–6 club is one story. A Hot Seat stamp on an 83 overall is the other. **Jordan Stowe’s 88-overall Rams** are next. That is not a get-right.

### The rest of the underperform tape

| Staff | Club | Record | OVR | Rep | Why the desk is loud |
| --- | --- | --- | --- | --- | --- |
| **Jbone / Bone** | Jets | **0–8** · −181 | 80 | **72 Hot Seat** | Zero wins. 114 points. 295 allowed. The Tank Bowl did not save him — Vegas dropped **48–13**. |
| **Qon / Coach Q** | Titans | **1–7** · −136 | 77 | **75 Pressured** | 340 points allowed. Rebuild tools, but the 75 is one bad tape from the chair. Cashed Swipe’s 20-point haul. The roster still cannot stop anyone. |
| **Classic Secondline** | Vikings | **0–7** · −161 | 81 | **77 Pressured** | **Kyler Murray** just threw for **425 and four** in a 49–50 loss. The offense can cook. The staff is 0–7. |
| **Jordan Stowe** | Rams | **6–2** · +78 | **88** | **82 Pressured** | Highest remaining overall. Still Pressured. The Week 1 hole never fully left Hollywood. 41–24 over Oli helps. 82 is not what a 88-overall throne is supposed to wear. |
| **Swipe / RoyalxSwipa** | 49ers | **5–2** · +60 | 86 | **81 Pressured** | Spent **20 points on Jeffery Simmons**. Still Pressured at 81. The deadline gamble has not moved the grade. |
| **Dawson Triplitt** | Bengals | **4–3** · −19 | 82 | **77 Pressured** | .500-ish with a negative differential. 77 is the wrong neighborhood for a Burrow club that just dropped 42. |
| **Lojorian / Biz** | Giants | **2–5** · −94 | 82 | **85 Stable** | New name on the export. Same 2–5. The 85 is a starting-grade courtesy. The −94 is the tape. |
| **Brian Dawkins** | Jaguars | **2–5** · −65 | 81 | **82 Pressured** | Two wins. Pressured. Not a fire yet. Not a résumé either. |

**Atlanta is a vacant desk.** CPU. 3–5. **0 XP.** The Falcons just beat Tampa **45–40** with nobody in the chair. That is how loud the rest of the underperform tape is — a CPU club just took a 5–3 staff’s lunch.

## The Hot Seat board — no soft language

The in-season chair is not a vibe. **70–74 is Hot Seat. 65–69 is firing eligible. Below 65 is Extreme Risk.**

| Seat | Staff | Record | Rep | What the rulebook says |
| --- | --- | --- | --- | --- |
| **Extreme Risk** | **Puddin / michael richard II · Broncos** | 1–7 · 86 OVR | **61** | Below 65. Immediate termination is on the table. Win Now collapse. |
| **Hot Seat** | **Kyerin Curry · Lions** | 5–2 · 86 OVR | **71** | Firing territory. 44–3. 1-pick. Not enough oxygen in a 50–49. |
| **Hot Seat** | **Jbone · Jets** | 0–8 · 80 OVR | **72** | Zero wins. Embarrassing-loss pattern. The 0 has to go or the chair wins. |
| **Hot Seat** | **Jerm · Commanders** | 1–6 · 83 OVR | **74** | Officially evaluating the coach. Next game is the Rams. |
| **Pressure / one tape from the chair** | **Qon / Coach Q · Titans** | 1–7 | **75** | 75 is the last step before Hot Seat. 340 points allowed. |
| **Pressure** | **Pryor · Bills** | 1–6 · 83 OVR | **76** | Premium offense, one win, five straight losses. |
| **Pressure** | **Classic Secondline · Vikings** | 0–7 | **77** | 0–7 with a 425-yard night. The offense is not the problem. |
| **Pressure** | **Dawson · Bengals** | 4–3 | **77** | Negative differential. Burrow just threw six scores. The grade still says C. |
| **Off the chair — still not clean** | **Javon / Coach Javon Smith · Cowboys** | 4–4 · 85 OVR | **81 Pressured** | Was **74 Hot Seat** at 2–4. Then he **61–35’d Lefty**. Two straight. The 454-yard tape finally cashed. The 81 says the fire is out. The 4–4 says it is not a revival yet. |

Recovery is in the rulebook. **4–1 over the next five** can lift a Hot Seat stamp. **3-game winning streak is +1.** Puddin does not have a streak. Jbone does not have a win. Curry’s last two are **L by 41** and **W by 1**. That is not 4–1.

## Around the league — the other desks

Not every staff is Elite or on fire. Some are just being watched.

- **Slap / Slap (FreeSmokeJr) · Saints** — 4–3, **81 Pressured**. Four-game heater died. Tiny differential.
- **Quon · Colts** — 4–3, **80 Pressured**. Beat Jacksonville 35–20. Still a C.
- **Nick / Big Bird- Panthers · Carolina** — 3–4, **84 Stable**. **Bryce Young** just went **424 and five**. **Tetairoa McMillan** took the Week 8 honors stamp. The 3–4 is lying a little. They drew **Puddin** next. That is a chance to bury Extreme Risk.
- **Konrad Fitzgerald · Cardinals** — 3–5, **85 Stable**. The staff that ended Curry’s 4–0 is 3–5. The 85 is the leftover respect. Three straight losses are the new tape.
- **Da Truth / Prime · Raiders** — 3–5, **84 Stable**. 48–13 over the Jets is not a résumé. It is a date with a 0–8.
- **Taylor Watermann · Texans** — 3–3, **85 Stable**. Quiet. 84 OVR. +15. The desk is not yelling.
- **Raine’s 7–1** still does not have an Elite stamp. One more statement and it should.

## Week 9 is the next exam

The Companion slate is already up. Primetime is not a cupcake. It is **Elite vs Elite**.

| Matchup | Why the chair cares |
| --- | --- |
| **Packers vs Patriots** | **Chance Allred (95)** vs **Ren and HC Jenna King (99)**. The only two Elite stamps in the league. An 81 overall walking into 8–0 and the first female head coach in KML. If Chance wins this, Stephen A.’s prediction gets a scar. If New England wins it, the 9–0 starts looking like February. |
| **Broncos at Panthers** | Extreme Risk vs a 3–4 staff that just dropped 43. Another loss and 61 becomes a press conference. |
| **Lions at Dolphins** | Hot Seat 71 vs Mease’s 78-overall overachievers. Curry cannot do 50–49 again and call it health. |
| **Jets at Chiefs** | 0–8 walks into Trent. A 21–0 bye-week energy is sitting in Kansas City. |
| **Rams at Commanders** | 88 OVR Pressured throne vs Hot Seat 74. Jerm’s 108 points against Hollywood is a horror movie. |
| **Bills at Vikings** | 1–6 vs 0–7. Somebody’s losing streak survives. Somebody’s reputation does not. |
| **Cowboys at Colts** | Javon trying to stay off the chair. Quon trying to climb off 80. |
| **Giants at Eagles** | Lojorian/Biz into Lefty/xLeftsideee. The 61–35 scar is one week old. Philadelphia should eat. |

Byes: **Big Al / Almon Young III** and **Qon / Coach Q**. The sleeper sits clean. The 1–7 Titans sit with a 75 that is one tape from the chair.

## Desk verdict

The best coaches in KML right now are not a mystery.

**Ren** — same person as **Renzo King** — has the record, the points, the defense, the passing throne, and the only **99**. **Jenna King** has the headset. First female head coach in KML, sitting on 8–0. Stephen A. stamped the first Lombardi on New England. The desk is not fading 8–0 and A+.

**Chance Allred** is the other Elite — an 81 overall that just **44–3’d** the 1-pick. **Big Al and Almon Young III** are the sleeper that stopped being a cute graphic. **Petey and Phillip Reaves** still have the chalk. **Lefty and xLeftsideee** still have Saquon and a 7–1. They also have a 61–35 hole in the résumé.

Then the chair.

**Puddin and michael richard II** are **61 Extreme Risk** on an **86 overall**. That is the loudest underperform in the league and it is not close. **Curry** is **5–2 and 71** because 44–3 is how a 1-pick gets fired in public. **Jbone** is **0–8 and 72**. **Jerm** is **1–6 and 74**. **Qon / Coach Q** is one tape from joining them.

The Morning Show does not move reputation. It reports the fire.

**Great coaches build reputation. Bad ones sit in the chair.**

Stamp the Patriots. Light the Broncos. Tell Curry the 5–2 does not save a 44–3.

Week 9 puts the prediction on the field: **Chance vs Ren. Elite vs Elite.** If the 81 overall beats 8–0, the Morning Show has a new argument. If it does not, Stephen A. gets louder.

Lock the board. Best coach. First one out. Stamp or fade the prediction.

This is KML. This is the Hot Seat. Every game matters.

Compete. Conquer. Be legendary.`,
    isFeatured: true,
    sortOrder: -100,
    week: 9,
  },
  {
    slug: "season-1-first-champion-speculation",
    category: StoryCategory.FEATURE,
    title: "Who’s going to be the first champion of KML Reborn?",
    eyebrow: "KML Morning Show · Madden 27",
    summary:
      "The panel is hot, the board is locked, and the first Super Bowl of the Madden 27 cycle is already being argued. Here’s the desk’s favorite, sleeper, and the names that actually move games.",
    body: `![KML Morning Show — Who’s going to be the first champion of KML Reborn?](${STORY_ASSETS.firstChampion})

The KML Morning Show opened Season 1 with the only question that matters: **who lifts the first Lombardi of the Madden 27 cycle?**

The graphic is chaos in the best way — Steelers sleeper talk, Seahawks chalk, and a mid-desk rant that names the true game changers. The draft grades are already in. Now the speculation starts.

## The obvious favorite (best team on paper)

**Jordan Stowe and the Rams.**

Madden 27 doesn’t whisper about Los Angeles — it screams. **91 overall**, league-best **93 offense**, **88 defense**. That is the highest-rated franchise in the game, and it fell to pick 5. If “favorite based on team” means pure roster power, Stowe is the chalk of chalks.

Close behind on the win-now shelf:

- **Lefty / Eagles (88)** — most complete two-way club
- **Curry / Lions (87)** and **Noquestions / Ravens (87)** — January expectations from Day 1
- **Puddin / Broncos (86)** and **Ren / Patriots (86)** — quiet, dangerous balance

If the first champion is decided by overalls alone, Hollywood hosts the parade.

## The chalk from the Morning Show

The right side of the desk held up five fingers and went full white chalk: **Seahawks in 5.**

That’s **MONEYTEAMPETEY** — Petey — sitting on an **84 overall** that grades clean, balanced, and scheme-heavy. Not the flashiest roster. Not the softest path either. If Petey’s game travels the way the league’s veterans say it does, Seattle doesn’t need 91 overall to cut down the field.

Call it the **player favorite** stacked against the **team favorite**.

## The sleeper

Stephen A. already said it for us: **the Steelers are sleepers. Coach Al can ball.**

**Big Al** closed the draft at pick 32 with an **87 defense** and an **A-** draft grade. Contending through turnovers, field position, and low-scoring dogfights is a real Super Bowl path in this league — especially when the top offenses start pressing.

Don’t sleep on Pittsburgh just because the offense rating isn’t Hollywood. Sleepers don’t ask for permission.

## The names that actually scare the room

Roster overalls tell you who *should* win. League history tells you who *can*.

The Morning Show’s center desk drew a hard line: **Slap, Primetime, Dooders, and Mease** are game changers. Everybody else? Team merchants.

| Name | Franchise | Madden 27 | Why they’re in the conversation |
| --- | --- | --- | --- |
| **Big Al** | Steelers | 81 OVR · 87 DEF | Elite defense, last-pick steal, Morning Show sleeper |
| **Petey** | Seahawks | 84 OVR | Balanced contend club + chalk pick to hoist first |
| **Primetime** | Raiders | 79 OVR | Known killer with a bubble roster — coaching decides |
| **Slap** | Saints | 79 OVR | Game-changer label; offense keeps him dangerous |
| **Dooders** | Cardinals | 78 OVR | Rebuild rating, veteran hands — chaos agent |
| **Mease** | Dolphins | 74 OVR | Lowest team in the game; highest “don’t count him out” energy |
| **Ren** | Patriots | 86 OVR · 87 OFF · 85 DEF | Same as Wrinzo on the draft board — one of KML’s known best with a top-six roster |

That table is the tension of KML Reborn: **Big Al**, **Petey**, and **Ren** have contend-ready clubs. **Primetime**, **Slap**, and **Dooders** have enough juice to steal weeks. **Mease** has the hardest assignment in Madden 27 — and still gets named in the same breath as the elite.

Talent on the roster is not the same as talent on the sticks.

## Early Super Bowl math

- **Best team:** Rams (Jordan Stowe) — 91 OVR throne
- **Obvious favorite:** Jordan Stowe — win-now pressure with the best toys
- **Morning Show chalk:** Petey’s Seahawks
- **Sleeper:** Big Al’s Steelers
- **Dark horse with toys:** Ren’s Patriots (86 OVR)
- **Wild cards:** Primetime, Slap, Dooders, Mease

## Desk verdict

Put the money on **Jordan Stowe** until someone proves the Rams can be coached off the mountain.

Put the *story* on **Big Al** — because a last-pick defense winning the first Madden 27 Super Bowl would break Discord for a week.

And if the Morning Show is right about chalk? **Petey** walks into February with Seattle, five fingers up, and a league full of team merchants asking what just happened.

The King is back. The board is set. First champion still blank.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -10,
  },
  {
    slug: "season-1-trade-rumors-heating-up",
    category: StoryCategory.FEATURE,
    title: "Rumors heating up around the league",
    eyebrow: "KML Morning Show · Trade desk",
    summary:
      "Garrett Wilson, Brian Branch, and Calvin Ridley hit the trade block while Coach Swipa eyes Joey Bosa — and Panthers ownership just flipped to Nick.",
    body: `![KML Morning Show — Rumors heating up around the league](${STORY_ASSETS.tradeRumors})

The KML Morning Show didn’t ease into the week. **Mad Dog, Stephen A., and Shannon** slammed the desk with one banner across the board: **rumors are heating up around the league.**

Trades. Controversies. A franchise sale in Carolina. Unfiltered. Unapologetic. Unmatched.

## Trade block: three names the league can’t ignore

The left side of the Morning Show graphic stamped three stars with the same red label — **TRADE RUMORS**:

| Player | Current team | Why the desk is buzzing |
| --- | --- | --- |
| **Garrett Wilson** | Jets | Elite WR talent that every contend club would dial for |
| **Brian Branch** | Lions | Playmaking safety who changes how offenses script weeks |
| **Calvin Ridley** | Titans | Proven vertical threat available while Tennessee sorts its window |

Nobody on the panel treated this as idle Discord chatter. When Wilson, Branch, and Ridley are all in the same trade conversation, **rosters across KML can flip overnight**. Contenders sharpen their offers. Rebuilders decide whether to cash chips or hold the line.

The ticker said it clean: **trades could shake the league.**

## San Francisco flashpoint: Swipa wants Bosa

The center desk owned the loudest segment.

**Coach Swipa and the 49ers want to sign Joey Bosa** — and the Morning Show’s framing was blunt. That move wouldn’t just add a veteran edge. It would **take snaps away from two young rushers San Francisco has already invested in: Mykel Williams and Romello Height.**

That’s the controversy. Not “is Bosa good?” Everybody knows Bosa can wreck a pocket. The question is whether a coach who just committed draft capital and development time to young edge talent should immediately **steal their reps for a splash signing**.

The graphic put the tension on screen:

- **Joey Bosa** in the red and gold — win-now pressure personified
- **Coach Swipa** arms crossed on the headset — the decision-maker in the blast radius
- **Mykel Williams** and **Romello Height** underneath — the young guys watching their runway shrink

And then the desk asked the question that sticks to a coach’s reputation:

**Could Coach Swipa lose his locker room early and begin to gain a bad rep for making irrational decisions?**

In KML, Coaching Reputation and GM Reputation both have memory. A short-sighted vet grab that buries drafted talent isn’t just a depth-chart tweak — it’s a **front-office storyline**. Culture Builder identities hate this tape. Win Now identities love the aggression. Swipa is about to tell the league which one he actually is.

Ticker version: **49ers making moves… or mistakes?**

## Breaking: new Panthers owner

While the trade board burned, Carolina got a different kind of headline.

**Nick bought the franchise from former owner Wdub.**

New keys. New voice. New era in Charlotte. Ownership changes don’t always move the scoreboard in Week 1 — but they **absolutely** change how trades, contracts, and Hot Seat patience get handled. The Morning Show stamped it **BREAKING NEWS** for a reason: every coach in that division just got a new variable.

## Desk takeaways

- **Wilson / Branch / Ridley** are the three trade names every GM should have a plan for — buy, sell, or block.
- **Swipa’s Bosa chase** is the coaching controversy of the week: veteran juice versus young investment in Mykel Williams and Romello Height.
- **Nick’s Panthers purchase** ends the Wdub chapter and starts a new Carolina timeline.
- Reputation is watching. Irrational splash moves don’t just show up in the box score — they show up on the Hot Seat board.

## Morning Show verdict

If you’re a contender, start dialing on **Garrett Wilson, Brian Branch, and Calvin Ridley** before someone else does.

If you’re in San Francisco, watch the edge room. **Bosa might help you win now — or he might cost Swipa the locker room** if Mykel and Romello become afterthoughts.

And if you’re in Carolina: welcome to the Nick era. The ticker already said it — **stay locked in.**

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -20,
  },
  {
    slug: "season-1-week-2-morning-show",
    category: StoryCategory.FEATURE,
    title: "Maye’s a closer, CMC is that dude, and Bone wants an investigation",
    eyebrow: "KML Morning Show · Week 2",
    summary:
      "Stephen A. stamps Drake Maye after the Super Bowl rematch. Shannon crowns CMC Offensive Player of the Week. Special guest Bone says the Titans cheated him — and the desk already has Week 2 Primetime loaded.",
    body: `![KML Morning Show — Week 2](${STORY_ASSETS.week2MorningShow})

The KML Morning Show did not recap Week 1 quietly.

**Stephen A.** came in hot on one side of the desk. **Shannon** came in louder on the other. And the special guest in the middle — **Coach Bone of the New York Jets** — brought a conspiracy board.

Unfiltered. Unapologetic. Unmatched. The banner already said it: **big stage, big names, big moments.**

## Stephen A.: the Patriots are for real

The left side of the desk did not hedge.

**“The Patriots and Drake Maye are for real! That game winner in the Super Bowl rematch? That’s a closer!”**

Week 1 opened with the cleanest stage in the league: **Petey’s Seahawks** versus **Ren’s Patriots** — Morning Show chalk against a dark-horse elite user, Super Bowl brands, first snap of Season 1.

New England survived it. **Drake Maye** delivered a game-winning touchdown drive with **30 seconds remaining**, and Stephen A. turned that into a label the rest of KML now has to live with.

Not a lucky opener. A closer.

That stamp hits even harder with [Sunday Night Football](/storylines/season-1-week-2-primetime) on deck: **Patriots vs Steelers**. Two top-five users. No excuses. If Maye does it again under the lights, the dark-horse toys stop looking like a sleeper and start looking like the favorite.

## Shannon: CMC is that dude

Shannon did not come to debate the box score.

**“CMC is that dude! 290 total yards and 3 TDs! That’s Offensive Player of the Week!”**

**Christian McCaffrey** ate a primetime night against the Rams — **290 scrimmage yards, three touchdowns**, and the Offensive Player of the Week stamp that goes with it. **Swipe’s 49ers** didn’t just beat Hollywood. They embarrassed the best roster in Madden 27 on the first Thursday of the season.

Now San Francisco draws **Mease’s Dolphins** in Week 2 TNF. Roster talent versus user talent. Shannon’s argument is simple: when CMC looks like that, the 90 overall offense is the standard. Mease’s argument has been the same since draft night: stick skill can erase a 74 overall.

Thursday night is where those two sentences collide.

## Special guest: Bone says he was cheated

Then the show handed the mic to **Coach Bone**.

**“I was cheated, plain and simple! The Titans should’ve lost that game! Bad calls, questionable clock management… the league needs to look into this!”**

That is not a polite recap. That is a Jets coach on the Morning Show telling the entire league that **Qon’s Titans** got away with one.

Bad calls. Clock management. A demand for an investigation. The graphic put it in a green bubble for a reason — this is the controversy segment, and Bone did not blink.

Whether the desk agrees is a different show. The storyline is already live: a Week 1 result Bone refuses to accept, a Titans team that will hear about it all week, and a Jets locker room that thinks the tape got stolen.

Ticker version: **Bone wants the league to look into it.**

## Week 1 recap: the tape the desk can’t ignore

The center column was a heater reel.

| Story | What happened | Why the desk is still yelling |
| --- | --- | --- |
| **CMC / 49ers** | 290 scrimmage yards, 3 TDs | Offensive Player of the Week — and a primetime statement over the Rams |
| **Jaden Hicks / Chiefs** | 3 INTs, including a pick-six | Defensive Player of the Week — Trent’s Chiefs got a takeaway clinic |
| **Drake Maye / Patriots** | Game-winning TD drive, 30 seconds left | Super Bowl rematch closer. Stephen A. already made it a nickname |
| **Justin Herbert / Chargers** | 5 TDs in a comeback over the Raiders | Oli’s Chargers climbed out on Prime’s Raiders |
| **Lions** | Demolished the Saints by 30+ | Curry’s 87 OVR looked like January. The ticker already asked the follow-up |

That Lions number is the one the bottom of the screen would not let go:

**Can the Lions do that again in Week 2?**

Slap and the Saints were supposed to be a game-changer on a bubble roster. A 30-piece in the opener is how win-now clubs start writing the season in ink — or how they set a bar they have to clear every Sunday.

## Around the league

The right rail did not ease up either.

- **Jets / Titans:** Bone is not moving on. He wants the league in the film room.
- **Steelers:** Big Al’s 87 defense surrendered **40 points to Atlanta**. The Morning Show called Pittsburgh a sleeper in Week 1. Sunday night against Ren is the prove-it game.
- **Seahawks:** Petey is coming off a heartbreaking Super Bowl rematch loss. The chalk just took a punch. Week 2 is where Seattle answers, or the “Seahawks in 5” talk gets quieter.
- **Browns vs Buccaneers:** Two stingy defenses that allowed **zero touchdowns** in Week 1. Somebody’s shutdown tape is about to meet the other one.

## Week 2 Primetime is already lit

The left column of the graphic was the teaser. The full slate lives on the Primetime board.

| Window | Matchup | Desk line |
| --- | --- | --- |
| TNF | 49ers vs Dolphins | Talent vs. skill. Who sets the standard? |
| SNF | Patriots vs Steelers | Two top-5 users. No excuses. |
| MNF | Rams vs Giants | Welcome to the hot seat. Another blowout puts the Rams coach on the brink. |

Lock your winners on the [Week 2 Primetime lock-in](/storylines/season-1-week-2-primetime). The Morning Show just told you why those three games are the show.

## Morning Show verdict

**Ren and Drake Maye** are not a cute Week 1 story anymore. Stephen A. called him a closer. Sunday night is the cross-check.

**Swipe and CMC** have the OPOW tape and the Thursday night lights again. If Miami spoils it, Mease becomes the loudest 74 overall in the league.

**Bone** just made Jets–Titans personal in front of the whole desk. That doesn’t go back in the bottle.

And **Curry’s Lions** dropped 30-plus on a game-changer. The ticker asked the only question that matters next: can they do that again?

Stay locked in.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -25,
    week: 2,
  },
  {
    slug: "season-1-team-draft-complete",
    category: StoryCategory.DRAFT,
    title: "The draft is locked: every coach has a franchise",
    eyebrow: "Season 1 · Draft desk",
    summary:
      "Final team selection is official. Jordan Stowe walked out with the No. 1 Rams. Mease drew the toughest rebuild in Miami. Here’s the full board — and the Madden 27 ratings that shape Season 1.",
    body: `The Kings Madden League draft room is closed.

Thirty-two coaches. Thirty-two franchises. One season about to tip from draft chatter into real scoreboard pressure.

Official Madden NFL 27 team overalls (via Madden Underground) now sit next to every pick — and they tell a clear story. Some coaches inherited ready-made contenders. Others inherited long roads and longer nights.

## What the ratings say

The top of the board is stacked. The **Rams (91)** are the highest-rated team in Madden 27, with a league-best **93 offense**. The **Eagles (88)** are the most complete two-way club. The **Lions (87)** and **Bills (85)** bring elite scoring offenses. The **Ravens (87)** and **Broncos (86)** can win on both sides of the ball.

At the other end, the rebuild desk is real. The **Dolphins (74)** are the lowest-rated team in the game. The **Titans (75)**, **Jets (76)**, and **Browns (77)** will need coaching, patience, and weekly proof.

That gap is the point of this league: talent gets you drafted. Coaching decides who survives.

## Final team selection

| Pick | Coach | Team | OVR | OFF | DEF |
| --- | --- | --- | --- | --- | --- |
| 1 | Curry | Lions | 87 | 91 | 83 |
| 2 | Wrinzo | Patriots | 86 | 87 | 85 |
| 3 | Biz | Giants | 79 | 80 | 79 |
| 4 | Chance | Packers | 81 | 82 | 82 |
| 5 | Jordan Stowe | Rams | 91 | 93 | 88 |
| 6 | Prime | Raiders | 79 | 79 | 77 |
| 7 | Lefty | Eagles | 88 | 88 | 87 |
| 8 | Nick | Bengals | 83 | 88 | 77 |
| 9 | Qon | Titans | 75 | 74 | 79 |
| 10 | Puddin | Broncos | 86 | 85 | 87 |
| 11 | Trent | Chiefs | 84 | 90 | 80 |
| 12 | Noquestions | Ravens | 87 | 90 | 87 |
| 13 | Jsmood | Cowboys | 83 | 87 | 80 |
| 14 | Jaylen Stowe | Bears | 83 | 85 | 82 |
| 15 | Bone | Jets | 76 | 75 | 79 |
| 16 | Dimez | Jaguars | 78 | 79 | 79 |
| 17 | Oli | Chargers | 82 | 85 | 79 |
| 18 | Watermann | Texans | 84 | 80 | 87 |
| 19 | Gotti | Falcons | 82 | 83 | 79 |
| 20 | Dre | Buccaneers | 80 | 83 | 79 |
| 21 | Pryor | Bills | 85 | 91 | 79 |
| 22 | Swipe | 49ers | 85 | 90 | 82 |
| 23 | MONEYTEAMPETEY | Seahawks | 84 | 83 | 82 |
| 24 | Quon | Colts | 82 | 83 | 79 |
| 25 | Dooders | Cardinals | 78 | 79 | 75 |
| 26 | Slap | Saints | 79 | 80 | 75 |
| 27 | Wdub | Panthers | 81 | 79 | 82 |
| 28 | Jerm | Commanders | 79 | 80 | 77 |
| 29 | Fitz | Vikings | 80 | 82 | 79 |
| 30 | Jgold | Browns | 77 | 74 | 80 |
| 31 | Mease | Dolphins | 74 | 74 | 72 |
| 32 | Big Al | Steelers | 81 | 79 | 87 |

## Madden 27 team rankings (best to worst)

| Rank | Team | OVR | OFF | DEF | League coach |
| --- | --- | --- | --- | --- | --- |
| 1 | Rams | 91 | 93 | 88 | Jordan Stowe |
| 2 | Eagles | 88 | 88 | 87 | Lefty |
| 3 | Lions | 87 | 91 | 83 | Curry |
| 4 | Ravens | 87 | 90 | 87 | Noquestions |
| 5 | Broncos | 86 | 85 | 87 | Puddin |
| 6 | Patriots | 86 | 87 | 85 | Wrinzo |
| 7 | 49ers | 85 | 90 | 82 | Swipe |
| 8 | Bills | 85 | 91 | 79 | Pryor |
| 9 | Chiefs | 84 | 90 | 80 | Trent |
| 10 | Seahawks | 84 | 83 | 82 | MONEYTEAMPETEY |
| 11 | Texans | 84 | 80 | 87 | Watermann |
| 12 | Bears | 83 | 85 | 82 | Jaylen Stowe |
| 13 | Bengals | 83 | 88 | 77 | Nick |
| 14 | Cowboys | 83 | 87 | 80 | Jsmood |
| 15 | Chargers | 82 | 85 | 79 | Oli |
| 16 | Colts | 82 | 83 | 79 | Quon |
| 17 | Falcons | 82 | 83 | 79 | Gotti |
| 18 | Packers | 81 | 82 | 82 | Chance |
| 19 | Panthers | 81 | 79 | 82 | Wdub |
| 20 | Steelers | 81 | 79 | 87 | Big Al |
| 21 | Buccaneers | 80 | 83 | 79 | Dre |
| 22 | Vikings | 80 | 82 | 79 | Fitz |
| 23 | Commanders | 79 | 80 | 77 | Jerm |
| 24 | Giants | 79 | 80 | 79 | Biz |
| 25 | Raiders | 79 | 79 | 77 | Prime |
| 26 | Saints | 79 | 80 | 75 | Slap |
| 27 | Cardinals | 78 | 79 | 75 | Dooders |
| 28 | Jaguars | 78 | 79 | 79 | Dimez |
| 29 | Browns | 77 | 74 | 80 | Jgold |
| 30 | Jets | 76 | 75 | 79 | Bone |
| 31 | Titans | 75 | 74 | 79 | Qon |
| 32 | Dolphins | 74 | 74 | 72 | Mease |

## Early storylines to watch

- **Win-now pressure:** Jordan Stowe (Rams), Lefty (Eagles), Curry (Lions), and Noquestions (Ravens) drafted premium clubs. Expectations arrive in Week 1.
- **Explosive offense lanes:** Lions, Bills, Rams, 49ers, and Chiefs can light up the scoreboard fast.
- **Defense-first identities:** Broncos, Texans, and Steelers can win ugly and force turnovers.
- **Rebuild bosses:** Mease (Dolphins), Qon (Titans), Bone (Jets), and Jgold (Browns) just signed up for the hardest coaching jobs in the league.

Draft night is over. Contracts are live. Week 1 is next.

Welcome to the Kings Madden League.`,
    isFeatured: false,
    sortOrder: 0,
  },
  {
    slug: "season-1-week-1-primetime",
    category: StoryCategory.GAME_OF_WEEK,
    title: "KML Primetime Week 1: big games, big stage",
    eyebrow: "Games of the week · Season opener",
    summary:
      "Seahawks–Patriots kicks off KML as a Super Bowl rematch — Morning Show chalk vs Ren’s dark-horse Patriots — plus MNF, TNF, and SNF heaters.",
    body: `![KML Primetime Week 1](${STORY_ASSETS.week1Primetime})

**Big games. Big stage. This is KML.**

Week 1 doesn’t wait for September drama to build itself. The Primetime board is already lit: a Season Opener Super Bowl rematch, Monday Night Football, Thursday Night Football, and Sunday Night Football — four stages, four storylines, and the first real tape of the Madden 27 cycle.

The Morning Show already argued who lifts the first Lombardi. Roster overalls tell you who should win. League history tells you who can. Week 1 is where those two theories collide for the first time.

## Season Opener — Seahawks vs Patriots

This is the kickoff. Season opener. Super Bowl rematch — the same brands that just played for the real Lombardi, now opening KML.

On one sideline: **Petey** and the **Seahawks (84 OVR)** — the Morning Show’s chalk pick to hoist the first Lombardi, with **Sam Darnold** as the defending Super Bowl quarterback. On the other: **Ren** and the **Patriots (86 OVR · 87 OFF · 85 DEF)** — one of KML’s known best users sitting on a top-six roster built around **Drake Maye** and **A.J. Brown**.

That is not a normal Week 1. That is player chalk versus dark-horse toys in a rematch frame, with the entire league watching the first snap of Season 1.

## Why this game matters

When the desk argued who lifts the first Lombardi, both of these names were already on the board:

- **Morning Show chalk:** Petey’s Seahawks — Seahawks in 5
- **Dark horse with toys:** Ren’s Patriots — elite user, contend-ready New England

Put those two in the same building for Game 1 and you get the cleanest early measuring stick in the league that isn’t just “best overall wins.” Petey’s reputation is scheme-first and ruthless. Ren’s reputation is that the sticks travel even when the narrative doesn’t. If Seattle hangs and leaves with a statement, the chalk gets louder. If New England spoils the opener, every “team merchant” argument in Discord gets a new exhibit — and Ren’s dark-horse lane opens at full speed.

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Seahawks** | Petey | **Sam Darnold** | **Jaxon Smith-Njigba** — the volume WR who forces coverages to break | **Devon Witherspoon** — takeaway juice that flips field position |
| **Patriots** | Ren | **Drake Maye** | **A.J. Brown** — the contested-catch WR1 New England traded for this offseason | **Christian Gonzalez** — erase JSN and force Petey left |

Can Petey keep Maye off schedule and win with complementary football? Or does Maye and A.J. Brown turn the Super Bowl rematch into New England’s first statement of the Madden 27 cycle?

## Monday Night Football — Chiefs vs Broncos

**Trent’s Chiefs (84 OVR · 90 OFF)** against **Puddin’s Broncos (86 OVR · 87 DEF)**.

This is explosiveness versus identity. Kansas City still grades as a 90 overall offense — perennial contending DNA. Denver took one of the cleanest surprise boards in the draft: elite defense, improved attack, and a coach with a clear stop-and-steal plan.

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Chiefs** | Trent | **Patrick Mahomes** | **Rashee Rice / Xavier Worthy** — the vertical answers after the pocket breaks | **Chris Jones** — interior wrecking ball that creates free rushers |
| **Broncos** | Puddin | **Bo Nix** | **Patrick Surtain II** — erase a WR1 and force Mahomes left | **Courtland Sutton** — contested-catch outlet when Denver needs a drive to breathe |

If Mahomes gets clean looks, MNF becomes a track meet. If Surtain and the 87 DEF front force checkdowns, Puddin’s Broncos can win ugly — exactly the path the Morning Show respects.

## Thursday Night Football — Rams vs 49ers

**Jordan Stowe’s Rams (91 OVR)** — the best roster in Madden 27, now with **Myles Garrett** on the edge after the June trade — against **Swipe’s 49ers (85 OVR · 90 OFF)**, the late-draft steal with a premium attack and the coaching storyline already buzzing from the Bosa trade desk.

NFC West heat. Primetime lights. Immediate tape for the throne and the challenger next door.

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Rams** | Jordan Stowe | **Matthew Stafford** | **Puka Nacua** — the cover-2 breaker that turns 93 OVR offense into points | **Myles Garrett** — the league’s premier edge, now in Hollywood |
| **49ers** | Swipe | **Brock Purdy** | **George Kittle** — the mismatch that beats zone and sells play-action | **Fred Warner** — the green-dot problem that erases shallow crossers |

San Francisco’s 90 offense can hang with anyone in a shootout. The question is whether Jordan Stowe’s 88 defense — now headlined by Garrett — and Hollywood’s star skill make TNF a statement for the league’s best roster or a trap game against NFC West juice.

## Sunday Night Football — Cowboys vs Giants

**Jsmood’s Cowboys (83 OVR · 87 OFF)** versus **Biz’s Giants (79 OVR)**.

User-wise, this is pressure versus proof. Dallas still brings offensive firepower and star skill. New York took a mid/low overall early in the draft — Biz has to outcoach the rating from Week 1 or the “bar was too high” narrative starts immediately.

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Cowboys** | Jsmood | **Dak Prescott** | **CeeDee Lamb** — the gravity WR who opens the entire tree | **Rashan Gary** — the new-look pass rush that has to replace Parsons production |
| **Giants** | Biz | **Jaxson Dart** | **Malik Nabers** — the explosive answer that keeps 79 OVR dangerous | **Abdul Carter** — Year 2 edge chaos next to Brian Burns |

If Lamb eats, SNF becomes another Dallas showcase. If Dart, Nabers, and Carter steal a possession game, Biz gets the first “don’t sleep on the rating” headline of Season 1.

## Primetime Week 1 cheat sheet

| Window | Matchup | Coaches | Why it’s on the board |
| --- | --- | --- | --- |
| Season Opener | Seahawks–Patriots | Petey vs Ren | Super Bowl rematch + chalk vs dark-horse elite user |
| MNF | Chiefs–Broncos | Trent vs Puddin | 90 OFF fireworks vs 87 DEF identity |
| TNF | Rams–49ers | Jordan Stowe vs Swipe | Best roster in the game vs NFC West heat |
| SNF | Cowboys–Giants | Jsmood vs Biz | Star offense vs early-pick prove-it night |

## Desk verdict

The first champion article told you the map: **Jordan Stowe has the mountain**, **Petey has the chalk**, **Ren has the dark-horse toys**, and a handful of game-changers are waiting to ruin someone’s Sunday.

Week 1 Primetime doesn’t settle the Lombardi. It does something meaner — it puts the theories on tape, starting with a Super Bowl rematch kickoff.

Submit the scores. Stamp the Sim Scores. Let the desk argue.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -30,
    week: 1,
  },
  {
    slug: "season-1-week-2-primetime",
    category: StoryCategory.GAME_OF_WEEK,
    title: "KML Primetime Week 2: talent vs. skill — and the hot seat",
    eyebrow: "Games of the week · Primetime slate",
    summary:
      "TNF is roster talent versus the best user in KML. SNF is two top-five coaches with no excuses. MNF puts the Rams back under the lights — one more blowout and the hot seat conversation starts.",
    body: `![KML Primetime Week 2](${STORY_ASSETS.week2Primetime})

**Big stage. Big names. Big moments. This is KML Primetime.**

Week 1 put the theories on tape. Week 2 puts three windows back under the lights with meaner stakes: a Thursday opener about roster talent versus stick skill, a Sunday-night heavyweight between two of KML’s best, and a Monday-night job-security special the reputation system was built for.

The board is locked. The desk is already arguing.

## Thursday Night Football — 49ers vs Dolphins

**The champ vs. the standard.**

This is the perfect Thursday opener.

**Swipe’s 49ers (85 OVR · 90 OFF)** are coming off a dominant primetime win over the Rams, with **Christian McCaffrey** putting up **290 scrimmage yards and three touchdowns** and walking away with Offensive Player of the Week. Now they get a less-talented Dolphins roster — **Mease’s Miami (74 OVR)**, the lowest-rated team in Madden 27.

This is not last year’s Dolphins. **Tua is gone. Tyreek is gone.** The August 2026 tape is **Malik Willis** at quarterback and **De’Von Achane** as the one true star on a rebuild.

The catch: Mease is already **1–0** after beating Las Vegas, and the league has been calling him one of the best users in KML since draft night. Roster overalls told you San Francisco should cook. League history told you Mease can erase a ratings gap with the sticks.

The question becomes: was San Francisco’s Week 1 dominance about the roster, or are they really a contender?

Miami has the perfect opportunity to remind everyone that in KML, stick skill can wipe out a roster disadvantage.

## Why this game matters

- **Star power:** CMC just took over a primetime night and left with OPOW
- **Elite user:** Mease on the lowest overall in the game, already 1–0
- **Upset potential:** 90 OFF versus 74 OVR is supposed to be a mismatch. Thursday nights exist to ruin that sentence.

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **49ers** | Swipe | **Brock Purdy** | **Christian McCaffrey** — 290 scrimmage yards is the new baseline | **George Kittle** — the mismatch that beats zone and sells play-action |
| **Dolphins** | Mease | **Malik Willis** | **De’Von Achane** — 88 OVR, the one star on a 74 overall rebuild | **Chop Robinson** — the edge who already hit the Week 1 honors board |

If CMC gets going again, TNF becomes another San Francisco statement. If Mease turns a rebuild roster into a primetime steal, every “team merchant” argument in Discord gets a new exhibit.

## Sunday Night Football — Patriots vs Steelers

**Prove it.**

This is the best pure matchup of the week.

Two top-five users. Two relatively even teams. Two completely different emotions entering Week 2.

**Ren’s Patriots (86 OVR · 87 OFF · 85 DEF)** just survived a dramatic Super Bowl rematch. **Drake Maye** delivered a game-winning TD drive with 30 seconds remaining. New England is 1–0 against Morning Show chalk and has a chance to start 2–0 against quality competition.

**Big Al’s Steelers (81 OVR · 87 DEF)** enter angry.

Pittsburgh surrendered 40 points to Atlanta in the opener — and a team expected to hang its hat on defense suddenly has something to prove. Another poor defensive showing, this time under the Sunday-night spotlight, would start raising legitimate questions about the sleeper tape the desk sold in Week 1.

Meanwhile, New England has an opportunity to establish itself as an early championship favorite. No excuses. No ratings alibi. Just two of the names that actually scare the room.

## Why this game matters

- **Marquee football:** two top-five users, balanced enough rosters, primetime implications
- **Patriots path:** beat Pittsburgh and the dark-horse toys start looking like the favorite
- **Steelers path:** the 87 DEF has to look like the 87 DEF, or the sleeper talk gets quieter fast

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Patriots** | Ren | **Drake Maye** | **A.J. Brown** — the contested-catch WR1 who finished the rematch | **Christian Gonzalez** — erase a Steelers skill piece and force Big Al left |
| **Steelers** | Big Al | **Aaron Rodgers** | **T.J. Watt** — the 87 DEF identity in one jersey | **DK Metcalf** — the vertical answer when Pittsburgh has to score |

Can Maye and A.J. Brown keep stacking signature drives? Or do Watt, Metcalf, and the front seven get the tape Big Al needed after Atlanta?

## Monday Night Football — Rams vs Giants

**The pressure is on.**

This isn’t necessarily the best matchup.

It’s the best storyline.

**Jordan Stowe’s Rams (91 OVR)** were embarrassed by San Francisco in their Week 1 primetime appearance, and the consequences have already started. Their coaching grade fell **five points** after the blowout.

Now they’re being put right back underneath the lights.

Another primetime blowout could drop the Rams to a **75** coaching grade — Hot Seat territory heading into Week 3.

Across the field is **Biz** and the **Giants (79 OVR)** — a coach who couldn’t care less about saving anyone’s job. He’s new to KML and already opened his tenure with a victory over Dallas.

Beat the Rams on Monday night and suddenly the newcomer is **2–0** with a primetime win, and everyone in KML knows his name.

For the Rams? Win, and Week 1 starts looking like a bad night. Get embarrassed again, and Week 3 begins with the league talking about your job.

## Why this game matters

Your league’s media and reputation system is built for games exactly like this. Primetime blowout losses stack. Coaching grades move. Hot Seat whispers become Hot Seat math.

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Rams** | Jordan Stowe | **Matthew Stafford** | **Puka Nacua** — the cover-2 breaker that turns 93 OVR offense into points | **Myles Garrett** — the league’s premier edge still looking for a statement |
| **Giants** | Biz | **Jaxson Dart** | **Malik Nabers** — the explosive answer that already helped beat Dallas | **Abdul Carter** — Year 2 edge chaos next to Brian Burns |

If Hollywood’s toys finally look like a 91, the throne gets its first clean win. If Dart, Nabers, and Carter steal another one, Biz isn’t a newcomer anymore — he’s a problem.

## Primetime Week 2 cheat sheet

| Window | Matchup | Coaches | Why it’s on the board |
| --- | --- | --- | --- |
| TNF | 49ers–Dolphins | Swipe vs Mease | Roster talent vs. user talent |
| SNF | Patriots–Steelers | Ren vs Big Al | Two top-5 users. No excuses. |
| MNF | Rams–Giants | Jordan Stowe vs Biz | Welcome to the hot seat |

## Desk verdict

Week 1 told you **Swipe can cook on the big stage**, **Ren can finish a rematch**, **Biz can beat the rating**, and **Jordan Stowe’s mountain is not automatic**.

Week 2 asks the meaner follow-ups:

- Can Mease erase 74 overall on Thursday night?
- Can Big Al’s defense look like the sleeper the desk sold — or does Ren go 2–0 and grab the early favorite chair?
- Can the Rams survive another primetime night, or does Monday Night Football become the first real Hot Seat episode of Season 1?

Lock your picks. Submit the scores. Let the desk argue.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -40,
    week: 2,
  },
  {
    slug: "season-1-week-3-primetime",
    category: StoryCategory.GAME_OF_WEEK,
    title: "KML Primetime Week 3: somebody’s 0 has to go",
    eyebrow: "Games of the week · Primetime slate",
    summary:
      "Thursday is 2–0 vs 2–0. Sunday is new blood in Dallas. Monday is Oli vs Pryor, both 2–0 — plus Mease-Trent, a 5x champ at 0–2, and Slap staring down 0–3.",
    body: `![KML Primetime Week 3](${STORY_ASSETS.week3Primetime})

**Every team. Primetime. Every season.**

Week 2 is in the books. Week 3 does not ease anyone in. The board is stacked: two undefeated clubs on Thursday, two new coaches under the Sunday-night lights, and a Monday 2–0 vs 2–0 signature-win hunt between newcomers who already have the league’s attention.

All 32 teams get their primetime moment. This week, the lights are unforgiving.

## Thursday Night Football — Bears vs Eagles

**Somebody’s 0 has to go.**

Both clubs are **2–0**. Both just cooked on defense. Combined, they forced **nine interceptions** in their last games. One of those zeroes is about to die on Thursday night.

**Jaylen Stowe’s Bears (83 OVR · 85 OFF · 82 DEF)** are riding cover-athlete juice. **Caleb Williams** is a 90 overall quarterback who can break a sack and throw on the run with the best of them. **Rome Odunze** and **Colston Loveland** give Chicago answers after the first read. **Jaylon Johnson** is a 90 overall corner who can erase a WR1 and make Lefty’s 88 offense work for it.

**Lefty’s Eagles (88 OVR · 88 OFF · 87 DEF)** are still the most complete two-way club in the draft that isn’t Hollywood. This is not last year’s Eagles either — **A.J. Brown is in New England now.** The August 2026 tape is **Jalen Hurts**, **Saquon Barkley (92)**, and **DeVonta Smith (92)**, with **Lane Johnson** still a 97 overall mauler up front.

Lefty is new to the KML primetime stage. He hasn’t had his moment under these lights yet. Thursday is the invitation.

## Why this game matters

- **Unbeaten vs unbeaten:** the first real 2–0 measuring stick of Season 1
- **Defense is the tape:** nine combined picks last week is not a coincidence
- **Lefty’s first primetime:** an 88 overall roster does not get a quiet Thursday

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Bears** | Jaylen Stowe | **Caleb Williams** | **Rome Odunze** — the volume WR who makes 85 OFF travel | **Jaylon Johnson** — 90 CB who can take DeVonta out of the script |
| **Eagles** | Lefty | **Jalen Hurts** | **Saquon Barkley** — 92 OVR, still the downhill answer | **DeVonta Smith** — 92 OVR WR1 now that A.J. Brown is gone |

If Williams and the takeaway defense hold serve, Chicago stays perfect and the cover-athlete story gets louder. If Hurts, Saquon, and Smith finally look like an 88 on primetime, Lefty gets the first big-stage stamp of his KML tenure.

## Sunday Night Football — Ravens vs Cowboys

**The new blood game.**

Two new KML coaches. Two high-powered rosters. Sunday night is where the league finds out if the new names are real.

**Quise’s Ravens (87 OVR · 90 OFF · 87 DEF)** are **2–0** after a 34–16 win in New Orleans. **Lamar Jackson** is still the fastest signal-caller in Madden 27. **Derrick Henry (93)** and **Mark Andrews (90)** is a nightmare trio if Dallas cannot tackle in space. **Zay Flowers** and **Kyle Hamilton** keep both sides of the ball dangerous.

**Javon’s Cowboys (83 OVR · 87 OFF)** are 1–1 and adapting fast. The graphic already said it: Week 2, Dallas allowed **one touchdown**. That is how you go from “new coach on a star roster” to “future contender” in seven days. **Dak Prescott (91)** and **CeeDee Lamb (93)** are still the engine. The question is whether Javon’s Week 2 defensive tape travels against Lamar.

Are we watching future contenders emerge — or a Sunday-night reality check?

## Why this game matters

- **New blood, old toys:** both coaches are new; the rosters are not
- **Javon’s adaptation:** one TD allowed in Week 2 is a statement, not a footnote
- **Ravens path:** stay 3–0 and Baltimore starts looking like January

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Ravens** | Quise | **Lamar Jackson** | **Derrick Henry** — 93 OVR King, still a top-ten back | **Mark Andrews** — the red-zone mismatch that beats Cover 2 |
| **Cowboys** | Javon | **Dak Prescott** | **CeeDee Lamb** — 93 OVR gravity that opens the entire tree | **the Week 2 defense** — one TD allowed has to hold up against Lamar |

If Henry and Lamar get downhill, SNF becomes another Ravens showcase. If Javon’s defense looks like Week 2 again, Dallas is not a 1–1 story anymore — they’re in the contender conversation.

## Monday Night Football — Chargers vs Bills

**Who’s ready to become a star?**

Two newcomers. One Monday night. One signature win.

**Oli’s Chargers (82 OVR · 85 OFF)** are **2–0** after dropping **66** on Las Vegas. Hampton just took AFC Offensive Player of the Week. **Justin Herbert** is a 90 overall field general with 96 throw power. **Ladd McConkey** is the 92-speed separator. **Derwin James** and **Khalil Mack** give a 79 defense enough juice to steal a possession game.

**Pryor’s Bills (85 OVR · 91 OFF)** are **2–0** after taking the **Lions to the wire and winning 32–29**. That is not a soft Week 2. That is a 99 overall **Josh Allen** and a 94 overall **James Cook** hanging with a win-now Lions club and finishing the job. **Khalil Shakir** and **DJ Moore** (yes — Moore is in Buffalo on the August 2026 roster) give Allen answers after Cook.

Monday night, one of them gets the win that makes the league say their name first.

## Why this game matters

- **Star-making window:** both coaches have impressed; only one leaves  with the signature tape
- **Oli’s 2–0:** 66 points on Vegas, then a primetime date with another unbeaten
- **Pryor’s statement:** a 3-point win over Detroit is the tape he takes into Monday night

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Chargers** | Oli | **Justin Herbert** | **Ladd McConkey** — the separator who makes 85 OFF look faster | **Derwin James / Khalil Mack** — the takeaway pair that keeps 2–0 honest |
| **Bills** | Pryor | **Josh Allen** | **James Cook** — 94 OVR, a top-five back in Madden 27 | **DJ Moore / Khalil Shakir** — the 2026 Buffalo answers after Cook |

If Herbert and McConkey keep stacking, Oli goes 3–0 and the Chargers stop being a surprise. If Allen and Cook stack the Lions win into a Monday night statement, Pryor gets the star turn.

## More Week 3 matchups

The primetime windows are the show. The rest of the board is not quiet.

| Matchup | Records | Coaches | Why the desk is watching |
| --- | --- | --- | --- |
| **Dolphins vs Chiefs** | 2–0 vs 2–0 | Mease vs Trent | Mease just took down the 49ers on primetime with Malik Willis and De’Von Achane. Trent’s Chiefs (90 OFF, Mahomes, Kelce, Kenneth Walker) are the crown check. |
| **Bengals vs Steelers** | 1–1 vs 0–2 | Dawson vs Big Al | Big Al’s first 0–2 start in a KML career — 5x champion, one of the greatest ever. Dawson talked big all offseason. This is the get-it-going game vs a struggling legend. |
| **Texans vs Colts** | 0–2 vs 0–2 | Watermann vs Quon | Divisional 0–2 bloodbath. Watermann wants back on track. Indianapolis cannot let the season slip in Week 3. |
| **Falcons vs Packers** | 1–1 vs 2–0 | Gotti vs Chance | Chance is 2–0 and thinks he’s the best in the league. Gotti’s explosive offense — **Drake London (92)** and **Bijan Robinson (95)** — wants to prove it on a big stage. |
| **Saints vs Raiders** | 0–2 vs 0–2 | Slap vs Da Truth | Slap is one of the best ever. Detroit by 30, then 16–34 in Baltimore. Going 0–3 to a non-sim Raiders club is how you spark a generational crash-out in the chat. |

## Primetime Week 3 cheat sheet

| Window | Matchup | Coaches | Why it’s on the board |
| --- | --- | --- | --- |
| TNF | Bears–Eagles | Jaylen Stowe vs Lefty | 2–0 vs 2–0. Somebody’s 0 has to go. |
| SNF | Ravens–Cowboys | Quise vs Javon | New blood. Two high-powered rosters. |
| MNF | Chargers–Bills | Oli vs Pryor | 2–0 vs 2–0. Who’s ready to become a star? |

## Desk verdict

Week 2 told you **Mease can beat the rating on primetime**, and that undefeated clubs are starting to stack.

Week 3 asks the loud ones:

- Can Jaylen Stowe’s Bears take an 88 overall Eagles club’s undefeated record on Thursday — or does Lefty get his first primetime stamp?
- Is Javon’s one-TD Week 2 defense real, or does Lamar and Henry make Sunday night look like old blood?
- Does Oli stay perfect, or does Josh Allen stack the Lions win into a Monday night star turn?

Lock your picks. Submit the scores. Let the desk argue.

One league. All eyes. Every week.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -50,
    week: 3,
  },
  {
    slug: "season-1-week-4-primetime",
    category: StoryCategory.GAME_OF_WEEK,
    title: "KML Primetime Week 4: chips on both shoulders",
    eyebrow: "Games of the week · Primetime slate",
    summary:
      "Thursday is a 3–0 Bucs club vs Chance’s Packers. Sunday is Oli’s unbeaten Chargers vs Petey. Monday is Jordan Stowe vs Lefty — plus Curry-Nick and a Swipe-Puddin get-right game.",
    body: `![KML Primetime Week 4](${STORY_ASSETS.week4Primetime})

**Compete. Grind. Reign.**

Week 4 does not ease anyone in. Thursday is a ring-versus-skill night in Tampa. Sunday is the new threat against Morning Show chalk. Monday is two chips on two of the loudest rosters in Madden 27.

All 32 teams get their primetime moment. This week, the lights are unforgiving.

## Thursday Night Football — Packers vs Buccaneers

**The ring is the difference.**

An all-time great franchise with championship pedigree versus a skill match that’s still chasing the first ring.

**Chance’s Packers (81 OVR · 82 OFF · 82 DEF)** are **2–1** and coming off Jordan Love’s Week 2 surgeon tape — 19-of-24, 305 yards, four touchdowns, a 158.3 rating. Love is still the NFC Offensive Player of the Week until somebody knocks him off. Tampa is the first real 3–0 measuring stick of that story.

**Dre’s Buccaneers (80 OVR · 83 OFF)** are **3–0**. Bucky Irving just ran for 162 and three scores. The graphic already said it: championship DNA on one sideline, a coach still hunting the first KML ring on the other.

Thursday night, somebody’s zero or somebody’s chase takes a hit.

## Why this game matters

- **3–0 vs 2–1:** Tampa has not blinked. Green Bay has to prove the Love stamp travels
- **The ring gap:** pedigree versus a skill match still chasing January
- **TNF stage:** the first primetime night of Week 4 is not a soft opener

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Packers** | Chance | **Jordan Love** | **Love’s Week 2 tape** — 158.3 rating has to show up against 3–0 | **the 82 DEF** — Chance’s club is built to hang in a possession game |
| **Buccaneers** | Dre | **Baker Mayfield** | **Bucky Irving** — 162 yards and 3 TD is the new baseline | **3–0 juice** — Tampa has not given the league a reason to doubt them |

If Love looks like Week 2 again, Chance steals a 3–0 scalp on Thursday and the “best in the league” talk gets louder. If Irving and Tampa’s start hold serve, Dre stays perfect and the ring conversation stays in Florida.

## Sunday Night Football — Chargers vs Seahawks

**The new threat meets his biggest test.**

**Oli’s Chargers (82 OVR · 85 OFF)** are unbeaten and already look explosive. Hampton took AFC Offensive Player of the Week. **Justin Herbert** is a 90 overall field general with 96 throw power. **Ladd McConkey** is the 92-speed separator. **Derwin James** and **Khalil Mack** give a 79 defense enough juice to steal a possession game.

**Petey’s Seahawks (84 OVR · 83 OFF · 82 DEF)** are **2–1** and still the Morning Show’s chalk. **Sam Darnold** is the Super Bowl quarterback. The graphic already said it: Seattle’s defense has allowed **one touchdown in their last two games**. That is how chalk answers a slow start — by erasing offenses.

Sunday night is whether Oli’s explosion is real against a coach the desk already picked to hoist the first Lombardi.

## Why this game matters

- **New threat vs chalk:** Oli has the heater; Petey has the reputation
- **The 1-TD defense:** Seattle’s last two games are a dare to Herbert
- **Unbeaten on the road:** the Chargers’ first real primetime test against Morning Show chalk

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Chargers** | Oli | **Justin Herbert** | **Omarion Hampton** — 208 and 3 TD is still the AFC stamp | **Ladd McConkey** — the separator who makes 85 OFF look faster |
| **Seahawks** | Petey | **Sam Darnold** | **the 1-TD defense** — Witherspoon and the front have to hold up | **Jaxon Smith-Njigba** — the volume WR who forces coverages to break |

If Hampton and Herbert keep stacking, Oli goes into the contender conversation for real. If Petey’s defense looks like the last two weeks, the chalk takes a primetime bite out of the new threat.

## Monday Night Football — Rams vs Eagles

**Chips on both shoulders.**

**Lefty is rolling at 3–0** after taking down the undefeated Bears on Thursday night. **DeVonta Smith** just dropped 142 yards and two scores on 35.5 yards per catch. This is not last year’s Eagles — **A.J. Brown is in New England** — and it has not mattered. Hurts, Saquon (92), DeVonta (92), and an 87 defense that already scored four pick-sixes in Week 2.

**Jordan Stowe’s Rams (91 OVR · 93 OFF · 88 DEF)** are **2–1** and coming off **back-to-back dominant wins** after the Week 1 primetime loss to San Francisco. Stafford threw four scores without a pick. Puka Nacua had three touchdowns. Hollywood’s mountain is back on the Monday night stage against the other 88.

Something has to give.

## Why this game matters

- **3–0 vs the best roster:** Lefty’s start against Jordan Stowe’s 91 overall
- **The Week 1 scar:** Hollywood has answered with two demolitions. This is the measuring stick
- **Two chips:** both coaches have something to prove under the lights

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Rams** | Jordan Stowe | **Matthew Stafford** | **Puka Nacua** — three TDs last week, still the cover-2 breaker | **Myles Garrett** — the league’s premier edge has to wreck Hurts |
| **Eagles** | Lefty | **Jalen Hurts** | **DeVonta Smith** — 35.5 YPR is a different WR1 without A.J. Brown | **Saquon Barkley** — 92 OVR, still the downhill answer |

If Stafford and Puka look like last week, the 91 overall roster reminds the league who owns the mountain. If Hurts, Saquon, and Smith knock off Hollywood on Monday night, Lefty’s 3–0 stop looking like a hot start and start looking like January.

## More Week 4 matchups

The primetime windows are the show. The rest of the board is not quiet.

| Matchup | Records | Coaches | Why the desk is watching |
| --- | --- | --- | --- |
| **Lions vs Panthers** | Lions rolling | Curry vs Nick | Curry is looking for the next statement win. Can Nick’s Panthers make noise and hand him his first scare of the month? |
| **Broncos vs 49ers** | 0–3 vs get-right | Puddin vs Swipe | Both looking to get back on track. Puddin is 0–3 after Hollywood dropped 35 in Denver. Swipe needs the get-right win after Miami spoiled the primetime hangover. |

## Primetime Week 4 cheat sheet

| Window | Matchup | Coaches | Why it’s on the board |
| --- | --- | --- | --- |
| TNF | Packers–Buccaneers | Chance vs Dre | The ring is the difference. 2–1 vs 3–0. |
| SNF | Chargers–Seahawks | Oli vs Petey | The new threat meets his biggest test. |
| MNF | Rams–Eagles | Jordan Stowe vs Lefty | Chips on both shoulders. Something has to give. |

## Desk verdict

Week 3 told you **Lefty can win a 2–0 fight**, **Rodgers can drop six**, and **Sneed can erase a night**.

Week 4 asks the loud ones:

- Can Chance’s Packers knock off a 3–0 Bucs club on Thursday — or does Dre’s start stay perfect?
- Is Oli’s explosion real against Petey’s 1-TD defense, or does the chalk take Sunday night?
- Do the Rams’ back-to-back demolitions hold up against Lefty’s 3–0, or does Monday night belong to the other 88?

Lock your picks. Submit the scores. Let the desk argue.

One league. All eyes. Every week.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -60,
    week: 4,
  },
  {
    slug: "season-1-week-5-primetime",
    category: StoryCategory.GAME_OF_WEEK,
    title: "KML Primetime Week 5: four massive matchups, one statement week",
    eyebrow: "Games of the week · Primetime slate",
    summary:
      "Curry’s 4–0 Lions are the Game of the Week against Dooders. Chance and Jaylen Stowe collide at 3–1. Swagg draws Javon. Big Al and Quon meet at .500. Anybody can win. Legends are made in primetime.",
    body: `![KML Primetime Week 5](${STORY_ASSETS.week5Primetime})

**Anybody can win. But legends are made in primetime. KML.**

Four massive matchups. One statement week. The desk did not pick a Thursday-Sunday-Monday split this time. It picked four games that can change the table.

This is KML. This is primetime. Every game matters.

## Game of the Week — Lions vs Cardinals

**Respect is earned. This game can change everything.**

**Curry’s Lions (87 OVR · 91 OFF)** are **4–0** and running the most explosive offense in the league. They just dropped **56** on Carolina. **Jahmyr Gibbs** went for 163 rushing, 53 receiving, and four total touchdowns. Curry is making a name on a 91 overall attack that does not slow down.

**Dooders’ Cardinals (78 OVR)** are the high-IQ trap on the other sideline. Arizona is not supposed to hang with 4–0 Detroit. That is the point. A 78 overall club with a coach who can steal weeks is how undefeated starts die.

If Curry keeps stacking, the Lions stop being a hot start and start looking like the team to beat. If Dooders knocks off 4–0, the whole league rewrites the board overnight.

## Why this game matters

- **The only 4–0:** Detroit is the last unbeaten. This is the first real scalp hunt
- **Rating vs IQ:** 91 offense against a 78 overall coach who lives for this spot
- **Statement week:** a Lions win makes Curry the name. A Cardinals win makes everybody else believe

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Lions** | Curry | **Jared Goff** | **Jahmyr Gibbs** — 216 scrimmage yards and 4 TD is the new baseline | **91 OFF** — the most explosive attack in Madden 27 |
| **Cardinals** | Dooders | **Kyler Murray** | **Jeremiyah Love** — already on the Week 3 honors board | **the trap** — 78 OVR that only works if Dooders steals it |

## Divisional battle — Packers vs Bears

**3–1 vs 3–1.**

**Chance’s Packers (81 OVR)** just won a primetime nail-biter over **Swagg**, 31–30. **Matthew Golden** had three scores. Chance has been telling the league he’s the best in it. He now has a primetime win to staple to the Love stamp.

**Jaylen Stowe’s Bears (83 OVR · 85 OFF)** are also **3–1**. Cover-athlete juice. Caleb Williams. Jaylon Johnson. The graphic already said it: this may be more of a test for Stowe than for Chance.

NFC North. Same record. One of them leaves 4–1 looking like a contender. The other starts answering questions.

## Why this game matters

- **Division math:** 3–1 vs 3–1 in the same division is January seeding in Week 5
- **Chance’s primetime:** he just took down Swagg. Can he stack it against Stowe?
- **The test:** the desk thinks this one sits heavier on Chicago

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Packers** | Chance | **Jordan Love** | **Matthew Golden** — 133 yards and 3 TD in the TNF win | **the primetime hangover** — Chance has to prove 31–30 was not a one-off |
| **Bears** | Jaylen Stowe | **Caleb Williams** | **Jaylon Johnson** — 90 CB who can take Green Bay’s WR1 out | **Rome Odunze** — the volume WR who makes 85 OFF travel |

## Buccaneers vs Cowboys

**Swagg is coming off the loss. Javon is coming off a heartbreaker.**

**Swagg’s Buccaneers (80 OVR)** were 3–0 until Chance ended it by one. Bucky Irving still has the heater. Tampa is 3–1 and hunting the bounce-back.

**Javon’s Cowboys (83 OVR · 87 OFF)** are **2–2** after a one-score loss to Houston. The graphic already said it: **CeeDee Lamb is returning from injury**. Dak (91) and a 93 overall Lamb is how you assert dominance. Javon has been looking for that stamp since Week 1.

Could this be the night Dallas tells the league the 1–1 start was a mirage?

## Why this game matters

- **Bounce-back vs assertion:** Swagg needs the get-right. Javon needs the statement
- **CeeDee’s return:** 93 OVR gravity changes the entire Cowboys tree
- **3–1 vs 2–2:** Tampa can stay in the hunt. Dallas can climb back into it

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Buccaneers** | Swagg | **Baker Mayfield** | **Bucky Irving** — 162 and 3 TD is still the Week 3 stamp | **the 3–1 start** — one loss cannot become two |
| **Cowboys** | Javon | **Dak Prescott** | **CeeDee Lamb** — back from injury, 93 OVR, the whole offense | **the Houston scar** — a 21–23 loss that has to get answered |

## Colts vs Steelers

**A respected user. Solid history. Still missing a ring.**

**Big Al’s Steelers (81 OVR · 87 DEF)** are **2–2** and rolling after the 0–2 start. Rodgers dropped six in Week 3, then 314 and three more on Cleveland. The 5x champ is off the schneid and back in the conversation.

**Quon’s Colts (82 OVR)** have not had a primetime appearance yet. **Jonathan Taylor** just ran for 137 and three scores. Indianapolis can put the league on notice with one win under the lights.

This is the get-right game for a legend versus the first big-stage night for a coach who has been waiting.

## Why this game matters

- **Big Al’s climb:** 0–2 is gone. 2–2 with Rodgers cooking is a different Steelers club
- **Quon’s first primetime:** the desk has been waiting to see Indianapolis under the lights
- **The ring line:** respected user, solid history, still hunting the one thing that travels

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Colts** | Quon | the Colts QB | **Jonathan Taylor** — 137 yards and 3 TD is the Week 4 stamp | **first primetime** — no excuses, no quiet Sunday |
| **Steelers** | Big Al | **Aaron Rodgers** | **Rodgers’ heater** — six TDs, then 314 more | **T.J. Watt / DK Metcalf** — the 87 DEF and the 2026 skill juice |

## Primetime Week 5 cheat sheet

| Window | Matchup | Coaches | Why it’s on the board |
| --- | --- | --- | --- |
| GOTW | Lions–Cardinals | Curry vs Dooders | 4–0 vs the trap. Respect is earned. |
| Division | Packers–Bears | Chance vs Jaylen Stowe | 3–1 vs 3–1. Test for Stowe. |
| Bounce-back | Buccaneers–Cowboys | Swagg vs Javon | CeeDee’s back. Somebody asserts. |
| Lights | Colts–Steelers | Quon vs Big Al | Quon’s first primetime. Big Al rolling. |

## Desk verdict

Week 4 told you **Chance can win a one-score primetime**, **Mease can drop 55**, and **Ji’Ayir Brown can score three times on defense**.

Week 5 asks the loud ones:

- Can Curry’s 4–0 Lions survive Dooders, or does a 78 overall club end the last unbeaten?
- Is Chance-Stowe a Packers statement, or the test that finally slows Jaylen Stowe down?
- Does Javon and CeeDee take the 2–2 scar out on Swagg — or does Tampa bounce back?
- Is this the night Quon puts the league on notice, or does Rodgers keep Big Al climbing?

Lock your picks. Submit the scores. Let the desk argue.

This is KML. This is primetime. Every game matters.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -70,
    week: 5,
  },
  {
    slug: "season-1-week-7-primetime",
    category: StoryCategory.GAME_OF_WEEK,
    title: "KML Primetime Week 7: two unbeatens, one Hot Seat, four games that change the table",
    eyebrow: "Games of the week · Primetime slate",
    summary:
      "Ren’s 6–0 Patriots meet Jaylen Stowe’s 5–1 Bears. Lefty’s other perfect record draws Javon on the Hot Seat. Curry hunts a get-right against Chance. Petey’s chalk gets Trent’s crown. Anybody can win. Legends are made in primetime.",
    body: `![KML Primetime Week 7](${STORY_ASSETS.week7Primetime})

**Anybody can win. But legends are made in primetime. KML.**

Two unbeatens are still standing. One coach is already on the Hot Seat. The last 4–0 is already dead. Week 7 is not a soft middle-of-the-schedule Sunday. It is the first week the table can split in half.

This is KML. This is primetime. Every game matters.

## What Week 6 stamped

The board closed 14–0. The Companion tape is in. Here is what actually traveled.

**Ren stayed perfect.** New England dropped **45–17** on the Jets. **Drake Maye** went **352 yards, four touchdowns, zero picks, 150.6 rating**. He is the season passing leader at **2,033 yards and 22 touchdowns**. Ren is **6–0**, **93 Elite** — the only Elite reputation on the board.

**Lefty stayed perfect with him.** Philadelphia beat Carolina **37–20**. **Saquon Barkley** ran for **201 and two scores**. The Eagles are **6–0**, **247–121**, and Lefty sits at **92 Stable** — one point from joining Ren in Elite.

**Jaylen Stowe survived the shootout.** Chicago 39–36 over Atlanta. **Bijan Robinson** went for **217 and two** and still lost. The Bears are **5–1** and they just earned the Game of the Week.

**Chance took primetime.** Green Bay 38–31 over Dallas. **Jordan Love** went **338 and four, no picks**. **Josh Jacobs** added 137. Javon is now **2–4** and **74 Hot Seat**.

**Petey put 40 on 0–6 Denver.** **Jaxon Smith-Njigba** went **7 catches, 191 yards, three touchdowns**. He is the season receiving leader at **824 yards and eight scores**. The Morning Show chalk is **4–2**.

The rest of the stamp: **Big Al** won a 52–49 war with Tampa. **Trent** beat **Oli** 38–34 — **Patrick Mahomes 365, four scores, no picks**. **Swipe** primetime-dunked Washington 35–16. **Raine** stayed 5–1. **Puddin** is 0–6 on an 86 overall roster.

And the Week 5 scar still sits on the table: **Dooders ended Curry’s 4–0**, 38–28. Detroit is **4–1** and **Pressured at 80**. Week 7 is the get-right.

## Game of the Week — Patriots vs Bears

**The last perfect records collide.**

**Ren’s Patriots (85 OVR)** are **6–0**, **209–103**, and the cleanest two-way start in the league. Maye just carved the Jets. **A.J. Brown** is still the contested-catch WR1 in New England. The reputation ledger already called it: **Elite**.

**Jaylen Stowe’s Bears (84 OVR)** are **5–1** and **Stable at 87**. Cover-athlete juice. Caleb Williams. A club that just outlasted 217 rushing yards and did not blink. The only 5–1 in the NFC just drew the only 6–0 in the AFC.

If Ren leaves Chicago 7–0, the dark-horse toys stop looking like a story and start looking like the favorite. If Stowe takes the 0, the Bears become the first club that can say they beat Elite.

## Why this game matters

- **6–0 vs 5–1:** somebody’s perfect-or-close start ends Sunday
- **Elite vs the climber:** Ren is the only 93 on the board. Stowe is the team that earned this stage
- **Maye vs the cover:** the season passing leader against a 5–1 defense that just survived Bijan

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Patriots** | Ren | **Drake Maye** | **Maye’s Week 6** — 352, 4 TD, 0 INT is the new baseline | **A.J. Brown** — 532 yards on the season, the 1-on-1 answer |
| **Bears** | Jaylen Stowe | **Caleb Williams** | **the 5–1 scar tissue** — they just won 39–36 and asked for this | **Jaylon Johnson** — erase Brown and make Maye work left |

## The other unbeaten — Eagles vs Cowboys

**The other perfect record meets the Hot Seat.**

**Lefty’s Eagles (87 OVR)** are **6–0** and the highest-rated club that is also undefeated. Saquon just went for 201. **Andrew Mukuba** has **five interceptions** on the season. Philadelphia’s point differential is a different sport: **247–121**.

**Javon’s Cowboys (85 OVR · 2–4)** have the toys and not the wins. **Dak Prescott** threw for **454** in the primetime loss to Chance. **George Pickens** had **9-185-1**. The tape says Dallas can score. The ledger says **74 Hot Seat**. One more ugly night against 6–0 and the seat gets hotter.

CeeDee was the Week 5 promise. Week 6 was another one-score loss. Week 7 is Lefty in the building.

## Why this game matters

- **6–0 vs 2–4:** the statement vs the survival game
- **Hot Seat math:** Javon is the only featured coach already under 75
- **Saquon vs a leaking start:** 823 yards and 11 scores on the season, and Lefty is one point from Elite

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Eagles** | Lefty | **Jalen Hurts** | **Saquon Barkley** — 201 and 2 is the Week 6 stamp | **Mukuba / Woolen** — five and four INT, the takeaway problem |
| **Cowboys** | Javon | **Dak Prescott** | **George Pickens** — 9-185 in a loss still moves the chains | **the Hot Seat** — 74 reputation, 2–4, no more quiet weeks |

## NFC North get-right — Lions vs Packers

**The 4–0 is already dead. Now they play each other.**

**Curry’s Lions (85 OVR)** are **4–1** after Arizona ended the last unbeaten in Week 5. **Jahmyr Gibbs** is still the season rushing leader at **852 yards and 11 touchdowns** — and he was on a bye in Week 6. Curry is **Pressured at 80**. This is the first game where Detroit has to answer a loss.

**Chance’s Packers (81 OVR)** are **4–2** and **Stable at 90**. He just took a primetime win over Javon. Love is **1,540 yards, 19 touchdowns, six picks** on the season. Chance has been telling the league he’s the best in it. A win over a Pressured 4–1 Lions club is how that talk becomes a division race.

NFC North. Same building. One of them leaves looking like the North is theirs.

## Why this game matters

- **Get-right vs stack:** Curry needs the answer after 4–0 died. Chance wants two primetime wins in a row
- **Gibbs vs Love:** the league’s rushing throne against a 4-TD primetime tape
- **Division math:** 4–1 vs 4–2 in Week 7 is January seeding with a coat of paint

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Lions** | Curry | **Jared Goff** | **Jahmyr Gibbs** — 852 and 11, the season’s best back, fresh off the bye | **the Pressured 80** — a second loss makes 4–0 look like a mirage |
| **Packers** | Chance | **Jordan Love** | **Love’s primetime** — 338, 4 TD, 0 INT is still warm | **Josh Jacobs** — 137 on Dallas, the downhill answer |

## Chalk vs the crown — Seahawks vs Chiefs

**Morning Show chalk. Crown check.**

**Petey’s Seahawks (84 OVR)** are **4–2** and **Stable at 89**. JSN just dropped 191 and three on Denver. **Sam Darnold** has **1,674 yards** on the season. The chalk does not need 91 overall. It needs this kind of Sunday.

**Trent’s Chiefs (85 OVR)** are **4–1** and coming off Mahomes at **365, four scores, no picks** against Oli. **Kenneth Walker** is second in the league in rushing at **835 yards**. Kansas City is the other 4–1 in the AFC, sitting behind only Ren and Raine.

If Petey takes the crown, “Seahawks in 5” gets loud again. If Mahomes and Walker stack another one, the chalk has to explain a 4–3.

## Why this game matters

- **4–2 vs 4–1:** contender window, not a style-points bye
- **JSN vs Walker:** season receiving throne vs the second-best back in the league
- **Reputation vs roster:** Petey’s name was on the first-champion board. Trent has the 4–1 and the crown

## Stars and X-factors

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Seahawks** | Petey | **Sam Darnold** | **Jaxon Smith-Njigba** — 7-191-3, and 824 on the season | **the chalk** — this is the game the Morning Show sold in Week 1 |
| **Chiefs** | Trent | **Patrick Mahomes** | **Mahomes’ 158.3** — 365, 4 TD, 0 INT against Oli | **Kenneth Walker** — 835 yards, the other half of 4–1 |

## Primetime Week 7 cheat sheet

| Window | Matchup | Coaches | Why it’s on the board |
| --- | --- | --- | --- |
| GOTW | Patriots–Bears | Ren vs Jaylen Stowe | 6–0 Elite vs 5–1. The last perfect records collide. |
| Lights | Eagles–Cowboys | Lefty vs Javon | The other 6–0 vs the only Hot Seat. |
| North | Lions–Packers | Curry vs Chance | Get-right after 4–0 died. Chance is rolling. |
| Crown | Seahawks–Chiefs | Petey vs Trent | Morning Show chalk vs 4–1 Kansas City. |

## The rest of the board is not quiet

| Matchup | Records | Coaches | The intangible |
| --- | --- | --- | --- |
| **Saints vs Steelers** | 4–2 vs 4–2 | Slap vs Big Al | Slap is Pressured at 81. Big Al just won 52–49. |
| **49ers at Falcons** | 4–2 vs 2–4 | Swipe vs Gotti | Swipe primetime-dunked Washington. Atlanta just lost 39–36. |
| **Ravens vs Bengals** | 5–1 vs 3–2 | Raine vs Dawson | The other 5–1. Dawson is Pressured at 77. |
| **Dolphins at Jets** | 3–2 vs 0–6 | Mease vs Jbone | Mease is 3–2 on a 76 overall. The rating still has not caught him. |
| **Rams at Raiders** | 4–2 vs 2–4 | Jordan Stowe vs Da Truth | Hollywood is Pressured at 81 with the highest remaining overall. |
| **Broncos at Cardinals** | 0–6 vs 3–3 | Puddin | 86 overall, zero wins. Arizona’s desk is vacant. |

Byes: **Chargers, Bills, Jaguars, Commanders**. Oli’s 269 points stay on the shelf for a week.

## Desk verdict

Week 6 told you **Ren and Lefty can stay perfect**, **Maye is the passing throne**, **Saquon can drop 200**, **JSN can drop 191**, and **Javon’s toys do not save a Hot Seat**.

Week 5 already told you **a 4–0 can die**. Curry is still wearing that one.

Week 7 asks the loud ones:

- Can Ren leave Chicago 7–0, or does Jaylen Stowe become the first coach to beat Elite?
- Does Lefty walk into Elite at 7–0, or does a Hot Seat Cowboys club finally cash a 454-yard tape?
- Is Curry’s get-right real against Chance, or does the North tilt to Green Bay?
- Does Petey’s chalk take the crown, or do Mahomes and Walker make 4–1 look like January?

Lock your picks. Submit the scores. Let the desk argue.

This is KML. This is primetime. Every game matters.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -80,
    week: 7,
  },
  {
    slug: "season-1-week-7-power-rankings",
    category: StoryCategory.LEAGUE,
    title: "KML Power Rankings Week 7: Lefty is the best team, Ren is the argument",
    eyebrow: "League desk · Power rankings",
    summary:
      "Fourteen Week 6 results, the reputation ledger, season leaders, and point differential. The desk’s first official top 10 of KML Reborn — and the five names that just missed.",
    body: `![KML Power Rankings Week 7](${STORY_ASSETS.week7PowerRankings})

Record. Tape. Reputation. The desk does not rank vibes.

Week 6 closed 14–0. Two clubs are still unbeaten. One coach is Elite. One is already on the Hot Seat. **Jahmyr Gibbs** still leads the league in rushing on a bye. **Drake Maye** just took the passing throne. **Jaxon Smith-Njigba** took the receiving one.

This is the first official top 10 of KML Reborn.

## How the desk built the board

Standings are the floor, not the ceiling. The stack is:

- **Record and point differential** — 6–0 with a +126 is not the same as 6–0 with a +106
- **Week 6 Companion tape** — Maye 352/4/0, Saquon 201, JSN 7-191-3, Love 338/4/0, Mahomes 365/4/0
- **Season leaders** — Maye 2,033/22, Gibbs 852/11, JSN 824/8, Mukuba and Ji’Ayir with five picks
- **Reputation** — Ren is the only **Elite (93)**. Lefty is **92 Stable**. Javon is **74 Hot Seat**. Puddin is **66**
- **Roster overalls** from the live export — Rams 88, Eagles 87, everybody else hunting

Last week’s 4–0 is already dead. That counts.

## 1. Lefty · Eagles — 6–0 · +126 · 87 OVR · 92 Stable

**The best team on the board.**

Philadelphia has the record, the differential, and the highest overall of the unbeatens. **247–121**. **Saquon Barkley** just ran for **201 and two**. **Andrew Mukuba** has **five interceptions** on the season. The last five results are WWWWW.

Lefty is one point from Elite. If the Eagles take care of a Hot Seat Cowboys club in primetime, the ledger will catch the tape.

The argument against #1 is a fair one: Ren has the Elite stamp and the stingiest defense. The desk still picked the +126.

## 2. Ren · Patriots — 6–0 · +106 · 85 OVR · 93 Elite

**The argument.**

New England allowed **103 points**. That is the best defense in the league. **Drake Maye** is the passing leader at **2,033 yards and 22 touchdowns** after a **352/4/0, 150.6** demolition of the Jets. Ren is the only coach the reputation board calls **Elite**.

If you rank the user over the spreadsheet, Ren is #1. If you rank the best team, Lefty stays there. Week 7 in Chicago is how this debate gets louder or dies.

## 3. Jaylen Stowe · Bears — 5–1 · +54 · 84 OVR · 87 Stable

**Survived 217. Earned the Game of the Week.**

Chicago just beat Atlanta 39–36 while **Bijan Robinson** went for **217 and two**. That is not a soft 5–1. The Bears are the only 5–1 in the NFC and they drew the only Elite 6–0.

Cover-athlete juice. Caleb Williams. A club that does not blink when the other sideline posts a 200-yard night. A win over Ren makes this a top-two conversation overnight.

## 4. Raine · Ravens — 5–1 · +41 · 85 OVR · 86 Stable

**The quiet 5–1.**

Baltimore does not have a primetime headline this week and still sits behind only two perfect records and the Bears. **Derrick Henry** went **121 and three** in the 35–28 win over Cleveland. Form is WLWWW.

The desk will not invent a problem that is not on the tape. 5–1 is 5–1. The slight dip under Chicago is differential and the Week 6 stage. Raine still has the other half of the 5–1 club in the AFC.

## 5. Curry · Lions — 4–1 · +65 · 85 OVR · 80 Pressured

**Gibbs throne. Still wearing the 4–0 scar.**

Detroit’s differential is better than every 5–1 and every 4–1 except the math that already includes the Arizona loss. **Jahmyr Gibbs** leads the league at **852 yards and 11 touchdowns** and he was on a bye. Curry is **Pressured at 80** because Dooders ended 4–0, 38–28, in Week 5.

That is why they are not third. The talent and the +65 keep them fifth. Week 7 against Chance is the get-right.

## 6. Trent · Chiefs — 4–1 · +27 · 85 OVR · 85 Stable

**Mahomes 365. Walker 835.**

Kansas City just beat **Oli** 38–34. **Patrick Mahomes** went **365, four scores, no picks, 158.3**. **Kenneth Walker** is second in the league in rushing at **835 yards**. The Chiefs are the other 4–1 in the AFC, sitting behind only Ren and Raine in the conference.

The differential is the softest of the top six. The crown and the Week 6 tape put them here anyway. Petey is next on the schedule.

## 7. Oli · Chargers — 4–2 · +71 · 82 OVR · 90 Stable

**269 points. The league’s loudest offense.**

Nobody has scored like Los Angeles. **Justin Herbert** is second in passing at **1,912 yards**. **Omarion Hampton** has **690 and nine**. The +71 is the best differential of any two-loss club.

They just lost to Trent and they are on a bye. The desk will not bury the most explosive offense in Madden 27 for one 38–34. If the Chargers are out of your top 10, you are ranking record and ignoring the scoreboard.

## 8. Petey · Seahawks — 4–2 · +53 · 84 OVR · 89 Stable

**JSN 191. Morning Show chalk.**

**Jaxon Smith-Njigba** went **7-191-3** on 0–6 Denver and leads the league at **824 yards and eight scores**. **Sam Darnold** has **1,674**. Petey was the first-champion chalk in Week 1. The 4–2 is not a collapse. It is a club that just dropped 40 and drew the crown.

A win over Trent and this ranking looks light by Tuesday.

## 9. Chance · Packers — 4–2 · +40 · 81 OVR · 90 Stable

**Primetime 338 and four.**

Chance has been telling the league he’s the best in it. Week 6 was the receipt: **38–31 over Javon**, **Jordan Love 338, four touchdowns, zero picks**, **Josh Jacobs 137**. Love is **1,540 yards, 19 scores, six picks** on the season. Chance sits at **90** — same neighborhood as Oli, better than most of the 4–2 cluster.

The 81 overall is the lowest roster in the top 10. The tape does not care. He plays Curry in primetime.

## 10. Big Al · Steelers — 4–2 · +37 · 84 OVR · 89 Stable

**Four straight. 52–49 war.**

The Morning Show sleeper opened 0–2. The last four are WWWW. Week 6 was a **52–49** win over Tampa. Pittsburgh has scored **221**. **Patrick Queen** has four interceptions on the season. Big Al is **89 Stable** and still hunting the ring the Week 5 desk mentioned.

They play Slap’s 4–2 Saints. A fifth straight and the 10-spot starts looking like a crime.

## First five out

| Rank | Club | Record | Coach | Why they’re here |
| --- | --- | --- | --- | --- |
| 11 | **Rams** | 4–2 · +53 · 88 OVR | Jordan Stowe | Best remaining roster. Pressured at 81. The Week 1 hole still follows Hollywood. |
| 12 | **49ers** | 4–2 · +42 | Swipe | Three straight including a 35–16 primetime dunk. Pressured at 81. |
| 13 | **Buccaneers** | 4–2 · +42 | Tha Don | Lost the 52–49 war. Still a real 4–2. |
| 14 | **Saints** | 4–2 · +10 | Slap | Four straight, tiniest differential of the 4–2s, Pressured at 81. |
| 15 | **Dolphins** | 3–2 · +36 · 76 OVR | Mease | Beating the rating every week. The 76 overall is still the floor. One more win and he’s in the 10. |

## The rest of the noise

**Vacant desks:** Arizona is 3–3 with a +48 after ending Curry’s 4–0. The Giants are 2–4. Neither gets a power-ranking vote without a coach.

**Hot Seat:** Javon is 2–4 with a +14 and a 454-yard tape that does not win. **Jbone** is 0–6. **Puddin** is 0–6 on an **86 overall** with a **66** reputation. That is the worst record-to-roster gap in the league.

**On the rise, not in yet:** Dawson’s Bengals are 3–2 with a −19. Quon is 2–3. The desk is not charitable with negative differentials this week.

## Desk verdict

The table says Eagles, Patriots, Bears, Ravens.

The tape says Maye, Saquon, Gibbs, JSN, Love, Mahomes.

The ledger says Ren is Elite, Lefty is a point away, Curry is Pressured, and Javon is already in the fire.

So the top 10 is not a standings paste. It is the desk’s board after six weeks of actual football.

Week 7 can wreck it in one night:

- If **Jaylen Stowe** beats Elite, the 3-spot is a lie by Monday
- If **Javon** cashes 454, Lefty’s #1 gets a scar
- If **Curry** gets right, fifth is too low
- If **Petey** takes the crown, eighth is a joke

Lock your argument. The board will move when the scores do.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -78,
    week: 7,
  },
  {
    slug: "season-1-week-8-swipe-simmons-trade",
    category: StoryCategory.FEATURE,
    title: "Deadline day: Swipe spends 20 points on Jeffery Simmons",
    eyebrow: "KML Morning Show · Trade deadline",
    summary:
      "Trade deadline hit and Swipe went all-in. San Francisco sent a 2026 1st (10), a 2027 2nd (7), and a 2026 4th (3) — 20 trade points — to Tennessee for DT Jeffery Simmons (10). Curry flipped a 2027 5th (2) to Washington for Daron Payne (7). Stephen A. already called the first one unnecessary.",
    body: `![KML Morning Show — Under fire Coach Swipe trades a haul for Jeff Simmons](${STORY_ASSETS.week8SwipeTrade})

The KML Morning Show did not ease into Week 8. **Trade deadline.** **Stephen A.** and **Shannon** opened on Coach **Swipe** with the banner already in all caps: **UNDER FIRE.**

San Francisco did not need more help. Then Swipe spent **20 trade points** on a **10-point** defensive tackle anyway.

## The headline deal — 49ers / Titans

The board printed the names. The ledger printed the math.

| 49ers send | Pts | Titans send | Pts |
| --- | --- | --- | --- |
| **2026 1st-round pick** | **10** | **DT Jeffery Simmons** | **10** |
| **2027 2nd-round pick** | **7** | | |
| **2026 4th-round pick** | **3** | | |
| **Total** | **20** | **Total** | **10** |

That is a first, a future second, and a fourth — **double the points** Tennessee put on the table — for one interior wrecker. Elite player. No doubt. The overpay is what set the desk on fire.

Deadline day is when contend clubs pay a tax. Swipe paid it in public.

## Stephen A.: that was unnecessary

The left side of the graphic did not hedge.

**“Swipe… that was unnecessary!”**

Swipe already had the 90-offense toys, **Christian McCaffrey**, and a defense that put **Ji’Ayir Brown** on a Week 4 honors stamp with three pick-sixes. The last power board still had San Francisco **4–2** and **Pressured at 81** after three straight, including a 35–16 primetime dunk on Washington.

A Pressured coach on a **bye week** does not have to empty the draft board at the deadline. Swipe emptied it anyway. Stephen A.’s point is the simple one: when you already have enough, a **20-for-10** is not adding a missing piece. It is spending the future to look busy.

## Shannon: he spent capital like Madden points

Shannon did not come to talk scheme.

**“Bro spent capital like it’s Madden points!”**

A 10-point first is not a dart throw. A 7-point future second is not pocket change. **Qon’s Titans** just cashed **20 points of draft capital** for a 10-point tackle San Francisco could have lived without. Rebuilders dream about that return. Contenders only pay it when they think a ring is on the table **this year**.

The Morning Show’s own copy said the quiet part: this move **might not move the needle come playoff time** — and it **definitely** sets Swipe up for major backlash if the year does not end with another ring.

## The other deadline deal — Lions / Commanders

Deadline was not a one-trade show.

| Lions send | Pts | Commanders send | Pts |
| --- | --- | --- | --- |
| **2027 5th-round pick** | **2** | **DT Daron Payne** (29, 84 OVR) | **7** |

**Curry** just bought a 29-year-old, 84-overall interior starter for a future fifth. **Jerm** just sold a veteran body for two points of draft dust.

That is the other half of deadline day: Detroit adding a win-now tackle on the cheap while Swipe paid a fortune for his. Same position. Very different receipts.

Payne is not Simmons. Simmons is the splash. Payne is the value. The desk can hold both thoughts.

## Championship window or championship gamble?

That’s the red line on the graphic. That’s still the only question that matters for San Francisco.

**Jeffery Simmons** in a 49ers uniform is a splash. Interior wrecker. Win-now identity on a helmet. The desk is not arguing whether Simmons can play. The desk is arguing whether **Swipe just told the league he is all-in at 20 points for 10** — and whether the ledger will remember the picks if January is quiet.

Great teams make smart moves. Legends make the right ones.

If Simmons wrecks pockets through December, this is a window. If San Francisco is still Pressured and the first-rounder is in Tennessee, this is the gamble Stephen A. already named.

Curry’s Payne grab does not get that speech. A 2-for-7 at the deadline is how you *add* to a window without burning the future.

## Around the league

The ticker did not wait for the trade argument to cool.

| Stamp | The desk’s line |
| --- | --- |
| **Patriots stay undefeated** | **Ren** has New England rolling. Elite. Still perfect. Still the problem. |
| **Dolphins surging** | **Mease** is proving you don’t need a loaded roster to win. The 76 overall is still lying. |
| **Chargers & Rams clash this week** | Respect is on the line in L.A. **Oli** vs **Jordan Stowe**. Only one coach walks away with it. |
| **Tank Bowl** | **Raiders vs Jets.** Somebody has to win sometime. |

Week 8 is not a quiet bye for the rest of the league. It is deadline day, Ren still unbeaten, Mease still beating the rating, Hollywood and the Chargers playing for respect, and a Tank Bowl that the ticker refused to dress up.

## Desk verdict

Trade deadline. Two interior tackles. Two very different GM tapes.

**Jeffery Simmons** is the player. The **2026 1st (10), 2027 2nd (7), and 2026 4th (3)** are the receipt — **20 points sent, 10 received.** **Qon** just got paid to rebuild. **Swipe** just told every GM in Discord the 49ers are not saving picks for next April.

**Daron Payne** is the other stamp. **Curry** sent a 2027 fifth (**2**) to **Jerm** for a 29-year-old 84 (**7**). Same deadline. Cleaner math.

The Morning Show already asked the loud one. Now the league votes with its mouth:

**Championship window — or championship gamble?**

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -90,
    week: 8,
  },
  {
    slug: "season-1-week-1-preview",
    category: StoryCategory.GAME_OF_WEEK,
    title: "Week 1 is loading: first impressions will travel fast",
    eyebrow: "Games of the week",
    summary:
      "Opening week sets the tone — early wins build belief, early slides start the hot-seat whispers.",
    body: `Week 1 does not decide a season, but it writes the first headline.

## What to watch

- Premium offenses: **Lions**, **Bills**, **Rams**, **49ers**, **Chiefs**
- Defense-first traps: **Broncos**, **Texans**, **Steelers**
- Rebuild openers: **Dolphins**, **Titans**, **Jets**, **Browns**

Submit your scores promptly. The story only feels alive when the results are official.`,
    isFeatured: false,
    sortOrder: 10,
  },
  {
    slug: "season-1-week-1-players-of-the-week",
    category: StoryCategory.PLAYER_OF_WEEK,
    title: "Week 1 Players of the Week: CMC ate, Hicks hunted",
    eyebrow: "Honors desk · Week 1",
    summary:
      "Christian McCaffrey dropped 290 scrimmage yards and three scores on the Rams. Jaden Hicks turned three interceptions and a pick-six into Defensive Player of the Week. Week 1 set the standard.",
    body: `![KML Week 1 Players of the Week](${STORY_ASSETS.week1Potw})

**Week 1 set the standard. Who’s next?**

The honors desk is open. The first stamps of Season 1 are not close.

**Christian McCaffrey** took over a primetime night against the league’s best roster and walked out with Offensive Player of the Week. **Jaden Hicks** turned Kansas City’s defense into points and walked out with Defensive Player of the Week.

Everybody else on the board had a heater. Those two owned the week.

## Offensive Player of the Week — Christian McCaffrey

**49ers · RB · Swipe**

| Rush | Rec | Totals |
| --- | --- | --- |
| 14 carries, **187 yards**, 2 TD | 4 catches, **103 yards**, 1 TD | **290 scrimmage yards**, **3 TD** |

That is not a good opener. That is a statement.

San Francisco got the favored division-rival **Rams** on Thursday night — **Jordan Stowe’s 91 overall** throne, Hollywood’s toys, the best team in Madden 27. McCaffrey treated it like a track meet. One hundred eighty-seven on the ground. A hundred more through the air. Three scores. A dominating win that already showed up on the coaching-grade board.

The Morning Show called him that dude. The graphic made it official.

If Week 2 TNF against Miami is about roster talent versus stick skill, CMC just told the league what the talent looks like when it gets rolling.

## Defensive Player of the Week — Jaden Hicks

**Chiefs · SS · Trent · #21**

| Tackles | Takeaways | Splash |
| --- | --- | --- |
| **12** | **3 INT** | **1 pick-six** |

Game changer in all phases. Turned defense into points.

**Trent’s Chiefs** opened the season on the road in Denver and Hicks made the tape personal. Twelve tackles. Three interceptions. A pick-six. That is not complementary football. That is a safety hunting, and a **Defensive Player of the Week** stamp that writes itself.

The rest of the league can talk 90 overall offenses. Kansas City just showed you what happens when the other side of the ball starts scoring too.

## Other notable performances

The board under the two winners was stacked. Week 1 did not hide.

### Offense

| Player | Team | Line | Why he’s on the board |
| --- | --- | --- | --- |
| **Patrick Mahomes** | Chiefs | 17/27, 223 yards, 2 TD | Dominating win in Denver to open the season |
| **Kenneth Walker III** | Chiefs | 21 car, 236 yards, 2 TD | Led the charge in KC’s statement win on the road |
| **David Njoku** | Chargers | 7 rec, 188 yards, 1 TD | Historic day with the ball |
| **Michael Pittman Jr.** | Steelers | 10 rec, 158 yards, 1 TD | Reliable target all day in the win |
| **Evan Engram** | Broncos | 7 rec, 137 yards | Steady, consistent playmaker |
| **Kenyon Sadiq (R)** | Jets | 6 rec, 129 yards, 1 TD | Strong rookie debut — impact from snap one |
| **Jahmyr Gibbs** | Lions | 20 car, 198 yards, 1 TD | Explosive day on the ground in a 30-piece |
| **Bijan Robinson** | Falcons | 19 car, 205 yards, 1 TD | Elite from start to finish |
| **Theo Johnson** | Giants | 7 rec, 133 yards, 1 TD | Biz’s new-look Giants already have a mismatch |
| **George Pickens** | Cowboys | 8 rec, 188 yards, 1 TD | Big-time threat making big-time plays |
| **Justin Herbert** | Chargers | 15/21, 298 yards, 5 TD, 3 INT | Led a comeback win after going down two scores |
| **Drake Maye** | Patriots | 24/40, 342 yards, 2 TD, 2 INT | Game-winning drive with 30 seconds left in the Super Bowl rematch |

### Defense

| Player | Team | Line | Why he’s on the board |
| --- | --- | --- | --- |
| **Jaden Hicks** | Chiefs | 12 tackles, 3 INT, 1 pick-six | The DPOW tape. Game changer in all phases |
| **DeMarcus Lawrence** | Seahawks | 2 sacks, 1 INT | Disruptive all day long |
| **Chop Robinson** | Dolphins | 5 TFL, 1 sack | Relentless in the backfield — Mease’s 74 OVR still has teeth |

Herbert throwing five touchdowns while trailing by two is how you steal a week. Maye walking a Super Bowl rematch off with 30 seconds left is how you get Stephen A. to call you a closer. Gibbs going for almost 200 in a Lions demolition is how a win-now club starts writing January in Week 1.

None of them beat 290 and three scores. None of them beat three picks and a pick-six.

## Desk verdict

**Swipe and CMC** own the first Offensive Player of the Week of KML Reborn. The Rams were supposed to be the mountain. McCaffrey ran through it.

**Trent and Hicks** own the first Defensive Player of the Week. Twelve tackles, three interceptions, a score. That is the kind of tape that makes a 90-offense club look complete.

The rest of the board is the warning: **Maye, Herbert, Gibbs, Bijan, Walker, Chop, Lawrence** all left fingerprints on Week 1. The standard is already high.

Week 2 doesn’t get to ease in. The honors desk will be watching.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -22,
    week: 1,
  },
  {
    slug: "season-1-week-2-players-of-the-week",
    category: StoryCategory.PLAYER_OF_WEEK,
    title: "Week 2 Players of the Week: Hampton the animal, Love the surgeon, four scores in Philly",
    eyebrow: "Honors desk · Week 2",
    summary:
      "Omarion Hampton ran for 208 and three scores at 10.9 a pop. Jordan Love went 19-of-24 for 305 and four touchdowns. Riq Woolen and Quinyon Mitchell each returned two picks for six. Week 2 raised the standard.",
    body: `![KML Week 2 Players of the Week](${STORY_ASSETS.week2Potw})

**Elite performances. Game changers. KML legends.**

Week 1 belonged to CMC and Hicks. Week 2 did not copy that script. It raised it.

**Omarion Hampton** turned **Oli’s Chargers** into a track meet in a **66–41** demolition of Las Vegas and walked out with AFC Offensive Player of the Week. **Jordan Love** carved the Jets for **Chance’s 2–0 Packers** and took NFC Offensive Player of the Week. Then **Lefty’s Eagles** put two corners on the same stamp: **Riq Woolen** and **Quinyon Mitchell** each scored twice off interceptions.

Everybody else on the board had a heater. Those four owned the week.

## AFC Offensive Player of the Week — Omarion Hampton

**Chargers · RB · Oli · #28**

| Carries | Yards | TDs | YPC |
| --- | --- | --- | --- |
| **19** | **208** | **3** | **10.9** |

10.9 yards per carry. An absolute animal.

That is not a complementary run game. That is a back ending drives by himself. Hampton did not need 30 touches. He needed 19, and he turned them into 208 and three scores in a 66–41 win over the Raiders.

Oli’s Chargers already had the Herbert juice. Now they have a Week 2 stamp that says the ground game can steal a Sunday on its own — and they take a 2–0 record into Monday night primetime.

## NFC Offensive Player of the Week — Jordan Love

**Packers · QB · Chance · #10**

| Comp/Att | Pass yards | TDs | Rating |
| --- | --- | --- | --- |
| **19/24** | **305** | **4** | **158.3** |

Perfect precision. Perfect performance.

Chance has been telling the league he’s the best in it. Love just handed him the tape. Nineteen of twenty-four. Four touchdowns. A 158.3 passer rating against the Jets in a game Green Bay never let get close.

That is not volume. That is a surgeon. If Week 3 against Gotti is the “prove it” game, Love already put the receipt on the honors desk.

## Co-Defensive Players of the Week — Riq Woolen & Quinyon Mitchell

**Eagles · CB · Lefty**

| Player | INTs | Pick-sixes |
| --- | --- | --- |
| **Riq Woolen · #3** | **2** | **2** |
| **Quinyon Mitchell · #27** | **2** | **2** |

Two picks. Two touchdowns. Twice.

Lefty’s 87 defense did not just take the ball away from Tennessee. It scored with it. Four interceptions returned for touchdowns between two corners in the same game — Woolen unstoppable, Mitchell clutch twice. Philadelphia dropped **61** on the Titans. The secondary wrote the headline.

This is not last year’s Eagles tape, and it is not an A.J. Brown story. The August 2026 club is Hurts, Saquon, DeVonta Smith — and a pair of corners who just became the first co-Defensive Players of the Week of KML Reborn.

## Other Week 2 standouts

The board under the winners was stacked. The graphic did not hide.

### Offense

| Player | Team | Line | Why he’s on the board |
| --- | --- | --- | --- |
| **Chuba Hubbard** | Panthers · Nick | 13 car, **202 yards**, 2 TD | **15.5 YPC** in the win over Atlanta |
| **Justin Herbert** | Chargers · Oli | **361 yards**, 3 TD, 132.7 rating | Elite arm talent in the same 66–41 Raiders demolition |
| **James Cook** | Bills · Pryor | 24 car, **137 yards**, 3 TD | Power, speed, touchdowns in a 32–29 win over Detroit |
| **Brian Thomas Jr.** | Jaguars · Dimez | 9 rec, **190 yards**, 1 TD | Unguardable. The one that kept Jacksonville on the ticker |
| **Patrick Mahomes** | Chiefs · Trent | 221 yards, 2 TD, 121.8 rating | Mahomes magic in a 31–28 hold over Indianapolis |

### Defense

| Player | Team | Line | Why he’s on the board |
| --- | --- | --- | --- |
| **Kobie Turner** | Rams · Jordan Stowe | **3.5 sacks**, 5 TFL | Wrecking backfields in the 44–7 Giants demolition |
| **Kyler Gordon** | Bears · Jaylen Stowe | 6 tackles, 3 TFL, **2 sacks**, 1 INT | All-around dominance in Chicago’s 41–13 win |
| **Jaelan Phillips** | Panthers · Nick | **2 sacks**, 1 INT | Making plays everywhere next to Hubbard’s heater |

Hubbard going 202 on 13 carries is how a new Carolina era gets loud. Cook stacking three scores in a one-score Lions game is how Pryor stays 2–0. Herbert throwing for 361 next to a 208-yard back is how Oli’s offense stops being a surprise. Turner’s 3.5 sacks are how Hollywood answers a bad Week 1. Gordon’s sack-and-pick tape is how Jaylen Stowe’s Bears stay perfect heading into Thursday night.

None of them beat 10.9 yards a carry. None of them beat a 158.3 rating. None of them beat four pick-sixes in one secondary.

## Desk verdict

**Oli and Hampton** own the AFC offensive stamp. Two hundred eight yards. Three scores. 10.9 a pop. The Chargers are not sneaking up on anybody.

**Chance and Love** own the NFC offensive stamp. Nineteen of twenty-four. Four touchdowns. The Packers’ 2–0 start now has a signature quarterback night.

**Lefty, Woolen, and Mitchell** own the defensive stamp together. Two corners. Four pick-sixes. A 61-point night. That is how an 88 overall club reminds the league the other side of the ball can end a game by itself.

The rest of the board is the warning: **Hubbard, Herbert, Cook, Thomas, Mahomes, Turner, Gordon, Phillips** all left fingerprints on Week 2. The standard is already higher than Week 1.

Week 2 is official. All sixteen are in the book. Week 3 primetime is already on the board.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -36,
    week: 2,
  },
  {
    slug: "season-1-week-3-players-of-the-week",
    category: StoryCategory.PLAYER_OF_WEEK,
    title: "Week 3 Players of the Week: Rodgers dropped six, Sneed erased the night",
    eyebrow: "Honors desk · Week 3",
    summary:
      "Aaron Rodgers threw for 389 yards and six touchdowns in Pittsburgh’s first win. L’Jarius Sneed picked off three passes and allowed zero scores. Week 3 belonged to a 5x champ’s quarterback and Trent’s cover corner.",
    body: `![KML Week 3 Players of the Week](${STORY_ASSETS.week3Potw})

**Compete. Grind. Reign.**

Week 2 belonged to Hampton, Love, and two Eagles corners. Week 3 did not copy that script. It handed the stamps to a legend and a shutdown corner.

**Aaron Rodgers** turned **Big Al’s Steelers** into a track meet in Cincinnati — 389 yards, **six touchdowns**, and Pittsburgh’s first win of Season 1. **L’Jarius Sneed** turned **Trent’s Chiefs** into a no-fly zone against Miami: **three interceptions, zero touchdowns allowed**.

Everybody else on the board had a heater. Those two owned the week.

## Offensive Player of the Week — Aaron Rodgers

**Steelers · QB · Big Al · #8**

| Pass yards | TDs | INTs | Rating |
| --- | --- | --- | --- |
| **389** | **6** | 2 | **108.2** |

That is not a get-right game. That is a statement.

Big Al opened 0–2 for the first time in a KML career. Then Rodgers dropped six on the Bengals in a **48–25** win and the 5x champ got off the schneid. Three hundred eighty-nine yards. Six scores. A 108.2 rating. The honors desk did not need a second look.

The league can talk 90-offense clubs all it wants. Pittsburgh just showed you what happens when the quarterback who has done this before gets hot.

## Defensive Player of the Week — L’Jarius Sneed

**Chiefs · CB · Trent · #38**

| INTs | TDs allowed | The tape |
| --- | --- | --- |
| **3** | **0** | Erased the night |

Three picks. Zero scores allowed. Game over.

**Trent’s Chiefs** are **3–0**. They just dropped **30–6** on Mease’s Dolphins, and Sneed was the reason Miami never found the end zone. Three interceptions. A shutdown night. That is not complementary football. That is a corner hunting, and a Defensive Player of the Week stamp that writes itself.

Week 1 it was Hicks. Week 3 it is Sneed. Kansas City’s secondary is collecting honors.

## Other Week 3 standouts

The board under the two winners was stacked. The graphic did not hide.

### Offense

| Player | Team | Line | Why he’s on the board |
| --- | --- | --- | --- |
| **Jeremiyah Love** | Cardinals · Dooders | 16 car, **179 yards**, 3 TD, 11.2 YPC | Four broken tackles. Zero fumbles. A 78 OVR club’s heater |
| **Bucky Irving** | Buccaneers · Dre | 16 car, **162 yards**, 3 TD, 10.1 YPC | Tampa stays 3–0 on the ground |
| **Puka Nacua** | Rams · Jordan Stowe | 9 rec, **123 yards**, **3 TD** | Hollywood’s answer after Week 1 — three scores in the 35–7 Broncos demolition |
| **Justin Jefferson** | Vikings · Fitz | 11 rec, **152 yards**, 2 TD | Unguardable even in a 0–3 start |
| **DeVonta Smith** | Eagles · Lefty | 4 rec, **142 yards**, 2 TD, **35.5 YPR** | The WR1 now that A.J. Brown is in New England. 3–0 stamp over the Bears |
| **Matthew Stafford** | Rams · Jordan Stowe | **242 yards**, **4 TD**, 0 INT, 137.2 rating | Back-to-back dominant wins after the Week 1 primetime loss |

### Defense

| Player | Team | Line | Why he’s on the board |
| --- | --- | --- | --- |
| **Trevin Wallace** | Panthers · Nick | **2 INT**, **1 pick-six**, 3 tackles | Scoring on defense. Carolina’s splash play of the week |
| **Devonte Wyatt** | Packers · Chance | **3 sacks**, 3 TFL | Wrecking the pocket next to Love’s heater |
| **Walter Nolen III** | Cardinals · Dooders | **3 sacks**, 2 TFL, 4 tackles | Interior havoc on a 78 OVR club that still made the honors board |

Love going 179 on 16 carries is how Dooders stays dangerous on a bubble roster. Irving stacking three scores is how Dre stays perfect. Puka and Stafford turning Denver into a 35–7 tape is how the 91 overall mountain answers a bad opener. Smith’s 35.5 yards per catch is how Lefty’s 3–0 got its skill-position stamp. Jefferson doing this on 0–3 is a warning.

None of them beat six touchdowns. None of them beat three picks and a shutout.

## Desk verdict

**Big Al and Rodgers** own the offensive stamp. Three hundred eighty-nine yards. Six scores. Pittsburgh’s first win. That is how a 5x champ gets off 0–2.

**Trent and Sneed** own the defensive stamp. Three interceptions. Zero touchdowns allowed. The Chiefs are 3–0 and the secondary is writing the season.

The rest of the board is the warning: **Love, Irving, Puka, Jefferson, Smith, Stafford, Wallace, Wyatt, Nolen** all left fingerprints on Week 3. The standard is already higher than Week 2.

Week 4 primetime is loaded. The honors desk will be watching.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -46,
    week: 3,
  },
  {
    slug: "season-1-week-4-players-of-the-week",
    category: StoryCategory.PLAYER_OF_WEEK,
    title: "Week 4 Players of the Week: Bryce dropped six, Ji’Ayir scored three",
    eyebrow: "Honors desk · Week 4",
    summary:
      "Bryce Young threw for 412 yards and six touchdowns in a 56–44 shootout. Ji’Ayir Brown had four interceptions and three pick-sixes in San Francisco’s demolition of Denver. Week 4 belonged to a Panthers quarterback and a 49ers safety.",
    body: `![KML Week 4 Players of the Week](${STORY_ASSETS.week4Potw})

**A dominant night. The most impactful performance of the week.**

Week 3 belonged to Rodgers and Sneed. Week 4 handed the stamps to a quarterback who lost and a safety who scored three times.

**Bryce Young** put up **412 yards and six touchdowns** for **Nick’s Panthers** in a 56–44 war with Detroit. **Ji’Ayir Brown** turned **Swipe’s 49ers** into a scoring defense: **four interceptions, three pick-sixes**, a sack, and a forced fumble in a 45–14 win over Denver.

Everybody else on the board had a heater. Those two owned the week.

## Offensive Player of the Week — Bryce Young

**Panthers · QB · Nick · #9**

| Pass yards | TDs | INTs | Comp |
| --- | --- | --- | --- |
| **412** | **6** | 2 | **59%** |

A dominant performance. The top offensive effort of Week 4. And it came in a loss.

Detroit dropped 56. Carolina dropped 44. Young still walked out with Offensive Player of the Week because 412 and six scores does not care about the final. **Tet McMillan** went with him — 158 yards and three touchdowns. Nick’s club did not go quietly against the last unbeaten.

That is how a 2–2 team stays in the conversation. The quarterback just out-dueled a 4–0 offense on volume and still wants the win back.

## Defensive Player of the Week — Ji’Ayir Brown

**49ers · S · Swipe · #27**

| INTs | Pick-sixes | Splash |
| --- | --- | --- |
| **4** | **3** | 1 sack, 1 FF |

The most impactful performance of the week. Three defensive touchdowns.

Puddin’s Broncos are 0–4. Brown made sure of it. Four interceptions. Three of them went to the house. A sack. A forced fumble. **Ricky Pearsall** added 112 and two scores on offense, but the graphic did not need a second look on defense.

Week 1 it was Hicks. Week 3 it was Sneed. Week 4 it is Ji’Ayir Brown scoring from the secondary until Denver ran out of footballs.

## Other Week 4 standouts

The board under the two winners was stacked. The graphic did not hide.

### Offense

| Player | Team | Line | Why he’s on the board |
| --- | --- | --- | --- |
| **Jahmyr Gibbs** | Lions · Curry | 16/163/2 rush, 3/53/2 rec | Four total TDs in the 56–44 win that kept Detroit 4–0 |
| **De’Von Achane** | Dolphins · Mease | 18 car, **201 yards**, 3 TD | Mease dropped 55–7 on Minnesota. Still Malik Willis, still no Tyreek |
| **Ja’Marr Chase** | Bengals · Dawson | 7 rec, **233 yards**, 2 TD | Unguardable in a 35–27 win over Jacksonville |
| **Jaxon Smith-Njigba** | Seahawks · Petey | 8 rec, **176 yards**, 1 TD | Petey’s 40–34 primetime win over Oli |
| **Fernando Mendoza** | Raiders · Da Truth | **307 yards**, 4 TD, **90%** | Vegas took down Kansas City 45–27 |
| **Matthew Golden** | Packers · Chance | 5 rec, **133 yards**, 3 TD | The difference in Chance’s 31–30 TNF win over Swagg |
| **Malik Willis** | Dolphins · Mease | **223 yards**, 4 TD | The other half of Miami’s 55-point night |
| **Derrick Henry** | Ravens | 11 car, **124 yards**, 1 TD | Still the King in a 49–43 road win |
| **Zay Flowers** | Ravens | 5 rec, **144 yards**, 3 TD | Three scores next to Henry |
| **Aaron Rodgers** | Steelers · Big Al | **314 yards**, 3 TD | The follow-up to six TDs. Pittsburgh is 2–2 |
| **Michael Pittman Jr.** | Steelers · Big Al | 5 rec, **122 yards** | The volume target in the same win |
| **Jonathan Taylor** | Colts · Quon | 17 car, **137 yards**, 3 TD | Indianapolis got the Week 4 win |
| **Joe Burrow** | Bengals · Dawson | **266 yards**, 4 TD | Stacked with Chase’s 233 |
| **Tet McMillan** | Panthers · Nick | 6 rec, **158 yards**, 3 TD | Young’s answer in the 44-point loss |
| **Ricky Pearsall** | 49ers · Swipe | 3 rec, **112 yards**, 2 TD | The offensive juice next to Brown’s three scores |

### Defense

| Player | Team | Line | Why he’s on the board |
| --- | --- | --- | --- |
| **Ji’Ayir Brown** | 49ers · Swipe | 4 INT, **3 pick-sixes**, 1 sack, 1 FF | The DPOW tape. Three defensive touchdowns |
| **Jordyn Brooks** | Dolphins · Mease | 2 TFL, 1 sack, 1 INT, 7 tackles | Splash on a 74 OVR club that just dropped 55 |
| **Jonathan Allen** | Bengals · Dawson | 3 TFL, **2 sacks** | Interior havoc next to Burrow and Chase |

Gibbs going for four scores is how 4–0 stays 4–0. Achane and Willis stacking 201 and four passing TDs is how Mease keeps beating the rating. Chase’s 233 is a WR1 night. Mendoza at 90 percent in a Chiefs upset is how Da Truth stays dangerous. Golden’s three scores is how Chance won TNF by one.

None of them beat 412 and six. None of them beat three pick-sixes.

## Desk verdict

**Nick and Bryce Young** own the offensive stamp. Four hundred twelve yards. Six scores. In a loss. That is how loud a 2–2 club can still get.

**Swipe and Ji’Ayir Brown** own the defensive stamp. Four interceptions. Three touchdowns. Denver never recovered. That is the most impactful tape of Week 4.

The rest of the board is the warning: **Gibbs, Achane, Chase, JSN, Mendoza, Golden, Willis, Henry, Flowers, Rodgers, Taylor, Burrow** all left fingerprints. The standard is already higher than Week 3.

Week 5 primetime is four massive matchups. The honors desk will be watching.

Compete. Conquer. Be legendary.`,
    isFeatured: false,
    sortOrder: -56,
    week: 4,
  },
  {
    slug: "season-1-coaching-storylines",
    category: StoryCategory.COACHING,
    title: "New jobs, new pressure: coaching storylines after the draft",
    eyebrow: "Coaching carousel",
    summary:
      "Everyone starts with a contract and a reputation. Not everyone will keep both — especially with that ratings gap.",
    body: `The draft handed out opportunity. The Madden 27 ratings board handed out expectations.

## The new reality

- Coaches on 87+ clubs will be judged by January
- Coaches on the bottom tier will be judged by progress
- Reputation, contracts, and job security are now part of the product

Stay locked into the Coach Hub for hot seats, carousel windows, and the long game of franchise identity.`,
    isFeatured: false,
    sortOrder: 30,
  },
  {
    slug: "season-1-team-draft-grades",
    category: StoryCategory.DRAFT,
    title: "Season 1 team draft grades: every coach scored",
    eyebrow: "Draft desk · Grades",
    summary:
      "From Jordan Stowe’s A+ Rams steal to Mease’s Dolphins rebuild lab — we graded all 32 picks on overalls, draft slot, stars, contend power, and rebuild tools.",
    body: buildDraftGradesArticleBody(),
    isFeatured: false,
    sortOrder: 5,
  },
] as const;

/** Ensures the welcoming front-page stories exist and stay current. */
export async function ensureDefaultLeagueStories(seasonId?: string) {
  for (const story of DEFAULT_STORIES) {
    await prisma.leagueStory.upsert({
      where: { slug: story.slug },
      update: {
        title: story.title,
        eyebrow: story.eyebrow,
        summary: story.summary,
        body: story.body,
        category: story.category,
        isFeatured: story.isFeatured,
        sortOrder: story.sortOrder,
        isPublished: true,
        ...("week" in story ? { week: story.week } : {}),
        ...(seasonId ? { seasonId } : {}),
      },
      create: {
        ...story,
        seasonId,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }

  const featuredSlug = DEFAULT_STORIES.find((story) => story.isFeatured)?.slug;
  if (featuredSlug) {
    await prisma.leagueStory.updateMany({
      where: { isFeatured: true, NOT: { slug: featuredSlug } },
      data: { isFeatured: false },
    });
  }

  await prisma.leagueStory.updateMany({
    where: { slug: "season-1-players-of-the-week-placeholder" },
    data: { isPublished: false, isFeatured: false },
  });

  await safeEnsureDefaultStoryPolls();
}

export async function getPublishedStories(options?: {
  seasonId?: string;
  take?: number;
  category?: StoryCategory;
}) {
  return prisma.leagueStory.findMany({
    where: {
      isPublished: true,
      ...(options?.category ? { category: options.category } : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { sortOrder: "asc" }],
    take: options?.take ?? 50,
    include: { author: { select: { name: true } } },
  });
}

export async function getStoryBySlug(slug: string) {
  return prisma.leagueStory.findFirst({
    where: { slug, isPublished: true },
    include: { author: { select: { name: true } } },
  });
}

export async function getFeaturedStory() {
  return prisma.leagueStory.findFirst({
    where: { isPublished: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    include: { author: { select: { name: true } } },
  });
}
