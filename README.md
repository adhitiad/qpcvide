# Auiso Video Platform

Auiso is a highly optimized, modern, full-stack video platform designed for extreme user retention, high SEO performance, and advanced AI integration.

## 🚀 Tech Stack

- **Runtime & Package Manager:** Bun
- **Framework:** Remix + React Router v7
- **Database ORM:** Prisma (SQLite for dev, PostgreSQL ready for prod)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Icons:** Lucide React

## 🌟 Key Features

### 🤖 AI Ecosystem
- **Semantic Search:** Deep content discovery powered by Exa API, bridging natural language concepts to internal video content via query expansion.
- **Interactive AI Chat (18+):** Built-in companion chat powered by Unit Host AI (iframe), with backend proxy readiness for local *Self: After Dark* models via SillyTavern.
- **Auto-Moderation:** Automated NSFW/safety screening for uploaded content using Llama Guard API via Groq.

### 📈 Retention & SEO Strategies
- **SmartSynopsis:** Aggressively converts overlapping keywords in video descriptions into hyperlinked anchor texts, driving internal circulation and SEO indexing.
- **Infinite Scroll:** Seamless `react-intersection-observer` pagination on the Home, Category, and Search pages for binge-browsing.
- **Lazy Loading:** All high-resolution video thumbnails load on-demand.
- **Search Referrer Tracking:** Captures external search terms (from Google, Bing, etc.) via document.referrer and custom fingerprinting to personalize the recommendation engine.
- **Dynamic SEO:** Fully automated `sitemap.xml`, unique meta tags per video, and injected Schema.org `VideoObject` structured data.

### 💰 Monetization & Admin
- **Ad Revenue Dashboard:** Integrated Looker Studio reporting (GA4 + AdSense) and internal direct-ad tracking embedded right into the Admin Panel.
- **Block Monitoring:** Real-time domain block tracking utilizing OONI data to ensure global accessibility.
- **Role-Based Access (RBAC):** Distinct `user`, `premium`, and `admin` roles, enforcing an iron-clad 18+ Age Verification gateway.

## 🛠️ Getting Started

### Installation
Ensure you have [Bun](https://bun.sh/) installed.

```bash
bun install
```

### Database Setup
Initialize your Prisma database:

```bash
bunx prisma db push
bunx prisma generate
```

### Environment Variables
Create a `.env` file at the root:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-super-secret"
EXA_API_KEY="your-exa-api-key"
GOOGLE_ADS_CLIENT_ID="your-adsense-id"
FB_ADS_PIXEL_ID="your-pixel-id"
SILLY_TAVERN_API_URL="http://127.0.0.1:5000/v1/chat/completions"
# ...other variables
```

### Development
Start the development server:

```bash
bun run dev
```
Your application will be available at `http://localhost:5173`.

## 🎨 Theme "Anime Night"
The platform strictly adheres to the custom "Anime Night" aesthetic: Deep dark backgrounds (`slate-950`), vibrant violet (`violet-600`) and cyan (`cyan-500`) accents, and glowing card hover effects.

---
*Built by the Auiso Team.*
