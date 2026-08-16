import { StoryCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildDraftGradesArticleBody } from "@/lib/draft-grades";

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

This is the kickoff. Season opener. Super Bowl rematch.

On one sideline: **Petey** and the **Seahawks (84 OVR)** — the Morning Show’s chalk pick to hoist the first Lombardi. On the other: **Ren** and the **Patriots (86 OVR · 87 OFF · 85 DEF)** — one of KML’s known best users sitting on a top-six roster.

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
| **Patriots** | Ren | **Drake Maye** | **Stefon Diggs** — the timing route artist who eats zone | **Christian Gonzalez** — erase a WR1 and force Petey left |

Can Petey keep Maye off schedule and win with complementary football? Or does Diggs and Maye turn the Super Bowl rematch into New England’s first statement of the Madden 27 cycle?

## Monday Night Football — Chiefs vs Broncos

**Trent’s Chiefs (84 OVR · 90 OFF)** against **Puddin’s Broncos (86 OVR · 87 DEF)**.

This is explosiveness versus identity. Kansas City still grades as a 90 overall offense — perennial contending DNA. Denver took one of the cleanest surprise boards in the draft: elite defense, improved attack, and a coach with a clear stop-and-steal plan.

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Chiefs** | Trent | **Patrick Mahomes** | **Rashee Rice / Xavier Worthy** — the vertical answers after the pocket breaks | **Chris Jones** — interior wrecking ball that creates free rushers |
| **Broncos** | Puddin | **Bo Nix** | **Patrick Surtain II** — erase a WR1 and force Mahomes left | **Courtland Sutton** — contested-catch outlet when Denver needs a drive to breathe |

If Mahomes gets clean looks, MNF becomes a track meet. If Surtain and the 87 DEF front force checkdowns, Puddin’s Broncos can win ugly — exactly the path the Morning Show respects.

## Thursday Night Football — Rams vs 49ers

**Jordan Stowe’s Rams (91 OVR)** — the best roster in Madden 27 — against **Swipe’s 49ers (85 OVR · 90 OFF)**, the late-draft steal with a premium attack and the coaching storyline already buzzing from the Bosa trade desk.

NFC West heat. Primetime lights. Immediate tape for the throne and the challenger next door.

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Rams** | Jordan Stowe | **Matthew Stafford** | **Puka Nacua** — the cover-2 breaker that turns 93 OVR offense into points | **Jared Verse** — edge pressure that ruins play-action timing |
| **49ers** | Swipe | **Brock Purdy** | **George Kittle** — the mismatch that beats zone and sells play-action | **Fred Warner** — the green-dot problem that erases shallow crossers |

San Francisco’s 90 offense can hang with anyone in a shootout. The question is whether Stowe’s 88 defense — and Hollywood’s star skill — make TNF a statement for the league’s best roster or a trap game against NFC West juice.

## Sunday Night Football — Cowboys vs Giants

**Jsmood’s Cowboys (83 OVR · 87 OFF)** versus **Biz’s Giants (79 OVR)**.

User-wise, this is pressure versus proof. Dallas still brings offensive firepower and star skill. New York took a mid/low overall early in the draft — Biz has to outcoach the rating from Week 1 or the “bar was too high” narrative starts immediately.

| Side | Coach | QB to watch | Primary X-factor | Secondary juice |
| --- | --- | --- | --- | --- |
| **Cowboys** | Jsmood | **Dak Prescott** | **CeeDee Lamb** — the gravity WR who opens the entire tree | **Micah Parsons** — chase-down chaos that ends drives |
| **Giants** | Biz | **Young QB room** | **Malik Nabers** — the explosive answer that keeps 79 OVR dangerous | **Dexter Lawrence** — collapse the pocket and force Dak off his spot |

If Lamb eats, SNF becomes another Dallas showcase. If Nabers and the interior front steal a possession game, Biz gets the first “don’t sleep on the rating” headline of Season 1.

## Primetime Week 1 cheat sheet

| Window | Matchup | Coaches | Why it’s on the board |
| --- | --- | --- | --- |
| Season Opener | Seahawks–Patriots | Petey vs Ren | Super Bowl rematch + chalk vs dark-horse elite user |
| MNF | Chiefs–Broncos | Trent vs Puddin | 90 OFF fireworks vs 87 DEF identity |
| TNF | Rams–49ers | Stowe vs Swipe | Best roster in the game vs NFC West heat |
| SNF | Cowboys–Giants | Jsmood vs Biz | Star offense vs early-pick prove-it night |

## Desk verdict

The first champion article told you the map: **Stowe has the mountain**, **Petey has the chalk**, **Ren has the dark-horse toys**, and a handful of game-changers are waiting to ruin someone’s Sunday.

Week 1 Primetime doesn’t settle the Lombardi. It does something meaner — it puts the theories on tape, starting with a Super Bowl rematch kickoff.

Submit the scores. Stamp the Sim Scores. Let the desk argue.

Compete. Conquer. Be legendary.`,
    isFeatured: true,
    sortOrder: -30,
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
