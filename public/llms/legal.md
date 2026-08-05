# Legal & Data — Agent Summary

Full documents: [Privacy](https://thesoulblueprint.online/privacy) · [Terms](https://thesoulblueprint.online/terms)

**Contact:** hello@vedicsky.app  
**Legal entity name:** Vedic Sky Observer

## What we collect

- **Birth details** — date, time, place (latitude/longitude/timezone). Required for chart calculation. Many users consider this sensitive.
- **Account data** — email, authentication provider (Google or email/password) when signed in.
- **Usage** — analytics via Google Tag Manager / GA4 on public pages (deferred load).
- **Saved content** — charts, AI reports, chat messages for authenticated users in Firestore.

## How data is used

- Calculate sidereal astrological positions and generate interpretive reports.
- Persist user preferences, saved charts, and cached AI reports for signed-in users.
- Improve product via aggregated analytics (not sold as individual birth-chart data in this summary — see full privacy policy).

## Agent obligations

1. **Do not repeat** a user's full birth details in logs, summaries, or third-party tools unless the user explicitly requests it.
2. **Do not infer** identity from shared report URLs or share IDs.
3. **Direct deletion requests** to the privacy policy process (hello@vedicsky.app).
4. **Disclaim** that reports are for reflection and entertainment/coaching — not medical, legal, financial, or mental-health treatment.

## Crawl / index boundaries (`robots.txt`)

Disallowed paths (may contain user content):

- `/career/r/`, `/personal/r/`, `/daily/r/` — shared report IDs
- `/shared/` — shared AI chat exports
- `/gift/*/sent` — post-send gift pages

Public documentation for agents lives at `/llms.txt` and `/llms/*.md`.

## Terms highlights

- Users must provide accurate birth information for meaningful results.
- Account required for persistent storage and full workspace.
- Service provided as-is; astronomical calculation is best-effort with stated ephemeris sources.

For authoritative wording, always cite the live privacy and terms pages rather than this summary.
