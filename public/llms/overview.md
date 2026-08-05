# Soul Blueprint — Overview

**Site:** https://thesoulblueprint.online  
**Product names:** Soul Blueprint (public brand), Vedic Sky Observer (legal/product name)  
**Tagline:** Birth-chart insights in plain language

## What it does

Soul Blueprint helps people understand life patterns through sidereal (Vedic) astrology. The site has two layers:

1. **Public free calculators** — Instant AI-assisted reports from birth date, time, and place. No account required.
2. **Private workspace** — After sign-in, a full observatory: live sky map, North Indian chart (kundli), transit insights, Vimshottari dashas, divisional charts, panchang, AI chat grounded in the user's chart, and saved profiles.

Interpretation is written in accessible language; underlying positions are computed astronomically, not guessed.

## Calculation approach

| Layer | Engine | Used for |
|-------|--------|----------|
| Server | Swiss Ephemeris (`openastrology-library`) | High-precision sidereal positions, Vimshottari dashas, transit ingresses |
| Client | `astronomy-engine` + `vedic-utils` | Yogas, nakshatras, panchang, ashtakavarga, drishti, divisional charts, most dashboard math |

**Ayanamsa:** Lahiri (standard sidereal offset for Vedic work).

**AI:** Gemini generates interpretive text via a server-side proxy (`/api/gemini`). API keys never ship to the browser.

## Terminology (for agents)

| Term | Meaning |
|------|---------|
| Kundli / birth chart | Planetary positions at birth, North Indian diamond layout |
| Nakshatra | Lunar mansion (27 divisions) |
| Dashas | Vimshottari planetary periods — life chapters |
| Panchang | Daily calendar: tithi, nakshatra, yoga, karana |
| Transit | Current sky relative to natal chart |
| Rashi | Sign (12 sidereal signs) |
| Sudarshana Chakra | Triple-wheel chart (body, mind, soul rings) |

## Public routes (indexable)

| Path | Purpose |
|------|---------|
| `/` | Homepage, sign-in/sign-up entry |
| `/career` | Free career path report |
| `/personal` | Free personality blueprint |
| `/daily` | Free daily energy / 7-day forecast |
| `/gift` | Gift a reading to someone |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

## Authenticated routes (sign-in required)

| Path | Label | Purpose |
|------|-------|---------|
| `/sky` | Sky Map | Circular or North Indian live sky visualizer |
| `/kundli` | Kundli | Natal chart view |
| `/overview` | Overview | Desktop dual-pane dashboard home |
| `/insights` | Insights | Data dashboard — yogas, transits, stats |
| `/journal` | Journal | Saved AI reports and interpretations |
| `/chat` | AI Chat | Chart-aware conversational assistant |
| `/sudarshana` | Sudarshana Chakra | Triple-ring chart analysis |
| `/report` | Full Report | Cosmic / soul profile AI report |
| `/people` | People | Multiple saved birth profiles |
| `/settings` | Settings | Account and birth details |

## What agents should not do

- Do not fabricate chart positions; direct users to the calculators or authenticated app.
- Do not expose or infer other users' birth data from shared report URLs unless the user explicitly provides that URL.
- Do not claim tropical (Western sun-sign) equivalence unless the user asks for a comparison.
