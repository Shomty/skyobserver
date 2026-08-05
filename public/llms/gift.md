# Gift a Reading

**URL:** https://thesoulblueprint.online/gift

Users can send a sidereal birth-chart reading as a gift — a thoughtful link the recipient opens to receive their report.

## Flow (high level)

1. **Chooser** (`/gift`) — Pick report type (aligned with career, personal, or daily themes).
2. **Wizard** (`/gift/:slug`) — Giver enters recipient details and message; completes the gift flow.
3. **Recipient** — Opens gift link, verifies email if required (`/gift/verify`), receives report.

## Routes

| Path | Purpose |
|------|---------|
| `/gift` | Gift type chooser |
| `/gift/:slug` | Gift wizard for a specific report type |
| `/gift/:slug/sent` | Post-send redirect (not indexed) |
| `/gift/verify` | Email verification step |

## Agent notes

- Gift flows may collect recipient email and birth details — handle as personal data.
- `/gift/*/sent` paths are disallowed in `robots.txt`.
- Production gift API behavior depends on server configuration; do not assume demo/stub responses in production.

## Related free reports

Gift readings draw on the same astrological engine as the free calculators documented in `/llms/free-reports.md`.
