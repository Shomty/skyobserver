# CLAUDE.md — Vedic Sky Observer (SoulBlueprint)

## Project Overview

**Vedic Sky Observer** is a real-time Sidereal Vedic astrology visualizer built for Google AI Studio. It calculates and displays planetary positions, natal/transit charts, yogas, dashas, panchang, and ashtakavarga using the Lahiri ayanamsa. Gemini AI generates personalized interpretations.

**Tech Stack:** React 19 · TypeScript 5 · Vite 6 · Tailwind CSS 4 · Firebase 12 · Express 4 · Google Generative AI · astronomy-engine · Recharts

---

## Dev Commands

```bash
npm run dev       # Start dev server (port 3000, runs server.ts via tsx)
npm run build     # Production build → dist/
npm run lint      # TypeScript type check (tsc --noEmit)
npm run clean     # Remove dist/
```

**Required env:** `GEMINI_API_KEY` — set in `.env.local` or shell before running.

---

## Critical Files

| File | Purpose |
|------|---------|
| `src/vedic-utils.ts` | **4,214 lines** — all Vedic calculations (positions, yogas, dashas, nakshatras, panchang, ashtakavarga, drishti). Search here before writing new calculations. |
| `src/App.tsx` | **1,635 lines** — main component, auth flow, view routing, state orchestration |
| `src/components/DataDashboard.tsx` | **~200 KB** — multi-tab dashboard (largest file). Extract to sub-components when adding features. |
| `src/components/SkyMap.tsx` | Sky visualization, circular and North Indian chart modes |
| `src/components/NorthIndianChart.tsx` | North Indian square chart renderer |
| `src/firebase.ts` | Firebase init, Firestore CRUD with retry logic |
| `src/services/geminiService.ts` | Gemini API calls, structured JSON output |
| `src/services/aiReportService.ts` | AI report caching with TTL |
| `src/lib/api-utils.ts` | `withRetry()`, `safeGenerateContent()`, error translation |
| `server.ts` | Express backend — geocoding proxy (Open-Meteo → Nominatim → Photon) |
| `firestore.rules` | Security rules — per-user isolation, admin override |

---

## Architecture

### Data Model (Firestore)
```
/users/{uid}
  ├── /savedCharts/{chartId}       — multiple birth charts per user
  ├── /interpretations/{interpId}  — saved AI interpretations
  ├── /ai_reports/{reportId}       — cached AI reports (TTL-based)
  └── /ai_chats/{chatId}           — Gemini chat history
```

### Key Patterns
- **Retry logic:** All Firebase and Gemini calls use exponential backoff via `withRetry()` in `src/lib/api-utils.ts`
- **Geocoding fallback:** Open-Meteo → BigDataCloud → Nominatim → Photon
- **Memoization:** Heavy `useMemo()` usage in `App.tsx` — astronomical calculations are expensive
- **Theme:** `ThemeContext.tsx` persists dark/light mode to localStorage
- **Auth:** Firebase Google OAuth + email/password; Firestore rules enforce owner-only access

### Warnings
- `vedic-utils.ts` is intentionally monolithic — search it thoroughly before adding new astrological logic
- `DataDashboard.tsx` is very large — add new tabs/sections as separate sub-components
- Firebase credentials live in `firebase-applet-config.json` — do not commit API keys to public repos
- No automated test suite exists — all verification is manual (run dev server, inspect browser)

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One focused task per subagent

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project context

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run `npm run lint`, start dev server, inspect the browser — demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing behavior — then resolve them
- Zero context switching required from the user

---

## Task Management

1. **Plan First:** Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan:** Check in before starting implementation on large changes
3. **Track Progress:** Mark items complete as you go
4. **Explain Changes:** High-level summary at each step
5. **Document Results:** Add a review section to `tasks/todo.md`
6. **Capture Lessons:** Update `tasks/lessons.md` after any corrections

---

## Core Principles

- **Simplicity First:** Make every change as simple as possible. Minimal code impact.
- **No Laziness:** Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact:** Only touch what's necessary. No side effects, no new bugs.
- **Immutability:** Always create new objects, never mutate existing ones.
- **No Test Suite (yet):** Verify manually — start dev server and exercise the changed feature in the browser before marking complete.
