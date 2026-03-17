# LedgerSide — Deploy Guide
## From zero to live on your phone in ~15 minutes

---

## What you need
- A free GitHub account → github.com
- A free Vercel account → vercel.com (sign in with GitHub)
- An Anthropic API key → console.anthropic.com
- Node.js installed on your computer → nodejs.org (LTS version)

---

## Step 1 — Set up the project on your computer

Open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
# Go to wherever you keep projects, e.g.:
cd ~/Documents

# Copy the ledgerside folder here, then:
cd ledgerside

# Install dependencies
npm install
```

Test it locally first (receipt scanning won't work yet without the key, but the UI will):
```bash
npm run dev
# Open http://localhost:5173 in your browser
```

---

## Step 2 — Push to GitHub

1. Go to github.com → click the + icon → "New repository"
2. Name it `ledgerside`, keep it Private, click "Create repository"
3. Back in your terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ledgerside.git
git push -u origin main
```

Replace YOUR_USERNAME with your GitHub username.

---

## Step 3 — Deploy to Vercel

1. Go to vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Find and click "Import" next to your `ledgerside` repo
4. Leave all settings as default — Vercel detects Vite automatically
5. Click "Deploy"

Your app is now live! Vercel gives you a URL like `ledgerside.vercel.app`

---

## Step 4 — Add your Anthropic API key (enables receipt scanning)

This is the important security step — the key lives on Vercel's servers, never in the app.

1. Get your API key at console.anthropic.com → "API Keys" → "Create Key"
2. In Vercel: go to your project → Settings → Environment Variables
3. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** paste your key (starts with `sk-ant-...`)
   - **Environment:** check Production, Preview, and Development
4. Click Save
5. Go to Deployments → click the three dots on your latest deployment → "Redeploy"

Receipt scanning is now live! 🎉

---

## Step 5 — Add to your phone home screen

**iPhone:**
1. Open Safari → go to your Vercel URL
2. Tap the Share button (box with arrow)
3. Scroll down → "Add to Home Screen"
4. Tap Add

**Android:**
1. Open Chrome → go to your Vercel URL
2. Tap the three dots menu
3. Tap "Add to Home screen"

It will look and feel like a native app.

---

## Future updates

Whenever you want to update the app:
```bash
# Make your changes, then:
git add .
git commit -m "describe your change"
git push
```
Vercel auto-deploys every push. Live in ~30 seconds.

---

## Your live URL
After deploying, your app lives at:
`https://ledgerside.vercel.app` (or similar — check your Vercel dashboard)

Bookmark this on your phone.
