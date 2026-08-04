# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vedic Sky Observer (SoulBlueprint)** — real-time Sidereal Vedic astrology visualizer. Calculates planetary positions, natal/transit charts, yogas, dashas, panchang, and ashtakavarga using the Lahiri ayanamsa; Gemini generates the interpretive text.

**Stack:** React 19 · TypeScript 5.8 · Vite 6 · Tailwind 4 · Firebase 12 · Express 4 · `@google/genai` · astronomy-engine · Swiss Ephemeris · Recharts · Vitest

---

## Dev Commands

```bash
npm run dev       # Dev server on :3000 — runs server.ts via tsx (Express + Vite middleware)
npm start         # Production mode — NODE_ENV=production tsx server.ts, serves dist/
npm run build     # prebuild generates firebase-applet-config.json, then vite build → dist/
npm run lint      # TypeScript type check (tsc --noEmit) — the only linter
npm test          # vitest run
npm run clean     # rm -rf dist/
```

Run a single test file or a single case:

```bash
npx vitest run src/features/gift/lib/eligibility.test.ts
npx vitest run -t "rejects an expired token"
```

**Test setup:** Vitest config lives inside `vite.config.ts` (`test.include: ['src/**/*.test.ts']`, `environment: 'node'`) — there is no separate `vitest.config.ts`. Coverage today is limited to `src/features/gift/` (schemas, birth instant, eligibility). Everything outside the gift funnel is verified manually: start the dev server and exercise the changed feature in the browser.

**Required env** (`.env.local`, template in `.env.example`): `GEMINI_API_KEY`. Firebase values are read from `firebase-applet-config.json` locally (template: `firebase-applet-config.example.json`) or generated at build time from `FIREBASE_*` env vars by `scripts/generate-firebase-config.js`. `EPHE_PATH` is optional — it falls back to `node_modules/swisseph/ephe` when the local `ephe/` directory is absent.

---

## Architecture

One Express process (`server.ts`, ~690 lines) serves everything. In dev it mounts Vite as middleware; in production it serves `dist/`. There is no separate API server.

### Two astronomy engines — know which one you are touching

This is the least obvious thing about the codebase.

| Engine | Where | Used for |
|---|---|---|
| `astronomy-engine` | `src/vedic-utils.ts`, runs in the browser | The bulk of Vedic math — yogas, dashas, nakshatras, panchang, ashtakavarga, drishti, divisional charts |
| Swiss Ephemeris via `openastrology-library` | `server.ts` only, native C++ addon | High-precision sidereal positions, Vimshottari dashas, transit ingresses |

The server engine is reached through `/api/planet-positions`, `/api/vimshottari-dashas`, `/api/transit-ingresses` and consumed by `src/services/positionsService.ts` and `dashasService.ts`. Those services **deduplicate in-flight requests** (keyed by minute-rounded timestamp + lat/lon) because StrictMode double-fires effects, and they degrade gracefully — on network failure the caller keeps its last known positions so the UI never blanks.

`openastrology-library` must never be imported under `src/` — it wraps a native addon and will crash the browser bundle. `server.ts` loads it via `createRequire`.

### Routing

`src/main.tsx` owns real routes; `App.tsx` is the `*` catch-all.

- `/gift`, `/gift/:slug`, `/gift/:slug/sent`, `/gift/verify` → the gift funnel
- `/shared/:shareId`, `/privacy`, `/terms`
- everything else → `App.tsx`, a **tab-based SPA** that switches views with an `activeTab` state variable, not with URLs

So "navigating" inside the main app unmounts and remounts panels. Any state kept in a `useRef` to avoid duplicate work is lost on a tab switch — see the caching section below.

Route components use `lazyWithReload()` (`src/lib/lazyWithReload.ts`) rather than bare `React.lazy`, and sit under a root `ErrorBoundary` keyed on `pathname`.

### Layout

```
server.ts                     Express: Vite middleware or dist/, Gemini proxy, Swiss Ephemeris
                              endpoints, geocoding chain, gift funnel API, /health
src/
  vedic-utils.ts              ~5,100 lines — ALL client-side Vedic math. Search before adding.
  App.tsx                     ~2,300 lines — auth flow, tab routing, expensive useMemo chains
  main.tsx                    Router, providers, StrictMode
  components/
    DataDashboard.tsx         ~4,500 lines, the largest file — multi-tab dashboard
    SkyMap.tsx                Sky visualizer (circular + North Indian modes)
    NorthIndianChart.tsx
  pages/                      AIChat, Admin, Profiles, SharedChat, SudarshanaChakra, Landing, legal/
  features/gift/              The one true feature module: components/ config/ copy/ hooks/
                              lib/ pages/ — colocated, and holds the repo's only tests
  services/                   geminiService (prompts) · aiReportService (report cache)
                              positionsService, dashasService (server calc bridge)
                              chatSessionService, shareService, exportService
  lib/                        api-utils (withRetry, callGeminiProxy) · debug · journalUtils
  context/ThemeContext.tsx    Dark/light, persisted to localStorage
firestore.rules               Per-user isolation + admin override
firestore.indexes.json        Composite indexes — deployed separately from the app
v2/                           Standalone build with its own package.json and vite.config.ts.
                              No root npm scripts drive it; run commands from inside v2/.
```

### Firestore data model

Everything is scoped under `/users/{uid}`:

```
/users/{uid}
  /savedCharts/{chartId}       multiple birth charts per user
  /interpretations/{interpId}  saved AI interpretations
  /ai_reports/{docId}          cached AI reports, fixed IDs (see below)
  /ai_report_backups/{id}      snapshots of replaced cosmic reports
  /ai_chats/{chatId}/messages/{messageId}
```

Admin access resolves two ways: a custom `admin: true` auth-token claim **or** a `role: 'admin'` field on the user document (`isAdminOrAdminRole()` in `firestore.rules`). `scripts/make-admin.js` sets this up.

---

## Conventions that will bite you

### Gemini goes through the backend proxy — always

Never instantiate `GoogleGenAI` under `src/`; the key must stay server-side.

```ts
import { callGeminiProxy } from '../lib/api-utils';   // ✅ hits server.ts /api/gemini
const text = await callGeminiProxy({ model, contents, config });
```

`callGeminiProxy` already wraps `withRetry` with 429-aware backoff (15s → 30s → 60s for rate limits, 1s → 2s → 4s for 5xx). Every generator in `services/geminiService.ts` makes exactly one proxy call — keep it that way.

Text extraction uses `response.text` (a string property), not the old `response.response.text()`.

### AI report caching — `ensureReport()` is the only entry point

`src/services/aiReportService.ts`. Reports are cached **by fixed document ID with a fingerprint**, never by query:

```ts
const { data, fromCache, saved } = await ensureReport<MyShape>({
  uid, docId: 'cosmic-report', type: 'cosmic_analysis',
  fingerprint,                      // regeneration happens only when this changes
  normalize: raw => isValid(raw) ? raw as MyShape : null,
  generate: () => generateSomething(...),
});
```

It reads by ID (so **no composite index is involved**), dedupes concurrent callers through a module-level in-flight map that survives unmounts, strips `undefined` before writing, and persists before returning. A response failing `normalize` is shown but not cached.

Fingerprint policy in use:

- **Natal** — `birthFingerprint` (`birthTime.toISOString()_lat_lon`, 3 decimals). Cosmic Report, Sudarshana, Soul Profile, Divisional Charts, Natal Planet Insights, Muhurta. One call ever, until birth details change.
- **Current sky** — `dailyFingerprint(birthFingerprint, date)`. Daily Insights, Transit Impact. One call per day.
- **Generic** — `STATIC_FINGERPRINT`. Yoga descriptions.

Two rules learned the hard way: never put volatile values (tithi, karana, transit counts) in a fingerprint, and never hold dedupe state in a component `useRef` — tab switches unmount the component.

`savePerAccountReport` writes `type`, `cacheKey` and `createdAt` alongside the payload. Do not drop `createdAt`: `getUserReports` orders by it and Firestore silently omits documents missing the ordered field, which makes reports invisible in Journal/Archives.

Composite indexes ship separately from the app deploy:

```bash
firebase deploy --only firestore:indexes
```

### `vedic-utils.ts` — search before you write

Every client-side calculation lives in this one file. It is intentionally monolithic. Search it thoroughly before adding new astrological logic; the function you need almost certainly exists.

### `DataDashboard.tsx` — new sections go in new files

Already ~4,500 lines. New tabs and panels must be separate component files imported in, never inlined.

### Environment variables in browser code

Vite injects only `VITE_`-prefixed vars via `import.meta.env`. `process.env.*` under `src/` is always `undefined` at runtime.

### `@` alias resolves to the repo root, not `src/`

```ts
import { withRetry } from '@/src/lib/api-utils';
```

### Debug logging

`debugLog / debugWarn / debugError` from `src/lib/debug.ts`, each with a short scope tag. Suppressed in production unless `window.__SOULBLUEPRINT_DEBUG__.enable()` is called in the console.

### `manualChunks` — `node_modules` only

`vite.config.ts` splits only vendor packages. Adding `src/` files caused a circular vendor ↔ ui dependency that broke React initialization (commit 9e08eae).

### HMR is off

`hmr: false` in `vite.config.ts`, deliberately, to stop flickering during agent edits. Refresh the page manually after changes.

### StrictMode is on

`main.tsx` wraps the app in `StrictMode`, so effects run twice in dev. Guard anything expensive or billable with the dedup patterns already in `positionsService.ts` and `ensureReport()`.

---

## Working Practices

- **Plan before non-trivial work.** 3+ steps or an architectural decision → write the plan to `tasks/todo.md` as checkable items first. (`tasks/` is gitignored, so those notes stay local.)
- **Capture corrections.** After any user correction, add the pattern to `tasks/lessons.md` so it does not recur.
- **Prove it works.** No task is complete without evidence: `npm run lint`, `npm test` where relevant, and the feature exercised in the browser. State plainly what you did not verify.
- **Root causes, not patches.** No temporary fixes; minimal blast radius; new objects rather than mutation.

### Caching can mask your fix

If a Gemini-related change is not showing up in the browser, suspect a cached report before suspecting your code. Delete the relevant document under `/users/{uid}/ai_reports` or change the fingerprint.
