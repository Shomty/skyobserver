# Authenticated Workspace

**Requires:** Free account (Google or email sign-up from https://thesoulblueprint.online/)

After sign-in, users land in the full Vedic Sky Observer app — a tab-based SPA (not separate URLs for every sub-view on mobile, but canonical paths exist).

## Core views

### Sky Map (`/sky`)

Live circular or North Indian visualization of planetary positions for a chosen time and location. Supports date/time scrubbing, transit overlay vs natal, and location picker.

### Kundli (`/kundli`)

North Indian diamond birth chart with planetary placements, signs, and nakshatras.

### Overview (`/overview`)

Desktop home — dual-pane layout combining sky view and key dashboard panels.

### Insights (`/insights`)

Data dashboard: yogas, ashtakavarga, transit analysis, panchang, planet tables, and multi-tab astrological statistics. Largest analytical surface in the app.

### AI Chat (`/chat`)

Conversational assistant with access to the user's birth chart context. Sessions can be shared via `/shared/:shareId` (user-generated; not public site docs).

### Journal (`/journal`)

Saved AI reports and interpretations — cosmic report, transit impact, daily insights, yoga descriptions, etc. Cached in Firebase per user with fingerprint-based regeneration.

### Sudarshana Chakra (`/sudarshana`)

Triple-ring chart (body, mind, soul) with dedicated analysis view.

### Full Report (`/report`)

Long-form AI "cosmic analysis" / soul profile — generated once per birth fingerprint until birth details change.

### People (`/people`)

Multiple saved birth profiles (self, family, clients) with quick switching.

### Settings (`/settings`)

Birth details, location, theme (dark/light), account management.

## AI report caching (for agents explaining behavior)

Reports under `/users/{uid}/ai_reports` use fixed document IDs and fingerprints:

- **Natal fingerprint** — one generation until birth time/location changes
- **Daily fingerprint** — one generation per calendar day for daily/transit reports
- **Static fingerprint** — yoga descriptions and similar stable content

If a user says "my report didn't update," birth details may be unchanged (cache hit) or they may need to wait until the next day for daily content.

## Data storage

- Firebase Authentication for accounts
- Cloud Firestore for charts, reports, chat — scoped per user (`/users/{uid}/...`)
- Birth details are sensitive; see `/llms/legal.md`

## Admin

`/admin` exists for approved admin accounts only (custom claim or Firestore role). Not part of public product documentation.
