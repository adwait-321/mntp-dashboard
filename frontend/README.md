# APEDA Trade Intelligence Dashboard

A production-ready React + Vite dashboard for exploring India's agricultural export data (2020–2025), sourced from APEDA.

## Features

- **Market Overview** — 5-year export trends, top importing countries, top commodities, category splits
- **Commodity Trends** — Per-commodity YoY trends, stacked country charts, drill-down by year
- **Country Intelligence** — Per-country import breakdown, commodity rankings, trend analysis

## Tech Stack

- React 18 + Vite 4
- Recharts for all data visualizations
- Zero external UI libraries — custom components only
- ~30,000 trade records embedded as a JSON data file

---

## Getting Started

### 1. Prerequisites

Make sure you have **Node.js 18+** installed:
```bash
node -v   # should print v18.x.x or higher
```

### 2. Install dependencies

```bash
cd apeda-dashboard
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
apeda-dashboard/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite config
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                # React root mount
    ├── App.jsx                 # Root component + navigation
    ├── index.css               # Global styles + animations
    ├── constants.js            # Shared YEARS, PALETTE, COLORS
    ├── data/
    │   ├── apeda_compact.json  # All 30,231 trade records (3.4MB)
    │   └── loader.js           # Data loading + in-memory index builder
    ├── utils/
    │   └── format.js           # fmtVal, fmtQty, trunc helpers
    └── components/
        ├── UI.jsx              # Shared primitives (StatCard, Select, Tabs, etc.)
        ├── MarketOverview.jsx  # 📊 Market Overview view
        ├── ProductTrends.jsx   # 🌿 Commodity Trends view
        └── CountryIntelligence.jsx  # 🌍 Country Intelligence view
```

---

## Deploying to Netlify

### Via GitHub (recommended)

1. Push this folder to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Select your repo
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy**

Every push to `main` will automatically redeploy. ✅

### Via Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

---

## Building for Production

```bash
npm run build
```

Output goes to the `dist/` folder. You can preview it locally with:

```bash
npm run preview
```

---

## Data Format

The data file `src/data/apeda_compact.json` uses a compact array format to minimize file size:

```json
{
  "meta": {
    "years": ["2020-21", ...],
    "products": [...],
    "countries": [...],
    "categories": [...]
  },
  "records": [
    ["2020-21", "Product Name", "Country", "Category", qty, value],
    ...
  ]
}
```

Each record: `[Year, Product, Country, Category, Quantity_MT, Value_USD_Million]`
