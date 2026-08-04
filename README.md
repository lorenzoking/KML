# Kings Madden League

Commissioner-run Madden 27 online franchise league management for 32 real users.

This MVP replaces the spreadsheet / Google Forms workflow with a standalone Next.js app backed by Postgres (Supabase) and Google OAuth.

## What it does

- Google sign-in (plus local demo login for development)
- Role-based access: Commissioner, Coach, public viewer
- 32 NFL franchise seed + team assignment
- Coach dashboard (team, record, XP, reputation, pending/approved games)
- Game result submission with duplicate matchup/week protection
- Commissioner approve / reject workflow
- Standings derived from approved results only
- Automatic XP on approval + manual XP adjustments
- Coach reputation adjustments with Elite / Stable / Pressured / Hot Seat labels
- League rules + editable season/week/XP settings
- Audit log for major admin actions

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Supabase Auth (Google OAuth) + Postgres
- Prisma ORM
- Zod validation
- Vercel-ready

## Quick start (local)

### 1. Install

```bash
npm install
```

### 2. Start Postgres

Docker Compose is included:

```bash
docker compose up -d
```

Or point `DATABASE_URL` at your Supabase Postgres connection string.

### 3. Configure env

```bash
cp .env.example .env
```

Minimum local values:

```env
DATABASE_URL="postgresql://kml:kml@localhost:5432/kings_madden_league"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
COMMISSIONER_EMAILS="you@gmail.com"
AUTH_DEV_BYPASS="true"
```

### 4. Migrate + seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

With `AUTH_DEV_BYPASS=true`, use **Sign in → Demo login** and pick:

- `commissioner@kml.local` — full admin
- `coach.buf@kml.local` (and other coaches) — user flow

## Google OAuth (Supabase)

1. Create a Supabase project.
2. Enable Google provider (Auth → Providers → Google).
3. Add redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Add site URL / additional redirect: `http://localhost:3000/auth/callback` (and your Vercel URL in production).
5. Put values in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=... # Supabase Postgres URI
AUTH_DEV_BYPASS=false
COMMISSIONER_EMAILS=your-gmail@gmail.com
```

On first Google sign-in, the app upserts a `User` row. Emails listed in `COMMISSIONER_EMAILS` are promoted to `COMMISSIONER`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Set env vars from `.env.example`.
4. Ensure `DATABASE_URL` points at Supabase (use the pooled connection string for serverless if needed).
5. Set `AUTH_DEV_BYPASS=false`.
6. Add the Vercel URL to Supabase Auth redirect allow-list.
7. Deploy. Run migrations against production:

```bash
npx prisma migrate deploy
npm run db:seed
```

## App routes

| Route | Access |
| --- | --- |
| `/` | Public landing |
| `/sign-in` | Public |
| `/standings` | Public read-only |
| `/rules` | Public read-only |
| `/dashboard` | Signed-in |
| `/submissions` | Signed-in coach |
| `/admin` | Commissioner |
| `/admin/approvals` | Commissioner |
| `/admin/teams` | Commissioner |
| `/admin/settings` | Commissioner |

## Core business rules

- Standings and automatic XP only use **approved** submissions.
- Rejected submissions remain in history with a decision note.
- Duplicate pending/approved submissions for the same matchup + week are blocked.
- XP totals = sum of `XPAdjustment` rows (automatic + manual).
- Reputation score = `startingRepScore` + sum of `ReputationAdjustment` rows.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run db:migrate
npm run db:seed
npm run db:reset
```

## Phase 2 roadmap

Deferred from the original All-In-One spreadsheet system:

1. **Player / team stat submission** — structured weekly box-score forms, commissioner validation, and per-coach leaderboards.
2. **Madden Companion import pipeline** — ingest exported league files, map franchise IDs, and auto-draft pending game rows for approval.
3. **Google Sheets export** — one-way sync of standings, XP, and reputation for Discord/Dyno links without using Sheets as the source of truth.
4. **Coaching carousel** — offseason vacancies, buyout XP costs, hiring priority queue, and contract term resets.
5. **Tanking review** — evidence-based case workflow, strike ladder, and reputation/XP penalties separate from draft-order changes.

## License

Private league software. Adjust as needed for your organization.
