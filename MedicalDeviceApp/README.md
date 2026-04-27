# DeviceIQ — Medical Device Scanner (Web)

Identify any medical device from a photo. Get instant troubleshooting guidance powered by Claude AI.

---

## Setup (10 minutes to live URL)

### 1. Install dependencies
```bash
npm install
```

### 2. Add your API key
```bash
cp .env.local.example .env.local
```
Then edit `.env.local` and paste your Anthropic API key.
Get a key at: https://console.anthropic.com

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Deploy to Vercel (free, shareable URL)

### Option A: Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow the prompts. When asked about environment variables, add `ANTHROPIC_API_KEY`.

### Option B: GitHub + Vercel dashboard
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import repo
3. Add environment variable: `ANTHROPIC_API_KEY` = your key
4. Deploy

You'll get a URL like `https://meddevice-web.vercel.app` that works on any device including iPhone camera.

---

## What's in this app

```
app/
  page.tsx          ← Full UI (upload, scan, results)
  layout.tsx        ← Root layout + IBM Plex fonts
  globals.css       ← Design system / CSS variables
  api/
    identify/
      route.ts      ← Claude API call (server-side, key stays secret)
```

## Stack
- Next.js 14 (App Router)
- TypeScript
- Anthropic SDK
- IBM Plex Sans + Mono (Google Fonts)
- Zero UI library dependencies — pure CSS

---

## What Claude returns per scan
- Device name, manufacturer, model number
- Device type / category
- Confidence level + reason
- Common issues (3)
- Troubleshooting steps (4)
- Alarm/error code guidance
- Key IFU safety note

---

## Next steps (v2)
- [ ] IFU database — upload PDFs, chunk + embed, semantic search
- [ ] Device history — save past scans
- [ ] Q&A chat — ask follow-up questions about the device
- [ ] Alarm code lookup — type in a code, get the explanation
- [ ] Auth — team accounts for hospitals / biomed departments

---

## Security note
The API key lives in `.env.local` and is only used server-side in `app/api/identify/route.ts`.
It is never exposed to the browser. Safe to deploy as-is.
