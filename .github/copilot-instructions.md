# Copilot Instructions — Vedic Sky Observer (SoulBlueprint)

## Dev Commands

```bash
npm run dev       # Start dev server on http://localhost:3000 (runs server.ts via tsx)
npm run build     # Production build → dist/ (prebuild generates firebase config)
npm run lint      # TypeScript type check (tsc --noEmit) — no test suite exists
npm run clean     # Remove dist/
```

**Required env:** `GEMINI_API_KEY` in `.env.local`. Also set `EPHE_PATH` pointing to Swiss Ephemeris `.se1` files in `ephe/`.

Verify changes manually: run `npm run dev`, open the browser, and exercise the changed feature. No automated test suite exists.

---

## Architecture

This is a **React SPA + Express backend** served from a single `server.ts` process. In development, Vite middleware is mounted inside Express. In production, Express serves the `dist/` static build.

```
server.ts              ← Express: serves Vite dev middleware or dist/, proxies Gemini API,
                          wraps openastrology-library (native addon — server-side only)
src/
  vedic-utils.ts       ← 4,000+ line monolith: ALL Vedic calculations live here
  App.tsx              ← Top-level auth flow, view routing, expensive useMemo calculations
  components/
    DataDashboard.tsx  ← ~200 KB multi-tab dashboard (largest file in the project)
    SkyMap.tsx         ← Sky visualizer (circular + North Indian modes)
  services/
    geminiService.ts   ← AI prompt construction; always calls callGeminiProxy()
    aiReportService.ts ← AI report caching with TTL + validity checks
  lib/
    api-utils.ts       ← withRetry(), callGeminiProxy(), safeGenerateContent()
    debug.ts           ← Scoped debug logger
  context/
    ThemeContext.tsx    ← Dark/light mode, persisted to localStorage
```

**Firestore data model** — all data is scoped under `/users/{uid}`:
```
/users/{uid}
  /savedCharts/{chartId}        — multiple birth charts per user
  /interpretations/{interpId}   — saved AI interpretations
  /ai_reports/{reportId}        — cached AI reports (TTL-based)
  /ai_chats/{chatId}            — Gemini chat history
  /chat_sessions/{sessionId}/messages/{messageId}
```

**`v2/`** is a separate standalone build with its own `vite.config.ts` and `tsconfig.json`. Use `npm run v2:dev` / `v2:build` / `v2:lint` for it.

---

## Key Conventions

### Gemini API — always use the backend proxy
Never instantiate `GoogleGenAI` in browser-side code (`src/`). The API key must stay server-side.

```ts
// ✅ Correct — goes through server.ts /api/gemini route
import { callGeminiProxy } from '../lib/api-utils';
const text = await callGeminiProxy({ model, contents, config });

// ❌ Wrong — leaks key into browser bundle
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
```

### Retry all Firebase and Gemini calls
Wrap with `withRetry()` from `src/lib/api-utils.ts`. It does exponential backoff and retries on transient errors (network, 429, 5xx). For Gemini, use `callGeminiProxy()` which already wraps with retry.

### AI report cache validation
Always validate cached values before trusting them. A poisoned cache (stale/invalid content written from a bug) will silently serve bad data until TTL expires.

```ts
// Always guard both save and read with a validity check
if (isValidAiResponse(result)) await saveAIReport(uid, key, result);
const cached = await getCachedReport(uid, key);
if (cached && isValidAiResponse(cached)) return cached;
```

### Environment variables in browser code
Vite only injects `VITE_`-prefixed vars into the browser bundle via `import.meta.env`. Never use `process.env.*` in `src/` — it will be `undefined` at runtime.

```ts
// ✅ Browser-safe
import.meta.env.VITE_SOMETHING

// ❌ Always undefined in browser
process.env.GEMINI_API_KEY
```

### `openastrology-library` is server-side only
It wraps a native C++ addon (`swisseph`). Importing it anywhere under `src/` will crash the browser app. It is used exclusively in `server.ts` via `createRequire`.

### `@` path alias resolves to project root
`@/` maps to the repository root (not `src/`), per `tsconfig.json` and `vite.config.ts`.

```ts
import { withRetry } from '@/src/lib/api-utils'; // resolves to ./src/lib/api-utils
```

### Debug logging
Use `debugLog / debugWarn / debugError` from `src/lib/debug.ts` with a short scope tag. Logs are suppressed in production unless `window.__SOULBLUEPRINT_DEBUG__.enable()` is called in the browser console.

```ts
import { debugLog, debugWarn, debugError } from '../lib/debug';
debugLog('myScope', 'doing thing', { detail });
```

### `manualChunks` — only for `node_modules`
The Vite build splits only `node_modules` packages into named chunks. Never add `src/` files to `manualChunks` — it caused a circular vendor ↔ ui dependency that broke React initialization (commit 9e08eae).

### Vedic calculations — search `vedic-utils.ts` first
All Vedic math (positions, yogas, dashas, nakshatras, panchang, ashtakavarga, drishti) lives in `src/vedic-utils.ts`. Search it thoroughly before writing new calculations.

### `DataDashboard.tsx` — add new tabs as sub-components
The file is already very large. New tabs or sections must be implemented as separate component files imported into the dashboard, not inlined.

### Firestore security rules
Every document write must include `uid == request.auth.uid`. The rules in `firestore.rules` enforce per-user isolation; the admin override uses a custom `admin: true` claim on the Firebase Auth token.

---

## Common Pitfalls

- **HMR is disabled** in `vite.config.ts` (`hmr: false`) to prevent flickering during agent edits — page must be refreshed manually after changes.
- **Firebase credentials** live in `firebase-applet-config.json` — do not commit real keys; use `firebase-applet-config.example.json` as the template.
- **Cached AI reports** can mask code fixes. If a Gemini-related change isn't reflected in the browser, suspect a stale cached value.
- **`@google/genai` text extraction:** use `response.text` (string), not `response.response.text()` (old SDK pattern).
