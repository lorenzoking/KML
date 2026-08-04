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

### Commissioner accounts (recommended)

Use **one Google account per commissioner** (their real Gmail). Put those emails in `COMMISSIONER_EMAILS`.  
The same account can also be assigned a franchise — so you can coach the Bills and still access Admin.

Avoid a single shared “admin login” for day-to-day use: audit logs won’t show who approved games, and you can’t remove one commissioner without rotating the password for everyone.

Optional emergency backup login (shared email/password) can be enabled with:

```env
COMMISSIONER_BACKUP_EMAIL=commissioners@yourleague.com
COMMISSIONER_BACKUP_PASSWORD=a-long-shared-password
COMMISSIONER_BACKUP_NAME=League Commissioners
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel (Framework Preset: **Next.js**).
3. Set env vars from `.env.example`.
4. For Supabase on Vercel, use **two** database URLs from  
   **Project Settings → Database → Connection string**:
   - `DATABASE_URL` = **Transaction** pooler (port `6543`), append `?pgbouncer=true`
   - `DIRECT_URL` = **Direct** connection (port `5432`) for Prisma migrations
5. Set `AUTH_DEV_BYPASS=false` and `NEXT_PUBLIC_APP_URL` to your Vercel URL
   (no trailing slash), e.g. `https://kml-two.vercel.app`.
6. In Supabase → **Authentication → URL Configuration**:
   - **Site URL** = your Vercel URL (not localhost)
   - **Redirect URLs** include `https://YOUR-APP.vercel.app/auth/callback`
7. Deploy. Then run migrations against production (uses `DIRECT_URL`):

```bash
npx prisma migrate deploy
npm run db:seed
```

If the Vercel build fails with “Can't reach database server”, the app pages no longer
query the DB at build time — update `DATABASE_URL` to the pooler URI and redeploy.

## App routes

| Route | Access |
| --- | --- |
| `/` | Public landing |
| `/sign-in` | Public |
| `/games` | Public week results + standings; submit when signed in |
| `/rules` | Public read-only |
| `/dashboard` | Signed-in |
| `/admin` | Commissioner |
| `/admin/approvals` | Commissioner |
| `/admin/users` | Commissioner |
| `/admin/teams` | Commissioner |
| `/admin/season` | Commissioner |
| `/admin/settings` | Commissioner |

## Core business rules

- Standings and automatic XP only use **approved, non-voided** submissions.
- Rejected/voided submissions remain in history with a decision note.
- Duplicate pending/approved submissions for the same matchup + week are blocked.
- XP totals = sum of `XPAdjustment` rows (automatic + manual), kept across seasons.
- Reputation score = `startingRepScore` + sum of `ReputationAdjustment` rows.
- Advancing a season archives the old season and starts a new one; historical results stay for career stats.
- Resetting season games voids current-season results only and does not erase prior seasons.

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
