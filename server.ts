import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';
// openastrology-library's .mjs build uses `import * as swisseph` which doesn't
// work for a native CJS addon. Load the CJS build explicitly via createRequire.
import type { VedicChartCalculations, Planet } from 'openastrology-library';
const _require = createRequire(import.meta.url);
const { VedicAstrologyCalculator, VedicTransitCalculator } = _require('openastrology-library') as typeof import('openastrology-library');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ServerLogLevel = 'log' | 'warn' | 'error';
const DEBUG_SERVER_LOGS = process.env.DEBUG_SERVER_LOGS === '1';

function serverLog(level: ServerLogLevel, scope: string, message: string, details?: unknown) {
  const prefix = `${new Date().toISOString()} [SoulBlueprint:${scope}] ${message}`;
  if (details === undefined) {
    console[level](prefix);
    return;
  }

  console[level](prefix, details);
}

// ---------------------------------------------------------------------------
// Swiss Ephemeris planet position calculator (singleton)
// ---------------------------------------------------------------------------

const localEphePath = path.resolve(__dirname, 'ephe');
const bundledEphePath = path.resolve(__dirname, 'node_modules/swisseph/ephe');
const EPHE_PATH = process.env.EPHE_PATH
  || (existsSync(localEphePath) ? localEphePath : bundledEphePath);

const vedicCalc = new VedicAstrologyCalculator({
  ayanamsa: 'lahiri',
  houseSystem: 'wholehouse',
  ephePath: EPHE_PATH,
});

const transitCalc = new VedicTransitCalculator({
  ayanamsa: 'lahiri',
  ephePath: EPHE_PATH,
});

const ALL_VEDIC_PLANETS: Planet[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

// Planet metadata for mapping library output → app PlanetPosition
const PLANET_META: Record<string, { symbol: string; color: string }> = {
  Sun:       { symbol: '☉', color: '#FFD700' },
  Moon:      { symbol: '☽', color: '#F0F8FF' },
  Mars:      { symbol: '♂', color: '#FF4500' },
  Mercury:   { symbol: '☿', color: '#00CED1' },
  Jupiter:   { symbol: '♃', color: '#DAA520' },
  Venus:     { symbol: '♀', color: '#FF69B4' },
  Saturn:    { symbol: '♄', color: '#708090' },
  Rahu:      { symbol: '☊', color: '#8A2BE2' },
  Ketu:      { symbol: '☋', color: '#A9A9A9' },
  Ascendant: { symbol: 'ASC', color: '#10B981' },
};

const PLANET_ORDER = ['Ascendant', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// Convert library nakshatra key (underscore/lowercase) to app title-case name
function normalizeNakshatra(n: string): string {
  const MAP: Record<string, string> = { moola: 'Mula' };
  if (MAP[n]) return MAP[n];
  return n.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Capitalize first letter of zodiac sign
function capitalizeSign(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Map a VedicChartCalculations → app PlanetPosition[] format
function mapChartToPositions(chart: VedicChartCalculations, includeAscendant: boolean) {
  const { ayanamsa } = chart;
  const result: Array<Record<string, unknown>> = [];

  // Add planets in consistent order
  const PLANET_KEYS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;

  for (const key of PLANET_KEYS) {
    const p = chart.planets[key];
    if (!p) continue;
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    const meta = PLANET_META[name];
    const siderealLon = ((p.longitude % 360) + 360) % 360;

    result.push({
      name,
      symbol: meta?.symbol ?? name,
      longitude: (siderealLon + ayanamsa + 360) % 360, // tropical
      siderealLongitude: siderealLon,
      rashi: capitalizeSign(p.sign),
      nakshatra: normalizeNakshatra(p.nakshatra as string),
      pada: p.pada,
      degree: p.degreeDMS.degrees,
      minute: p.degreeDMS.minutes,
      isRetrograde: p.isRetrograde,
      isCombust: p.isCombust,
      color: meta?.color ?? '#FFFFFF',
      dignity: p.dignity ?? undefined,
      house: p.house ?? undefined,
    });
  }

  // Ascendant (only when location was supplied)
  if (includeAscendant) {
    const asc = chart.ascendant;
    const siderealLon = ((asc.longitude % 360) + 360) % 360;
    const nakshatraIdx = Math.floor(siderealLon / (360 / 27));
    const NAKSHATRAS = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
      'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
    ];
    const degInNak = siderealLon % (360 / 27);
    const pada = Math.floor(degInNak / (360 / (27 * 4))) + 1;
    const ascEntry = {
      name: 'Ascendant',
      symbol: 'ASC',
      longitude: (siderealLon + ayanamsa + 360) % 360,
      siderealLongitude: siderealLon,
      rashi: capitalizeSign(asc.sign),
      nakshatra: NAKSHATRAS[nakshatraIdx] ?? normalizeNakshatra(asc.nakshatra as string),
      pada,
      degree: asc.degree,
      minute: 0, // ascendant degree from library is fractional — extract minutes below
      isRetrograde: false,
      isCombust: false,
      color: '#10B981',
    };
    // Extract minutes from the fractional degree
    const fracDeg = siderealLon % 30;
    ascEntry.degree = Math.floor(fracDeg);
    ascEntry.minute = Math.floor((fracDeg % 1) * 60);
    result.unshift(ascEntry);
  }

  return result;
}

// Validate required env vars at startup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  serverLog('error', 'startup', 'GEMINI_API_KEY environment variable is not set.');
  serverLog('error', 'startup', 'Copy .env.example to .env.local and fill in your key.');
  process.exit(1);
}

// Simple in-memory rate limiter: max 300 requests per IP per 15 minutes.
// The app makes ~1 transit position/min + birth positions + geocode calls, so
// 60/15min (4/min) was far too restrictive and caused cascading 429 errors.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const max = 300;

  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + window });
    return next();
  }
  if (entry.count >= max) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  entry.count++;
  next();
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '2mb' }));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      next();
      return;
    }

    const startedAt = Date.now();
    if (DEBUG_SERVER_LOGS) {
      serverLog('log', 'http', `${req.method} ${req.path} started`, {
        hasQuery: Object.keys(req.query).length > 0,
        hasBody: typeof req.body === 'object' && req.body !== null ? Object.keys(req.body).length > 0 : false,
      });
    }

    res.on('finish', () => {
      if (DEBUG_SERVER_LOGS || res.statusCode >= 400) {
        const level: ServerLogLevel = res.statusCode >= 400 ? 'warn' : 'log';
        serverLog(level, 'http', `${req.method} ${req.path} completed`, {
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        });
      }
    });

    next();
  });

  // Health check (required by PaaS platforms)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Proxy for Geocoding (Open-Meteo)
  app.get('/api/geocode', rateLimit, async (req, res) => {
    const { name } = req.query;
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 200) {
      serverLog('warn', 'geocode', 'Rejected invalid location query');
      return res.status(400).json({ error: 'Invalid location name' });
    }
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`);
      if (response.ok) {
        if (DEBUG_SERVER_LOGS) {
          serverLog('log', 'geocode', 'Open-Meteo geocoding succeeded');
        }
        res.json(await response.json());
      } else {
        serverLog('warn', 'geocode', 'Open-Meteo geocoding failed', { status: response.status });
        res.status(response.status).json({ error: 'Failed to fetch from Open-Meteo' });
      }
    } catch (e) {
      serverLog('error', 'geocode', 'Proxy geocoding error', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Proxy for Reverse Geocoding
  app.get('/api/reverse-geocode', rateLimit, async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      serverLog('warn', 'reverse-geocode', 'Rejected invalid reverse geocode query');
      return res.status(400).json({ error: 'Lat and Lon are required' });
    }

    try {
      const bdcResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (bdcResponse.ok) {
        if (DEBUG_SERVER_LOGS) {
          serverLog('log', 'reverse-geocode', 'BigDataCloud reverse geocoding succeeded');
        }
        return res.json(await bdcResponse.json());
      }

      const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: { 'User-Agent': 'VedicSkyObserver/1.0' }
      });
      if (nominatimResponse.ok) {
        if (DEBUG_SERVER_LOGS) {
          serverLog('log', 'reverse-geocode', 'Nominatim reverse geocoding fallback succeeded');
        }
        res.json(await nominatimResponse.json());
      } else {
        serverLog('warn', 'reverse-geocode', 'Reverse geocoding services failed', { status: nominatimResponse.status });
        res.status(nominatimResponse.status).json({ error: 'Failed to fetch from reverse geocoding services' });
      }
    } catch (e) {
      serverLog('error', 'reverse-geocode', 'Proxy reverse geocoding error', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Swiss Ephemeris planet positions — high-precision Vedic calculations
  app.post('/api/planet-positions', rateLimit, async (req, res) => {
    const { isoDate, lat, lon } = req.body as { isoDate?: string; lat?: number; lon?: number };
    if (!isoDate || typeof isoDate !== 'string') {
      return res.status(400).json({ error: 'isoDate is required' });
    }

    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Invalid isoDate' });
      }

      const hasLocation = typeof lat === 'number' && typeof lon === 'number';
      const birthInfo = {
        name: 'transit',
        dateOfBirth: d.toISOString().slice(0, 10),  // YYYY-MM-DD (UTC)
        timeOfBirth: d.toISOString().slice(11, 16),  // HH:MM (UTC)
        latitude: hasLocation ? lat : 0,
        longitude: hasLocation ? lon : 0,
        timezone: 'UTC',
      };

      const chart = await vedicCalc.calculateChart(birthInfo);
      const positions = mapChartToPositions(chart, hasLocation);

      if (DEBUG_SERVER_LOGS) {
        serverLog('log', 'planet-positions', 'Positions calculated', { isoDate, hasLocation });
      }
      res.json(positions);
    } catch (e: any) {
      serverLog('error', 'planet-positions', 'Position calculation error', e.message);
      res.status(500).json({ error: e.message || 'Position calculation failed' });
    }
  });

  // Swiss Ephemeris transit-ingress engine — exact sign-change timestamps
  app.post('/api/transit-ingresses', rateLimit, async (req, res) => {
    const { startDate, endDate, planets } = req.body as { startDate?: string; endDate?: string; planets?: string[] };
    if (!startDate || typeof startDate !== 'string' || !endDate || typeof endDate !== 'string') {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate or endDate' });
      }

      const requestedPlanets = Array.isArray(planets) && planets.length > 0
        ? planets.filter((p): p is Planet => ALL_VEDIC_PLANETS.includes(p as Planet))
        : ALL_VEDIC_PLANETS;

      const ingresses = transitCalc.calculateTransitIngresses(requestedPlanets, start, end);

      if (DEBUG_SERVER_LOGS) {
        serverLog('log', 'transit-ingresses', 'Ingresses calculated', { startDate, endDate, count: ingresses.length });
      }
      res.json(ingresses);
    } catch (e: any) {
      serverLog('error', 'transit-ingresses', 'Transit ingress calculation error', e.message);
      res.status(500).json({ error: e.message || 'Transit ingress calculation failed' });
    }
  });

  // Gemini AI proxy — keeps API key server-side only
  app.post('/api/gemini', rateLimit, async (req, res) => {
    try {
      serverLog('log', 'gemini', 'Forwarding Gemini request', { model: req.body?.model });
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent(req.body);
      serverLog('log', 'gemini', 'Gemini request succeeded', {
        model: req.body?.model,
        textLength: response.text?.length ?? 0,
      });
      res.json({ text: response.text });
    } catch (e: any) {
      serverLog('error', 'gemini', 'Gemini proxy error', e.message);
      res.status(e.status || 500).json({ error: e.message || 'Gemini API error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // acceptRanges: false prevents browsers from caching partial 206 responses
    // which can cause blank pages on first load of large JS bundles.
    app.use(express.static(distPath, { acceptRanges: false }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    serverLog('log', 'startup', `Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    serverLog('log', 'shutdown', 'Shutting down server...');
    vedicCalc.dispose();
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Catch unhandled errors
  process.on('uncaughtException', (error) => {
    serverLog('error', 'runtime', 'Uncaught Exception', error);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    serverLog('error', 'runtime', 'Unhandled Rejection', reason);
    process.exit(1);
  });
}

startServer().catch((error) => {
  serverLog('error', 'startup', 'Failed to start server', error);
  process.exit(1);
});
