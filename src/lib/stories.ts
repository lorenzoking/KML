import { StoryCategory } from "@prisma/client";
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

const DEFAULT_STORIES = [
  {
    slug: "season-1-first-champion-speculation",
    category: StoryCategory.FEATURE,
    title: "Who’s going to be the first champion of KML Reborn?",
    eyebrow: "KML Morning Show · Madden 27",
    summary:
      "The panel is hot, the board is locked, and the first Super Bowl of the Madden 27 cycle is already being argued. Here’s the desk’s favorite, sleeper, and the names that actually move games.",
    body: `![KML Morning Show — Who’s going to be the first champion of KML Reborn?](/stories/kml-morning-show-first-champion.png)

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
    body: `![KML Morning Show — Rumors heating up around the league](/stories/trade-rumors-kml.png)

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
    body: `![KML Morning Show — Week 2](/stories/kml-morning-show-wk2.png)

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
    body: `![KML Primetime Week 1](/stories/wk1-gotw.png)

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
    body: `![KML Primetime Week 2](/stories/wk2-primetimeparlay.png)

**Big stage. Big names. Big moments. This is KML Primetime.**

Week 1 put the theories on tape. Week 2 puts three windows back under the lights with meaner stakes: a Thursday opener about roster talent versus stick skill, a Sunday-night heavyweight between two of KML’s best, and a Monday-night job-security special the reputation system was built for.

The board is locked. The desk is already arguing.

## Thursday Night Football — 49ers vs Dolphins

**The champ vs. the standard.**

This is the perfect Thursday opener.

**Swipe’s 49ers (85 OVR · 90 OFF)** are coming off a dominant primetime win over the Rams, with **Christian McCaffrey** putting up **290 scrimmage yards and three touchdowns** and walking away with Offensive Player of the Week. Now they get a less-talented Dolphins roster — **Mease’s Miami (74 OVR)**, the lowest-rated team in Madden 27.

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
| **Dolphins** | Mease | **Tua Tagovailoa** | **Tyreek Hill** — take the top off and make 74 OVR look fast | **the user gap** — Mease’s sticks are the entire Miami thesis |

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
| **Steelers** | Big Al | **the Pittsburgh offense** | **T.J. Watt** — the 87 DEF identity in one jersey | **takeaways** — field position is how a last-pick defense was supposed to win |

Can Maye and A.J. Brown keep stacking signature drives? Or does Watt and the front seven get the tape Big Al needed after Atlanta?

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
    isFeatured: true,
    sortOrder: -40,
    week: 2,
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
    slug: "season-1-players-of-the-week-placeholder",
    category: StoryCategory.PLAYER_OF_WEEK,
    title: "Players of the Week desk opens with Season 1",
    eyebrow: "Honors desk",
    summary:
      "Each week we’ll crown the standouts who changed games — and give the league a reason to argue (in a good way).",
    body: `The Players of the Week board is live.

## How it works

- Commissioners spotlight offensive, defensive, and coaching standouts
- Nominations can come from Discord after your game
- Great leagues remember great weeks — this is where those names live`,
    isFeatured: false,
    sortOrder: 20,
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
