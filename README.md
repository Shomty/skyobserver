<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vedic Sky Observer

Real-time Sidereal Vedic astrology visualizer — planetary positions, natal/transit charts, yogas, dashas, panchang, and ashtakavarga with Gemini AI interpretations.

**Tech:** React 19 · TypeScript · Vite · Tailwind CSS · Firebase · Gemini AI · astronomy-engine

---

## Local Setup

**Prerequisites:** Node.js 18+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your keys:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `GEMINI_API_KEY` | Google Gemini API key | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `EPHE_PATH` | Path to Swiss Ephemeris `.se1` files | See step 3 below |

### 3. Download Swiss Ephemeris files

The `ephe/` directory (~303 MB of binary star data) is not included in the repo. Download it from the [Swiss Ephemeris FTP](https://www.astro.com/ftp/swisseph/ephe/) and place the files in an `ephe/` folder at the project root, then set `EPHE_PATH` in `.env.local` to that path:

```
EPHE_PATH=/path/to/your/project/ephe
```

### 4. Configure Firebase

```bash
cp firebase-applet-config.example.json firebase-applet-config.json
```

Edit `firebase-applet-config.json` with your Firebase project credentials from the [Firebase Console](https://console.firebase.google.com/).

### 5. Run the app

```bash
npm run dev   # starts on http://localhost:3000
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build → `dist/` |
| `npm run lint` | TypeScript type check |
| `npm run clean` | Remove `dist/` |
