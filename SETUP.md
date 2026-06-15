# Flow — Pick up tomorrow

Your live site: **https://flowstudy.app**

This is your checklist for what’s left. Work top to bottom. Check each box when done.

**Already done (skip unless something broke):**
- Domain `flowstudy.app` connected to Vercel
- Core Vercel env vars (Supabase + Anthropic) from earlier setup
- Cloudflare Turnstile widget **Flow** with `flowstudy.app` + `localhost`
- Google Cloud project named **Flow** (OAuth client may still be incomplete)

---

## 1. Database migrations (Supabase SQL Editor)

Open **Supabase → SQL Editor**. For each file in your repo, paste the whole file → **Run** → move to the next.

**Do not run anything that wipes data.** Skip `reset.sql` if you have history you care about.

| Done | File | What it adds |
|------|------|--------------|
| [ ] | `supabase/fix_current_schema.sql` | Repairs courses, reader marks, BYOK (safe, run first if unsure) |
| [ ] | `supabase/migrations/002_user_api_keys.sql` | BYOK key storage |
| [ ] | `supabase/migrations/003_reader_marks.sql` | Text highlights + notes |
| [ ] | `supabase/migrations/004_course_metadata.sql` | Course semester / year / finished |
| [ ] | `supabase/migrations/005_user_plans.sql` | Plan tiers table |
| [ ] | `supabase/migrations/006_studio_credits.sql` | Studio credits + usage functions |
| [ ] | `supabase/migrations/007_stripe_plans.sql` | Stripe plan sync + lifetime Student flag |

**Verify:** Table Editor shows **`user_plans`**. Open it — you should see columns like `voice_minutes_used` and `lifetime_student`.

**Quick check query:**

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('user_api_keys', 'reader_marks', 'user_plans')
order by table_name;
```

If a migration errors with “already exists”, that step is probably done — continue to the next file.

---

## 2. Supabase auth URLs

**Supabase → Authentication → URL Configuration**

**Site URL:**
```text
https://flowstudy.app
```

**Redirect URLs** (add each line):
```text
http://localhost:5173
http://localhost:5173/**
https://flowstudy.app
https://flowstudy.app/**
```

Save.

---

## 3. Google sign-in (finish OAuth)

You started a Google Cloud project **Flow**. Finish these steps:

### A. Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com/) → select project **Flow**
2. **APIs & Services → OAuth consent screen** — finish setup (External, app name **Flow**, your email). If status is **Testing**, add your Gmail under **Test users**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Type: **Web application**
   - Name: `Flow Web`
   - **Authorized JavaScript origins:**
     ```text
     http://localhost:5173
     https://flowstudy.app
     ```
   - **Authorized redirect URIs** — use your Supabase callback (not flowstudy.app):
     1. Supabase → **Project Settings → API** → copy **Project URL**
     2. Add this in Google (replace with your real URL):
        ```text
        https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
        ```
4. Copy **Client ID** and **Client secret**

### B. Supabase

**Authentication → Providers → Google**
- Enable: ON
- Paste Client ID + Client secret → **Save**

**Test:** [flowstudy.app](https://flowstudy.app) → **Continue with Google** → lands back logged in with name/avatar.

---

## 4. Turnstile (verify — likely mostly done)

### Cloudflare
Widget **Flow** should list:
```text
flowstudy.app
localhost
```

### Supabase
**Authentication → Bot and Abuse Protection**
- CAPTCHA: ON
- Provider: Cloudflare Turnstile
- Secret key: paste from Cloudflare widget

### Vercel
Confirm this env var exists (Production):
```env
VITE_TURNSTILE_SITE_KEY=your_site_key_from_cloudflare
```
Redeploy only if you add or change it.

**Test:** Email sign-in form shows the Turnstile box.

---

## 5. Deploy latest code to Vercel

Push your repo changes to GitHub so Vercel picks up:
- Stripe checkout API routes
- Pricing / checkout buttons (or your custom pricing section when ready)

**Vercel → Deployments** — confirm latest deploy succeeded after push.

---

## 6. Stripe (Test mode first)

**Prerequisite:** migration **007** applied (step 1).

### A. Stripe Dashboard

1. [stripe.com](https://stripe.com) — stay in **Test mode**
2. **Product catalog** — you should have three **monthly** products:

| Product | Your price | Billing |
|---------|------------|---------|
| Flow Student | $9.99/mo | Recurring · Monthly |
| Flow Studio | $19.99/mo | Recurring · Monthly |
| Focus Pack | $9.99/mo | Recurring · Monthly |

3. Copy each **Price ID** (`price_...`) into Vercel (see below).

Run migration **`008_stripe_subscriptions.sql`** in Supabase SQL Editor (after 007).

### B. Webhook

**Developers → Webhooks → Add endpoint**

| Field | Value |
|-------|--------|
| URL | `https://flowstudy.app/api/stripe-webhook` |
| Events | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded` |

Copy **Signing secret** (`whsec_...`)

### C. Vercel env vars (add if missing)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STUDENT=price_...
STRIPE_PRICE_STUDIO=price_...
STRIPE_PRICE_FOCUS_PACK=price_...
APP_URL=https://flowstudy.app
```

These should already exist — don’t regenerate:
```env
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
APP_ENCRYPTION_KEY=...
```

**Redeploy** after adding Stripe vars.

### D. Test payment

1. Sign in at [flowstudy.app](https://flowstudy.app)
2. Settings → **Unlock Student — $5**
3. Test card: `4242 4242 4242 4242`, any future date, any CVC
4. After redirect, BYOK unlocks in Settings (wait a few seconds for webhook)

If plan doesn’t update: **Stripe → Developers → Webhooks** → check delivery logs.

---

## 7. Pricing section (your UI work)

You were redesigning the pricing section yourself. When ready:

- Landing page component: `src/components/landing/PricingSection.tsx`
- Checkout hookup: `src/components/CheckoutButton.tsx` + `src/lib/stripeCheckout.ts`
- Wire buttons to products: `student` | `studio` | `focus_pack`

Or keep the existing checkout buttons and only change layout/copy.

---

## 8. Final smoke test

Run through once on **https://flowstudy.app**:

| Done | Test |
|------|------|
| [ ] | Email sign-up → confirmation link opens flowstudy.app |
| [ ] | Google sign-in works |
| [ ] | Turnstile on email auth |
| [ ] | Paste chapter → quiz generates |
| [ ] | Stripe Student checkout → BYOK unlocks |
| [ ] | (Optional) Studio checkout → credits panel in Settings |

---

## 9. Later (not tomorrow)

- Stripe **Live mode** (real money) — recreate products + webhook in Live, swap `sk_live_` keys
- ElevenLabs read-aloud API
- Tutor chat in chapter reader
- SMTP for Supabase emails (optional, reduces spam limits)

---

## Quick reference — copy-paste blocks

**Supabase Site URL:**
```text
https://flowstudy.app
```

**Supabase Redirect URLs:**
```text
http://localhost:5173
http://localhost:5173/**
https://flowstudy.app
https://flowstudy.app/**
```

**Google JavaScript origins:**
```text
http://localhost:5173
https://flowstudy.app
```

**Google redirect URI (Supabase only):**
```text
https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
```

**Stripe webhook URL:**
```text
https://flowstudy.app/api/stripe-webhook
```

**Repo root:** `d:\desktop 2025\quizapp`

When you’re stuck, note which step number failed and paste the error message.
