# SoulBlueprint MCP connector

A remote [Model Context Protocol](https://modelcontextprotocol.io) server that lets a client's AI tools use the SoulBlueprint Vedic engine. It provides:

- **raw calculations** (`get_*`), for the client's own model to interpret
- **finished reports** (`generate_*`), written by SoulBlueprint's Gemini prompts

The server is stateless. Birth data comes in with each call and is never stored. Logs record client, tool, duration and outcome only.

- **Endpoint:** `POST https://<your-domain>/mcp` (Streamable HTTP, JSON responses)
- **Auth:** `Authorization: Bearer <api key>`

## Issuing a key (operator)

```bash
node scripts/create-mcp-key.js acme
```

The script prints the key once; send it to the client securely. It also prints an `acme:<sha256>` entry. Append that entry to `MCP_API_KEYS` (comma-separated) in the server environment, then restart. To revoke a key, remove its entry and restart.

Optional limits, applied per client:

| Variable | Default | Meaning |
|---|---|---|
| `MCP_CALC_PER_MINUTE` | 120 | `get_*` / `find_place` calls per minute |
| `MCP_REPORTS_PER_DAY` | 50 | `generate_*` calls per UTC day. Cache hits and failed generations are free. |

If `MCP_API_KEYS` is unset, `/mcp` answers 503.

## Connecting (client)

**Claude Code**

```bash
claude mcp add --transport http soulblueprint https://<your-domain>/mcp \
  --header "Authorization: Bearer <api key>"
```

**Claude Desktop, Cursor and other config-file clients**

```json
{
  "mcpServers": {
    "soulblueprint": {
      "type": "http",
      "url": "https://<your-domain>/mcp",
      "headers": { "Authorization": "Bearer <api key>" }
    }
  }
}
```

**Claude API (MCP connector)**

```json
"mcp_servers": [{
  "type": "url",
  "url": "https://<your-domain>/mcp",
  "name": "soulblueprint",
  "authorization_token": "<api key>"
}]
```

> Custom connectors added through the Claude.ai web UI authenticate with OAuth, not static headers. Supporting them needs an OAuth layer, which this server does not have yet.

## Input

Every chart tool takes the same moment fields:

| Field | Example | Notes |
|---|---|---|
| `date` | `1990-01-01` | Local date |
| `time` | `12:00` | Local 24-hour time |
| `place` | `Belgrade, Serbia` | Geocoded; or give `latitude` + `longitude` |
| `timezone` | `Europe/Belgrade` | Optional; resolved from the location, with historical DST |

## Tools

| Tool | Returns |
|---|---|
| `find_place` | Candidate places with coordinates and IANA timezone |
| `get_birth_chart` | Ascendant + nine grahas (sign, degree, nakshatra/pada, house, dignity, retro/combust), Gulika, Maandi |
| `get_vimshottari_dashas` | Active MD/AD/PD at `at` (default now) and the Mahadasha timeline |
| `get_yogas` | Detected yogas with strength and dasha activation |
| `get_panchang` | Tithi, vara, nakshatra, yoga, karana |
| `get_ashtakavarga` | BAV per planet, SAV, reductions |
| `get_divisional_chart` | Any varga `D1`…`D60` |
| `get_special_points` | Chara karakas, Arudha/Upapada, special lagnas |
| `get_transits` | Transit positions with their natal house, natal contacts, events, ingresses over `days` |
| `generate_career_report` | AI career reading. `style`: `consultation` or `plain` |
| `generate_personal_report` | AI personal guidance (structured sections) |
| `generate_year_report` | AI year-ahead reading |
| `generate_daily_report` | AI daily guidance. `focus`: `day` or `transits`; optional `currentPlace` |

Report tools accept `fullName` and `includeSnapshot` (which returns the structured reading behind the text).

Calculation conventions: sidereal zodiac, Lahiri ayanamsa, whole-sign houses, Swiss Ephemeris.

## Resources and prompts

- `soulblueprint://rules/reading` is the reading methodology the client's model should follow.
- `soulblueprint://reference/{signs,nakshatras,houses,divisional-charts}` are reference tables.
- Prompts `natal_reading`, `career_reading` and `year_ahead` walk the client's model through the right tool calls.

## Testing locally

```bash
node scripts/create-mcp-key.js localtest      # copy the entry into MCP_API_KEYS in .env.local
npm run dev
npx @modelcontextprotocol/inspector           # Streamable HTTP → http://localhost:3000/mcp + Bearer header
npx vitest run server/                        # auth, limits, cache, golden chart values, HTTP endpoint
```
