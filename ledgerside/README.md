# 📒 LedgerSide — Multi-Business Expense Tracker

A serverless, mobile-friendly expense tracker built for Canadian small business owners managing multiple side gigs. Snap a receipt photo and AI auto-fills the amount, merchant, date, and category instantly.

---

## ✨ Features

- **📸 AI Receipt Scanning** — Take a photo of any receipt and Claude Vision auto-fills all fields
- **🏢 Multi-Business Support** — Separate tracking for Airbnb and YoungHorizon Chess (easily add more)
- **📅 Month/Year Navigation** — Browse any month across any year
- **🗂️ Category Breakdown** — Tax-ready categories per business (Cleaning, Supplies, Platform Fees, etc.)
- **📊 Summary View** — Monthly bar charts and year-to-date totals across all businesses
- **🧾 Receipt Storage** — Attach and view receipt images directly in the app
- **💾 Persistent Storage** — All data saved to localStorage, survives page refreshes
- **📤 CSV Export** — One-click export of all expenses for your accountant
- **📱 Mobile-First** — Add to your iPhone/Android home screen for a native app feel

---

## 🗂️ Project Structure

```
multibusinessexpensetracker/
├── api/
│   └── scan-receipt.js     # Vercel serverless function (keeps API key secure)
├── src/
│   ├── App.jsx             # Main React application
│   └── main.jsx            # Entry point
├── index.html
├── package.json
├── vite.config.js
├── vercel.json             # Vercel routing config
└── .gitignore
```

---

## 🚀 Deploy to Vercel (Live in 10 minutes)

### Prerequisites
- [Node.js](https://nodejs.org) (LTS)
- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (free, sign in with GitHub)
- [Anthropic API key](https://console.anthropic.com) (for receipt scanning)

### 1. Clone and install

```bash
git clone https://github.com/hifyty/multibusinessexpensetracker.git
cd multibusinessexpensetracker
npm install
npm run dev   # Test locally at http://localhost:5173
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your `multibusinessexpensetracker` GitHub repo
3. Leave all settings as default — Vercel detects Vite automatically
4. Click **Deploy**

### 3. Add your Anthropic API key

This is what powers the receipt scanning. The key lives on Vercel's servers — it never touches the browser.

1. Get your key at [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. In Vercel: **Project → Settings → Environment Variables**
3. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (your key)
   - **Environments:** ✅ Production ✅ Preview ✅ Development
4. Save → go to **Deployments** → Redeploy

Receipt scanning is now live. 🎉

### 4. Add to your phone home screen

**iPhone:** Safari → Share → Add to Home Screen  
**Android:** Chrome → ⋮ Menu → Add to Home Screen

---

## 📱 How to Use

1. Select your **business tab** (Airbnb or YoungHorizon Chess)
2. Choose the **month and year** in the sidebar
3. Tap **+ Add** to open the expense form
4. Tap **📷 Take Photo** to snap your receipt — AI fills in everything
5. Review the auto-filled fields, adjust if needed, and hit **Add Expense**
6. Use **Summary view** to see breakdowns for tax time
7. Hit **↓ Export All as CSV** to send to your accountant

---

## ➕ Adding More Businesses

Open `src/App.jsx` and edit these two objects at the top:

```js
const BUSINESSES = [
  { id: "airbnb", name: "Airbnb", icon: "🏠", color: "#FF5A5F" },
  { id: "younghorizon", name: "YoungHorizon Chess", icon: "♟️", color: "#4A90D9" },
  // Add yours here:
  { id: "newbiz", name: "My New Business", icon: "🚀", color: "#9B59B6" },
];

const CATEGORIES = {
  airbnb: ["Cleaning", "Supplies", ...],
  younghorizon: ["Equipment", "Venue", ...],
  // Match the id above:
  newbiz: ["Category 1", "Category 2", "Other"],
};
```

Then push to GitHub — Vercel auto-deploys.

---

## 🔄 Updating the App

```bash
# Make your changes, then:
git add .
git commit -m "describe your change"
git push
```

Vercel auto-deploys every push. Live in ~30 seconds.

---

## 🔐 Security

- Your Anthropic API key is stored as a Vercel environment variable — never exposed to the browser
- Receipt images are processed server-side and never stored by the API
- All expense data is stored locally in your browser's localStorage

---

## 🛠️ Built With

- [React](https://react.dev) + [Vite](https://vitejs.dev)
- [Vercel](https://vercel.com) serverless functions
- [Anthropic Claude](https://anthropic.com) Vision API (receipt scanning)

---

## 📄 License

Personal use. Built for Airbnb and YoungHorizon Chess expense tracking.
