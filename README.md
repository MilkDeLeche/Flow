# Flow·quiz

Upload a chapter, PDF, or slides → get progressive practice quizzes (10 → 20 →
30 → 40 → 50 questions). Every wrong answer explains *why* it's wrong. Questions
are written in the language of your material (English chapter → English quiz;
diapositivas de economía → quiz en español).

Built with React + TypeScript + Vite + Tailwind + GSAP. Quiz generation runs on
the **Anthropic API** behind a serverless function (your key never reaches the
browser). History is saved to **Supabase**.

> **How this app is meant to run:** it's a **live website on Vercel** that you
> and your girlfriend log into from any device — backed by Supabase for accounts
> and saved history. That's the main path (steps 1–3 below). Running it locally
> with `npm` is **optional** and only needed if you want to edit the code
> ([see the bottom](#optional-run-it-locally-to-edit-the-code)).

## 1. Set up the database + auth (Supabase)

1. **SQL Editor → paste `supabase/reset.sql` → Run.** This creates the tables
   with **Row Level Security** so each user can only read/write their own rows.
   *(Heads up: re-running it ERASES all data — fine while setting up, but don't
   re-run it once you have history you care about.)*
   - Then **paste `supabase/migrations/002_user_api_keys.sql` → Run** once. This
     adds the encrypted per-user key table. It's **additive and idempotent** —
     safe to re-run, never wipes anything.
2. **Authentication → Providers → Email**: make sure Email is enabled.
3. **Create your two accounts**: Authentication → Users → *Add user* (set a
   password). Do this for you and your girlfriend.
4. **Lock it down**: Authentication → Providers → Email → turn **OFF**
   "Allow new users to sign up". Now nobody else can register.
5. Grab your keys from **Supabase → Settings → API** — you'll paste
   `Project URL` and the `anon` `public` key into Vercel in step 3.

## 2. Get your Anthropic key

- `ANTHROPIC_API_KEY` — from https://console.anthropic.com (server-only, never
  reaches the browser).
- `ANTHROPIC_MODEL` *(optional)* — defaults to `claude-opus-4-8`. Set
  `claude-sonnet-4-6` or `claude-haiku-4-5` to spend less per quiz.

## 3. Deploy to Vercel (this is your live app)

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project → import the repo**. Vercel auto-detects Vite
   and builds the `api/` function — no config needed.
3. Add the environment variables in **Project → Settings → Environment
   Variables**:

   | Name | Value | Scope |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | your Anthropic key (free-tier only) | Production (and Preview) |
   | `VITE_SUPABASE_URL` | Supabase Project URL | Production |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon public key | Production |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (Settings → API) | Production |
   | `APP_ENCRYPTION_KEY` | 64 hex chars — encrypts stored user keys (see below) | Production |
   | `ANTHROPIC_MODEL` *(optional)* | e.g. `claude-sonnet-4-6` | Production |
   | `ALLOWED_EMAILS` *(optional)* | `you@x.com,her@y.com` | Production |
   | `FREE_LIMIT_HOUR` / `FREE_LIMIT_DAY` *(optional)* | free-tier caps (default 1 / 2) | Production |
   | `FREE_MAX_COUNT` *(optional)* | max questions per free quiz (default 10) | Production |
   | `GLOBAL_DAILY_LIMIT` *(optional)* | total free quizzes/day across everyone | Production |

   Generate `APP_ENCRYPTION_KEY` once and paste the output into Vercel:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   ⚠️ **Keep `SUPABASE_SERVICE_ROLE_KEY` and `APP_ENCRYPTION_KEY` secret** — they
   are server-only (no `VITE_` prefix, so they never reach the browser). If you
   ever rotate `APP_ENCRYPTION_KEY`, every stored user key becomes unreadable and
   users just re-enter theirs.

4. **Deploy.** Open the Vercel URL, log in with one of the accounts you made in
   step 1, and you're live. Share the URL with your girlfriend — she logs in
   with her account.

> After changing any environment variable in Vercel, **redeploy** for it to take
> effect (Deployments → ⋯ → Redeploy).

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
- **Tiers**: anyone who signs in is on a **strict free tier** (default 1/hour,
  2/day, max 10 questions/quiz — "just to try it") that runs on **your** shared
  key. To go beyond that they must add their **own key (BYOK)** — your key is
  *only ever* used for the rate-limited free tier, never for unlimited use.
- **Stored keys, encrypted at rest**: a user's BYOK key is sent to `/api/key`
  once over HTTPS, **encrypted with AES-256-GCM** (`APP_ENCRYPTION_KEY`) and
  saved to their account — tied to their `user_id`, synced across devices. The
  plaintext key is **never returned to the browser** and is decrypted only
  server-side at request time. The `user_api_keys` table has RLS on with **no
  user policies**, so only the service role (the server) can read it — users
  can't see anyone's key, not even their own ciphertext. Keys are never logged.
  *(In local `npm run dev` there's no account, so the key stays in that browser
  only — never used in production.)*
- **Rate limiting (tamper-proof)**: the free tier is capped by a
  `SECURITY DEFINER` Postgres function called with the service-role key. Users
  have **zero** access to the counter table, so they can't reset or inflate
  their own limit; a per-user advisory lock makes the check atomic under
  concurrency. An optional `GLOBAL_DAILY_LIMIT` caps total free-tier usage
  across all users — set it before opening to a class.
- **PDF uploads** are validated server-side (size + `%PDF` header) before any
  vision call.
- **Security headers** (`vercel.json`): a strict Content-Security-Policy,
  HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` /
  `frame-ancestors 'none'` (no clickjacking), a locked-down `Permissions-Policy`,
  and `no-store` on all `/api/*` responses.
- Generated questions are cached per material (a "question bank"), so repeated
  rounds and retakes don't call the API again — saving cost.
- **Diagrams / figures**: text chapters and slides are read for free. If a PDF
  is scanned or figure-heavy (e.g. geometry diagrams), the app sends it to the
  model *visually* — but only once (≤50 pages, ≤3MB), then caches the resulting
  question bank so there's no repeat cost. Math renders as real formulas (KaTeX).

---

## (Optional) Run it locally to edit the code

You only need this if you want to **change** the app. For normal use, the Vercel
URL from step 3 is all you need.

```bash
cp .env.example .env   # then fill in the keys below
npm install
npm run dev            # http://localhost:5173
```

Fill in `.env` with the same values you put in Vercel:

- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` *(optional)*
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

`.env` is gitignored. `npm run dev` serves the quiz API locally via a Vite
middleware that reads `ANTHROPIC_API_KEY` from `.env` — no `vercel dev` needed.
The app still works without Supabase locally — you just won't get saved history.

## Project layout

```
api/
  generate-quiz.ts     Vercel serverless function (holds the API key)
  _generateQuiz.ts     Shared Claude call (structured output, streaming)
src/
  lib/                 api client, file extraction, supabase, history, types
  components/          TopBar, Uploader, QuizRunner, Results, History, TextFade
supabase/reset.sql     Database tables + policies (also resets/rebuilds)
```
