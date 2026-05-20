# Pattern Thief — Deployment Guide

## What You'll Need (15 minutes total to set up)

1. **GitHub account** — github.com (free)
2. **Vercel account** — vercel.com (free)
3. **Anthropic API key** — console.anthropic.com (pay-as-you-go, ~$0.03 per user search)

---

## Part 1 — Push to GitHub (5 min)

### 1.1 Install Git (if you don't have it)
- Mac: `brew install git` or download from git-scm.com
- Windows: download from git-scm.com

### 1.2 Create a new GitHub repo
1. Go to github.com → click **+** in top-right → **New repository**
2. Name it: `pattern-thief`
3. Keep it **Public** (free Vercel tier supports public repos best)
4. **Don't** check "Initialize with README" — leave empty
5. Click **Create repository**

### 1.3 Push the code
Open your terminal in the `pattern-thief-deploy` folder (the one with this guide). Run these commands one at a time:

```bash
git init
git add .
git commit -m "Pattern Thief — initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/pattern-thief.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username. The last command will prompt for GitHub login — use a personal access token if password doesn't work (GitHub no longer accepts passwords for git).

To create a token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token → check "repo" scope.

### 1.4 Verify
Refresh your GitHub repo page. You should see all the project files.

---

## Part 2 — Get Your Anthropic API Key (2 min)

1. Go to console.anthropic.com
2. Sign in or create an account
3. Click **API Keys** in the left sidebar
4. Click **Create Key**
5. Name it "Pattern Thief Production"
6. Copy the key (starts with `sk-ant-...`) — you'll need it in a moment
7. Add credits to your account: **Billing** → **Add Credits** (start with $10-20)

---

## Part 3 — Deploy to Vercel (5 min)

### 3.1 Sign in to Vercel
1. Go to vercel.com
2. Click **Sign Up** (or **Log In**)
3. Choose **Continue with GitHub** — authorize Vercel to access your repos

### 3.2 Import your project
1. On the Vercel dashboard, click **Add New** → **Project**
2. You'll see your GitHub repos listed. Find `pattern-thief` and click **Import**
3. Vercel auto-detects this is a Vite project. The settings should be:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **IMPORTANT:** Before clicking Deploy, expand the **Environment Variables** section:
   - Key: `ANTHROPIC_API_KEY`
   - Value: paste your Anthropic API key from Part 2
   - Click **Add**
5. Click **Deploy**

### 3.3 Wait
Vercel will build and deploy in about 60 seconds. You'll see logs streaming.

When done, you'll see "🎉 Congratulations!" and a preview link like:
`https://pattern-thief-abc123.vercel.app`

Click it. Pattern Thief is now live on the internet.

---

## Part 4 — Test It

1. Open your live URL
2. Type a problem in the textarea (or click a starter chip)
3. Click **Find Hidden Patterns**
4. You should see results within ~10-15 seconds

If you see an error like "API key not configured":
- Go to Vercel → your project → Settings → Environment Variables
- Verify `ANTHROPIC_API_KEY` is there with the correct value
- Redeploy: Vercel → your project → Deployments → click ⋯ on the latest deployment → Redeploy

---

## Part 5 — Custom Domain (Optional, 5-30 min for DNS)

### Buy a domain
Recommended: `patternthief.app`, `patternthief.com`, `stealpatterns.com`. Buy from Namecheap, Google Domains, or Vercel itself (Vercel sells domains and auto-configures them — easiest path).

### Connect to Vercel
1. In Vercel: your project → **Settings** → **Domains**
2. Enter your domain (e.g., `patternthief.com`) → **Add**
3. Vercel shows you the DNS records to add at your registrar:
   - Either an **A record** pointing to `76.76.21.21`
   - Or a **CNAME record** pointing to `cname.vercel-dns.com`
4. Log into your domain registrar, find DNS settings, add the records
5. Wait 5-30 minutes for DNS to propagate
6. Vercel auto-provisions HTTPS once DNS is verified

### If you bought via Vercel
DNS is auto-configured. Just wait 5 minutes.

---

## Updating Your App Later

Whenever you want to make changes:

1. Edit files locally
2. In terminal:
   ```bash
   git add .
   git commit -m "Brief description of changes"
   git push
   ```
3. Vercel auto-deploys in 60 seconds

You don't need to do anything in Vercel — it watches your GitHub repo and deploys every push.

---

## Common Issues

### "Build failed" on Vercel
- Check the build logs. Most common: missing `package.json` or syntax error.
- Make sure you pushed all files to GitHub (`git status` should show "nothing to commit").

### "API key not found" in the live app
- Vercel → Settings → Environment Variables → confirm `ANTHROPIC_API_KEY` is set
- After adding env vars, you must **redeploy** (Vercel doesn't auto-rebuild on env var changes)

### Searches not generating cards
- Check browser console for errors
- Most likely: API key issue, or Anthropic account out of credits

### Local testing not working
- Use `vercel dev` instead of `npm run dev` if you want to test the API proxy locally
- Install: `npm install -g vercel`
- Then in the project folder: `vercel dev`

---

## Cost Tracking

You'll pay Anthropic per API call. Monitor at console.anthropic.com → Usage.

Average cost per user (full 5 free searches + Go Deeper on a few cards): **~$0.20-0.30**

For your CPSI workshop (50 attendees, ~10 searches each with coupon): **~$20-30 total**.

Vercel is free for personal use up to generous limits — Pattern Thief won't come close to hitting them.

---

## Workshop Coupon Codes

Currently active codes (give 5 bonus searches each):
- `CPSI2026`
- `THIEF2026`

To add more, edit `src/PatternThief.jsx` near the top:
```javascript
const VALID_COUPONS = { 
  "CPSI2026": 5, 
  "THIEF2026": 5,
  "YOUR_EVENT_CODE": 5,  // add here
};
```

Then commit + push to deploy.

---

## You're Live

Pattern Thief is now publicly accessible. Share the URL however you'd like.

When you're ready for Phase 2 (real Stripe payments, accounts, server-side limits), let me know and we'll build it.
