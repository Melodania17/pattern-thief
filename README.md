# Pattern Thief

> Have a tough problem? Steal a solution from somewhere unexpected.

Pattern Thief is a cross-domain pattern recognition tool that helps founders, product leaders, and innovators find unexpected solutions by mining analogies from 25 unexpected fields (nature, mythology, magic, comedy, indigenous knowledge, and more).

## Local Development

```bash
npm install
npm run dev
```

Then create a `.env.local` file with your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Note: The local dev server proxies API calls through `/api/anthropic.js`. For full local testing of the API proxy, use `vercel dev` (requires the Vercel CLI).

## Deployment to Vercel

Pattern Thief is designed to deploy to Vercel in one shot.

### Step 1 — Push to GitHub

1. Create a new repository on GitHub (e.g., `pattern-thief`).
2. In your local project folder, run:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/pattern-thief.git
git branch -M main
git push -u origin main
```

### Step 2 — Connect Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New Project"**.
3. Import your `pattern-thief` repository.
4. Vercel auto-detects the Vite framework. Leave defaults.
5. Before clicking Deploy, expand **"Environment Variables"** and add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
6. Click **Deploy**.

In about 60 seconds, your app will be live at `https://pattern-thief-<random>.vercel.app`.

### Step 3 — Custom Domain (Optional)

1. In Vercel project → **Settings → Domains**.
2. Add a domain like `patternthief.com` or `patternthief.app`.
3. Vercel gives you DNS records to add at your registrar (e.g., Namecheap, Google Domains).
4. After DNS propagates (5-30 minutes), HTTPS is auto-configured.

Recommended domain options: `patternthief.app`, `pattern-thief.com`, `stealpatterns.com`, `beyondsingular.com/pattern-thief` (subpath of your existing domain).

## Updating the Live App

After making changes locally:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel auto-deploys every push to `main`. The new version goes live in ~60 seconds.

## Monetization (Current State — Phase 1)

- **Free tier:** 5 pattern searches per browser
- **Workshop codes:** `CPSI2026` and `THIEF2026` each grant 5 bonus searches
- **At the limit:** Upgrade modal appears with email contact (`Prashant@beyondsingular.com`) and the coupon field
- **Saved cards remain accessible** even after the limit — users can browse, share, and export their collection

## Configuration

To change the email used in the "Reach Out" button, search `PatternThief.jsx` for `Prashant@beyondsingular.com` and replace.

To add coupon codes, edit the `VALID_COUPONS` object near the top of `PatternThief.jsx`:

```javascript
const VALID_COUPONS = { 
  "CPSI2026": 5, 
  "THIEF2026": 5,
  "YOUR_NEW_CODE": 5  // bonus searches per code
};
```

To change the free limit:

```javascript
const FREE_LIMIT = 5;
```

## Cost Estimates

Each search makes 1-2 calls to Claude (Sonnet 4.5):
- Clarification check: ~$0.005
- Pattern analysis: ~$0.02-0.04
- Go Deeper exploration: ~$0.02

**Per user with 5 free searches:** ~$0.15-0.25 in API costs.

For a workshop of 50 attendees each using their full 10 searches (5 free + 5 from code): ~$15-25 in total Anthropic API costs.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Vercel serverless functions (Node.js)
- **AI:** Anthropic Claude Sonnet 4.5 (`claude-sonnet-4-20250514`)
- **Storage:** Browser localStorage (Phase 1)
- **Hosting:** Vercel
- **Deployment:** Auto-deploy via GitHub

## Phase 2 — Coming Later

When you're ready to add real payments and accounts:

- Stripe Checkout integration for paid Pro tier
- Supabase database for user accounts and persistent state
- Clerk or Supabase Auth for sign-in
- Server-side enforcement of search limits (vs current browser-only)
- Cross-device subscription access

## Support

This was built for Roy (Beyond Singular) as a Phase 1 launch package. For questions or Phase 2 expansion, reference the conversation history.
