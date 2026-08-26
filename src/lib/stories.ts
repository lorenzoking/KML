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
} as const;

const DEFAULT_STORIES = [
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
    isFeatured: true,
    sortOrder: -70,
    week: 5,
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
