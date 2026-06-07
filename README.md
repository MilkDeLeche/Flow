# Flow·quiz

Upload a chapter, PDF, or slides → get progressive practice quizzes (10 → 20 →
30 → 40 → 50 questions). Every wrong answer explains *why* it's wrong. Questions
are written in the language of your material (English chapter → English quiz;
diapositivas de economía → quiz en español).

Built with React + TypeScript + Vite + Tailwind + GSAP. Quiz generation runs on
the **Anthropic API** behind a serverless function (your key never reaches the
browser). History is saved to **Supabase**.

## 1. Set your secrets

```bash
cp .env.example .env
```

Then fill in `.env`:

- `ANTHROPIC_API_KEY` — from https://console.anthropic.com (server-only).
- `ANTHROPIC_MODEL` *(optional)* — defaults to `claude-opus-4-8`. Set
  `claude-sonnet-4-6` or `claude-haiku-4-5` to spend less per quiz.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — from Supabase → Settings → API.

`.env` is gitignored. The app still works without Supabase — you just won't get
saved history.

## 2. Set up the database + auth (Supabase)

1. **SQL Editor → paste `supabase/schema.sql` → Run.** This creates the tables
   with **Row Level Security** so each user can only read/write their own rows.
2. **Authentication → Providers → Email**: make sure Email is enabled.
3. **Create your two accounts**: Authentication → Users → *Add user* (set a
   password). Do this for you and your girlfriend.
4. **Lock it down**: Authentication → Providers → Email → turn **OFF**
   "Allow new users to sign up". Now nobody else can register.

### Security model (going live)

- The app is gated behind login (email + password). With Supabase configured,
  you can't use it without signing in.
- Every row carries `user_id` and RLS policies restrict access to the owner
  (`auth.uid()`), so users never see each other's data.
- The quiz API (`/api/generate-quiz`) verifies the Supabase session on the
  server and rejects anyone not logged in — so your Anthropic key/budget can't
  be abused by random traffic.
- **Fails closed**: in production the API refuses to run if auth isn't
  configured, so a missing env var can never silently expose the key.
- **Email allowlist** (`ALLOWED_EMAILS`): only your two emails can use the API,
  even if Supabase signups are accidentally left on.
- **Tiers**: anyone who signs in is on a **strict free tier** (default 3/hour,
  10/day — "just to try it") that runs on your shared key. Power users add their
  **own Anthropic key (BYOK)** to skip the shared limits entirely and run on
  their own budget. BYOK keys live only in the user's browser and are sent
  per-request — never stored or logged on the server.
- **Rate limiting (tamper-proof)**: the free tier is capped by a
  `SECURITY DEFINER` Postgres function called with the service-role key. Users
  have **zero** access to the counter table, so they can't reset or inflate
  their own limit; a per-user advisory lock makes the check atomic under
  concurrency. An optional `GLOBAL_DAILY_LIMIT` caps total free-tier usage
  across all users — set it before opening to a class.
- **PDF uploads** are validated server-side (size + `%PDF` header) before any
  vision call.
- Generated questions are cached per material (a "question bank"), so repeated
  rounds and retakes don't call the API again — saving cost.
- **Diagrams / figures**: text chapters and slides are read for free. If a PDF
  is scanned or figure-heavy (e.g. geometry diagrams), the app sends it to the
  model *visually* — but only once (≤50 pages, ≤3MB), then caches the resulting
  question bank so there's no repeat cost. Math renders as real formulas (KaTeX).

## 3. Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run dev` serves the quiz API locally via a Vite middleware that reads
`ANTHROPIC_API_KEY` from `.env` — no `vercel dev` needed.

## 4. Deploy to Vercel

Push to GitHub, import the repo in Vercel, then add the environment variables in
**Project → Settings → Environment Variables**:

| Name | Scope |
|---|---|
| `ANTHROPIC_API_KEY` | Production (and Preview) |
| `ANTHROPIC_MODEL` *(optional)* | Production |
| `VITE_SUPABASE_URL` | Production |
| `VITE_SUPABASE_ANON_KEY` | Production |

Vercel auto-detects Vite and builds the `api/` function. Deploy.

## Project layout

```
api/
  generate-quiz.ts     Vercel serverless function (holds the API key)
  _generateQuiz.ts     Shared Claude call (structured output, streaming)
src/
  lib/                 api client, file extraction, supabase, history, types
  components/          TopBar, Uploader, QuizRunner, Results, History, TextFade
supabase/schema.sql    Database tables + policies
```
