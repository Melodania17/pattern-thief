# Pattern Thief — Phase 2 Deployment Guide

This guide walks you through setting up the full monetization stack: Supabase (database + auth), Stripe (payments), and Resend (email). Estimated time: **90 minutes** start to finish.

You'll need:
- Your existing Vercel project (from Phase 1)
- A credit card for the Stripe account verification (no charge)
- About 90 minutes of focused time

---

## Part 1 — Supabase Setup (25 min)

Supabase handles user accounts, payments tracking, and data storage.

### 1.1 Create your Supabase project

1. Go to **supabase.com**
2. Click **Sign Up** → Continue with GitHub (reuse your existing GitHub account)
3. Click **New Project**
4. Project name: `pattern-thief`
5. Database password: click **Generate a password** and **save it somewhere safe** (you may need it later)
6. Region: pick closest to your users (e.g., `US East`)
7. Pricing plan: **Free** (handles thousands of users)
8. Click **Create new project**
9. Wait ~2 minutes while it spins up

### 1.2 Run the database schema

1. In your Supabase project, click the **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from your Pattern Thief project
4. Copy ALL the contents and paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned." That's correct.

### 1.3 Get your Supabase credentials

In Supabase, click **Settings** (gear icon, bottom left) → **API**. You'll see three values you'll need shortly:

1. **Project URL** (looks like `https://abc123.supabase.co`)
2. **anon / public key** (long string, safe to expose in frontend)
3. **service_role / secret key** (long string, NEVER expose in frontend — backend only)

Keep this tab open. You'll paste these into Vercel in a moment.

### 1.4 Configure auth providers

Click **Authentication** → **Providers** in the left sidebar.

**Email magic links** — should be enabled by default. Verify it's on.

**Google OAuth:**

1. Click **Google**, toggle on
2. You'll need a Google Cloud Console Client ID. Quick steps:
   - Go to **console.cloud.google.com**
   - Create a new project (name it `Pattern Thief`)
   - Go to **APIs & Services → Credentials**
   - Click **+ Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: paste this exact URL from your Supabase project: `https://YOUR-SUPABASE-URL.supabase.co/auth/v1/callback`
   - Save, copy the **Client ID** and **Client Secret**
3. Back in Supabase Google provider, paste the Client ID and Secret
4. Click **Save**

If Google OAuth feels like too much for now, skip it — magic-link email works great on its own.

### 1.5 Configure auth URLs

Click **Authentication** → **URL Configuration**:

- **Site URL:** your Vercel URL (e.g., `https://pattern-thief.vercel.app`) or custom domain
- **Redirect URLs:** add both the Vercel URL and your custom domain if you have one

Save.

---

## Part 2 — Stripe Setup (20 min)

### 2.1 Create your Stripe account

1. Go to **stripe.com**
2. Click **Start now** and create an account
3. You'll need to provide business details — for a sole proprietorship, use your name and address
4. Add a bank account where payouts will go

Stripe will be in **Test mode** by default — perfect for now. You'll switch to live mode when you're ready to accept real payments.

### 2.2 Get your Stripe API keys

1. In Stripe Dashboard, click **Developers** (top right) → **API keys**
2. You'll see two keys:
   - **Publishable key** (`pk_test_...`) — safe in frontend
   - **Secret key** (`sk_test_...`) — click "Reveal" and copy. Backend only.

Keep this tab open.

### 2.3 Set up the webhook

This is how Stripe tells your app when a payment completes.

1. In Stripe Dashboard, click **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://YOUR-VERCEL-URL/api/stripe-webhook`
   (replace with your actual Vercel URL — you'll deploy first, then come back to update this if needed)
4. **Events to send:** click "Select events" and choose:
   - `checkout.session.completed`
   - `charge.refunded`
5. Click **Add endpoint**
6. On the next page, find **Signing secret** → click "Reveal" → copy it (starts with `whsec_...`)

---

## Part 3 — Resend Setup (10 min)

Resend sends the welcome email when someone purchases.

1. Go to **resend.com**
2. Sign up (Continue with GitHub is fastest)
3. Verify your email
4. Click **API Keys** in the left sidebar
5. Click **Create API Key** → name it `pattern-thief-production`
6. Permission: **Full access**
7. Copy the key (starts with `re_...`)

**Optional but recommended** — set up your sending domain:

1. In Resend, click **Domains** → **Add Domain**
2. Enter `patternthief.com` (or your actual domain)
3. Resend gives you DNS records — add them at your domain registrar
4. Wait ~10 min for verification
5. Once verified, you can send from `noreply@patternthief.com`

If you skip this, emails will send from `onboarding@resend.dev` (functional but less branded).

---

## Part 4 — Add Environment Variables to Vercel (10 min)

1. Go to **vercel.com** → your `pattern-thief` project → **Settings** → **Environment Variables**

Add each of these (Name → Value):

```
ANTHROPIC_API_KEY                  =  sk-ant-... (your existing key)
SUPABASE_URL                       =  https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY          =  (from Supabase, the secret one)
VITE_SUPABASE_URL                  =  https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY             =  (from Supabase, the public anon key)
STRIPE_SECRET_KEY                  =  sk_test_... (from Stripe)
STRIPE_WEBHOOK_SECRET              =  whsec_... (from Stripe)
RESEND_API_KEY                     =  re_... (from Resend)
IP_HASH_SALT                       =  any-random-string-you-like (e.g., paste a UUID)
```

For each one, set the environment to **Production** (and you can also tick Preview + Development if you want).

Two things to know:
- Variables starting with `VITE_` are exposed to the browser (this is correct for the anon key and URL — they're public)
- The `SUPABASE_SERVICE_ROLE_KEY` is BACKEND ONLY. Never put `VITE_` in front of it.

---

## Part 5 — Push the New Code to GitHub (5 min)

1. Download the new `pattern-thief-deploy` folder
2. Replace your local folder OR copy these new/changed files in:
   - All files in `api/` (`anthropic.js`, `stripe-checkout.js`, `stripe-webhook.js`, `stripe-refund.js`, `redeem-coupon.js`, `user-status.js`, `saved-cards.js`)
   - `src/PatternThief.jsx` (updated)
   - All files in `src/lib/` (`supabase.js`, `fingerprint.js`, `api.js`)
   - All files in `src/components/` (`AuthModal.jsx`, `UpgradeModal.jsx`, `AccountPanel.jsx`)
   - `supabase/schema.sql`
   - `package.json` (new dependencies)
   - `vercel.json` (function timeouts)
   - `public/privacy.md` and `public/terms.md`
3. In terminal:
   ```
   git add .
   git commit -m "Phase 2: monetization + auth + payment flow"
   git push
   ```
4. Vercel auto-deploys in ~60 seconds

---

## Part 6 — Test in Test Mode (15 min)

Before going live, test the full flow.

### 6.1 Test free tier
- Visit your live URL in an incognito window
- Run 5 searches — should work fine
- On the 6th search — should show blurred preview
- On the 7th attempt — should show upgrade modal

### 6.2 Test sign-in
- Click **Sign in** in top right
- Try magic-link email — check your inbox for the link
- Try Google sign-in if you configured it

### 6.3 Test purchase (TEST MODE — no real charge)
- Click **Upgrade to Lifetime**
- Use Stripe's test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
- Complete checkout
- Verify the welcome email arrives
- Verify the **PRO** badge appears in your account

### 6.4 Test refund
- Open your account panel
- Click **Cancel & refund** → confirm
- Verify Pro access revoked
- Check Stripe dashboard to confirm refund processed

### 6.5 Test coupon
- Make a new account in incognito
- Click **Sign in**, then **Enter your code** in upgrade modal
- Enter `CPSI2026` → should grant lifetime
- OR enter `THIEF2026` → should grant +5 searches

---

## Part 7 — Go Live (5 min)

When everything works in test mode:

1. In Stripe Dashboard, top-right toggle: switch from **Test mode** → **Live mode**
2. Go to **Developers → API keys** in live mode — copy the **live** secret key (`sk_live_...`)
3. Go to **Developers → Webhooks** in live mode — set up the webhook again (same URL, same events) and copy the new **live signing secret**
4. In Vercel, update these two env vars:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → new `whsec_...`
5. In Vercel, go to **Deployments** → click the most recent → click **Redeploy** to pick up new env vars

You're live. The very next purchase will be a real charge.

---

## Costs Summary

| Service | Cost |
|---------|------|
| Vercel | Free (more than enough) |
| Supabase | Free up to 50k MAU |
| Stripe | 2.9% + $0.30 per transaction |
| Resend | Free up to 3,000 emails/month |
| Anthropic | ~$0.03 per search (already factored in) |

For your CPSI workshop (50 attendees, ~10 searches each, ~5 paid users at $37):
- API cost: ~$30
- Stripe fees: ~$5 (3 paid × 2.9% + $0.30 per)
- **Revenue: ~$185**
- **Net: ~$150**

---

## Troubleshooting

**"Webhook signature verification failed" in logs**
→ The `STRIPE_WEBHOOK_SECRET` doesn't match. Recopy it from Stripe → Webhooks → click the endpoint → reveal signing secret.

**Sign-in link arrives but doesn't work**
→ Check Supabase Authentication → URL Configuration. Make sure your Vercel URL is in the redirect URLs list.

**"401 Invalid auth token" on purchase**
→ User isn't actually signed in. Check that they completed the email verification.

**Welcome email doesn't arrive**
→ Check Resend dashboard for delivery logs. If sending from `noreply@patternthief.com`, the domain needs to be verified in Resend.

**The "spots left" counter doesn't decrement**
→ Counter only counts `source = 'stripe'` purchases. Coupon redemptions don't reduce the counter (that's intentional).

---

## What's Next

When this is working and you have real users:

- **Domain packs** — your first paid expansion ($19 packs of 5-7 new domains)
- **Pattern Thief for Teams** — multi-seat pricing
- **Cubist Reader** — book companion product
- **Education vertical** — Pattern Explorer for schools/colleges

For any of these, come back to this conversation and we'll build them.

---

## Questions or Issues

If something breaks, the most useful place to look is **Vercel → your project → Deployments → click latest → Functions** to see live logs from your API endpoints.

If you're stuck, screenshot the error and come back to this conversation.

Good luck with the launch.
