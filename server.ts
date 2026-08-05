import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import {
  generateReportId,
  isValidEmail,
  isValidReportId,
  lookupCareerReportByEmail,
  readCareerReportById,
  updateCareerReportSynthesis,
  writeCareerReport,
} from './server/careerReportCache.ts';
import {
  lookupPersonalReportByEmail,
  readPersonalReportById,
  updatePersonalReportSynthesis,
  writePersonalReport,
} from './server/personalReportCache.ts';
import {
  lookupDailyReportByEmail,
  readDailyReportById,
  updateDailyReportGuidance,
  writeDailyReport,
} from './server/dailyReportCache.ts';
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

function capitalizePlanet(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function buildBirthInfoFromIso(isoDate: string, lat: number, lon: number, timezone?: string) {
  const d = new Date(isoDate);
  if (timezone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    return {
      name: 'native',
      dateOfBirth: `${get('year')}-${get('month')}-${get('day')}`,
      timeOfBirth: `${get('hour')}:${get('minute')}`,
      latitude: lat,
      longitude: lon,
      timezone,
    };
  }

  return {
    name: 'native',
    dateOfBirth: d.toISOString().slice(0, 10),
    timeOfBirth: d.toISOString().slice(11, 16),
    latitude: lat,
    longitude: lon,
    timezone: 'UTC',
  };
}

function mapVimshottariDashas(chart: VedicChartCalculations, targetDate?: Date) {
  const vimshottari = chart.dashas?.vimshottari;
  if (!vimshottari?.dashaPeriods) {
    throw new Error('Vimshottari dasha data unavailable');
  }

  const dashaPeriods = vimshottari.dashaPeriods.map((md) => ({
    planet: capitalizePlanet(md.planet),
    startDate: md.startDate,
    endDate: md.endDate,
    subPeriods: (md.subPeriods ?? []).map((ad) => ({
      planet: capitalizePlanet(ad.planet),
      startDate: ad.startDate,
      endDate: ad.endDate,
    })),
  }));

  const at = targetDate ?? new Date();
  const current = vedicCalc.getCurrentDasha(vimshottari, at);

  return {
    dashaPeriods,
    current: {
      mahadasha: current.mahaDasha
        ? {
            planet: capitalizePlanet(current.mahaDasha.planet),
            startDate: current.mahaDasha.startDate,
            endDate: current.mahaDasha.endDate,
          }
        : null,
      antardasha: current.antarDasha
        ? {
            planet: capitalizePlanet(current.antarDasha.planet),
            startDate: current.antarDasha.startDate,
            endDate: current.antarDasha.endDate,
          }
        : null,
    },
    birthNakshatra: normalizeNakshatra(chart.planets.moon.nakshatra as string),
    birthDashaLord: dashaPeriods[0]?.planet ?? '',
  };
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

function getClientIp(req: express.Request): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.length > 0) {
    return realIp.trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? '';
}

function isPrivateOrLocalIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/, '');
  if (!normalized || normalized === 'unknown') return true;
  if (normalized === '127.0.0.1' || normalized === '::1') return true;
  if (normalized.startsWith('10.') || normalized.startsWith('192.168.') || normalized.startsWith('169.254.')) {
    return true;
  }
  const parts = normalized.split('.');
  if (parts.length === 4 && parts[0] === '172') {
    const second = Number(parts[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Honor X-Forwarded-For when the app sits behind nginx or another reverse proxy.
  app.set('trust proxy', true);

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

  // Gift funnel stubs — demo fixtures, NOT a backend. They persist nothing and
  // send no email, so they must never answer production traffic: a stubbed
  // `{status:'ok'}` tells a real visitor their report is coming when no lead was
  // stored anywhere. Replace this block when the real lead/report pipeline exists.
  const GIFT_STUBS_ENABLED = process.env.NODE_ENV !== 'production';

  if (GIFT_STUBS_ENABLED) {
    // Supports ?mock=ok|duplicate|daily_cap|paused|invalid|network|expired for demos.
    const giftMockDelay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
    const giftMaskEmail = (email: string) => {
      const normalized = String(email || 'user@example.com').trim().toLowerCase();
      const [local, domain] = normalized.split('@');
      if (!local || !domain) return '***@***';
      return `${local.slice(0, 1)}***@${domain}`;
    };
    const giftMockVariant = (req: express.Request) =>
      (typeof req.query.mock === 'string' && req.query.mock) || 'ok';

    app.get('/api/gift/capacity', rateLimit, async (req, res) => {
      await giftMockDelay();
      if (giftMockVariant(req) === 'paused' || giftMockVariant(req) === 'network') {
        if (giftMockVariant(req) === 'network') {
          return res.status(503).json({ error: 'Network error (stub)' });
        }
        return res.json({
          open: false,
          paused: true,
          resumeDate: '2026-08-01',
          message: 'Registrations are paused while we catch up.',
        });
      }
      res.json({ open: true, paused: false });
    });

    app.post('/api/gift/submit', rateLimit, async (req, res) => {
      await giftMockDelay();
      const variant = giftMockVariant(req);
      if (variant === 'network') return res.status(503).json({ error: 'Network error (stub)' });
      const email = req.body?.values?.email ?? 'user@example.com';
      const maskedEmail = giftMaskEmail(email);
      if (variant === 'duplicate') return res.json({ status: 'duplicate', maskedEmail });
      if (variant === 'daily_cap') return res.json({ status: 'daily_cap' });
      if (variant === 'paused') return res.json({ status: 'paused', resumeDate: '2026-08-01' });
      if (variant === 'invalid') return res.json({ status: 'invalid', fieldErrors: { email: 'errors.email' } });
      res.json({ status: 'ok', maskedEmail });
    });

    app.post('/api/gift/suggestion', rateLimit, async (req, res) => {
      await giftMockDelay();
      if (giftMockVariant(req) === 'network') return res.status(503).json({ error: 'Network error (stub)' });
      void req.body;
      res.json({ status: 'ok' });
    });

    app.get('/api/gift/verify', rateLimit, async (req, res) => {
      await giftMockDelay();
      const variant = giftMockVariant(req);
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      if (variant === 'network') return res.status(503).json({ error: 'Network error (stub)' });
      if (variant === 'expired' || token === 'expired') return res.json({ status: 'expired' });
      if (variant === 'invalid' || !token || token === 'invalid') return res.json({ status: 'invalid' });
      res.json({ status: 'ok' });
    });
  } else {
    serverLog('warn', 'gift', 'Gift stubs disabled in production — funnel reports as paused');

    // Closed rather than broken: the wizard checks capacity on mount, so visitors
    // see the CapacityPaused screen instead of filling a form that cannot deliver.
    app.get('/api/gift/capacity', rateLimit, (_req, res) => {
      res.json({
        open: false,
        paused: true,
        message: 'Free readings are not open yet. Leave your email on the app and we will tell you when they are.',
      });
    });

    const giftUnavailable = (_req: express.Request, res: express.Response) => {
      res.status(503).json({ error: 'Gift funnel backend is not configured.' });
    };
    app.post('/api/gift/submit', rateLimit, giftUnavailable);
    app.post('/api/gift/suggestion', rateLimit, giftUnavailable);
    app.get('/api/gift/verify', rateLimit, giftUnavailable);
  }

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

  // Approximate location from client IP (fallback when browser GPS is unavailable on HTTP).
  app.get('/api/ip-location', rateLimit, async (req, res) => {
    const clientIp = getClientIp(req);
    if (isPrivateOrLocalIp(clientIp)) {
      // Localhost cannot be resolved via ip-api — return a dev default so /daily works offline.
      if (process.env.NODE_ENV !== 'production') {
        serverLog('log', 'ip-location', 'Using dev default for local IP', { clientIp });
        return res.json({
          latitude: 44.8176,
          longitude: 20.4569,
          label: 'Belgrade, Serbia',
          timezone: 'Europe/Belgrade',
          source: 'dev-default',
        });
      }
      serverLog('warn', 'ip-location', 'Skipped private or local IP', { clientIp });
      return res.status(503).json({ error: 'IP geolocation unavailable for local requests' });
    }

    try {
      const response = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(clientIp)}?fields=status,message,lat,lon,city,regionName,country`,
      );
      if (!response.ok) {
        serverLog('warn', 'ip-location', 'IP geolocation request failed', { status: response.status });
        return res.status(response.status).json({ error: 'Failed to resolve IP location' });
      }

      const data = await response.json() as {
        status?: string;
        message?: string;
        lat?: number;
        lon?: number;
        city?: string;
        regionName?: string;
        country?: string;
      };

      if (data.status !== 'success' || typeof data.lat !== 'number' || typeof data.lon !== 'number') {
        serverLog('warn', 'ip-location', 'IP geolocation returned no coordinates', { clientIp, message: data.message });
        return res.status(503).json({ error: data.message || 'IP geolocation returned no coordinates' });
      }

      const label = [data.city, data.regionName, data.country].filter(Boolean).join(', ');

      if (DEBUG_SERVER_LOGS) {
        serverLog('log', 'ip-location', 'Resolved approximate location', { clientIp, label });
      }

      // Resolve timezone via Open-Meteo so the client does not need a second geocode hop.
      let timezone: string | undefined;
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(data.city ?? 'Unknown')}&count=1`,
        );
        if (geoRes.ok) {
          const geo = await geoRes.json() as { results?: Array<{ timezone?: string }> };
          timezone = geo.results?.[0]?.timezone;
        }
      } catch {
        // Client can still resolve timezone via searchPlaces.
      }

      res.json({
        latitude: data.lat,
        longitude: data.lon,
        label: label || 'Approximate location',
        ...(timezone ? { timezone } : {}),
        source: 'ip',
      });
    } catch (e) {
      serverLog('error', 'ip-location', 'Proxy IP geolocation error', e);
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

  // Vimshottari Dasha timeline — full 120-year cycle with antardasha sub-periods
  app.post('/api/vimshottari-dashas', rateLimit, async (req, res) => {
    const { isoDate, lat, lon, timezone, targetDate } = req.body as {
      isoDate?: string;
      lat?: number;
      lon?: number;
      timezone?: string;
      targetDate?: string;
    };

    if (!isoDate || typeof isoDate !== 'string') {
      return res.status(400).json({ error: 'isoDate is required' });
    }
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    try {
      const birthInfo = buildBirthInfoFromIso(isoDate, lat, lon, timezone);
      const chart = await vedicCalc.calculateChart(birthInfo);
      const at = targetDate ? new Date(targetDate) : new Date();
      const payload = mapVimshottariDashas(chart, isNaN(at.getTime()) ? new Date() : at);

      if (DEBUG_SERVER_LOGS) {
        serverLog('log', 'vimshottari-dashas', 'Dasha timeline calculated', {
          isoDate,
          mahadashaCount: payload.dashaPeriods.length,
        });
      }

      res.json(payload);
    } catch (e: any) {
      serverLog('error', 'vimshottari-dashas', 'Dasha calculation error', e.message);
      res.status(500).json({ error: e.message || 'Dasha calculation failed' });
    }
  });

  // Career report cache — public share links at /career/r/:reportId
  app.get('/api/career/report/:reportId', rateLimit, async (req, res) => {
    const reportId = req.params.reportId ?? '';
    if (!isValidReportId(reportId)) {
      return res.status(400).json({ error: 'Invalid report id' });
    }

    try {
      const cached = await readCareerReportById(reportId);
      if (!cached) {
        return res.status(404).json({ error: 'Report not found' });
      }

      return res.json({
        reportId: cached.reportId,
        email: cached.email,
        fingerprint: cached.fingerprint,
        snapshot: cached.snapshot,
        positions: cached.positions,
        aiSynthesis: cached.aiSynthesis,
        cachedAt: cached.updatedAt,
        fullName: cached.fullName,
        birthDate: cached.birthDate,
        birthTime: cached.birthTime,
        birthPlaceLabel: cached.birthPlaceLabel,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Career report cache error';
      serverLog('error', 'career-report', 'Load failed', message);
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/career/report', rateLimit, async (req, res) => {
    const body = req.body as {
      email?: string;
      fingerprint?: string;
      reportId?: string;
      fullName?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlaceLabel?: string;
      birthInstant?: { iso: string; offsetMinutes: number };
      snapshot?: unknown;
      positions?: unknown[];
      aiSynthesis?: { text?: string; fingerprint?: string; generatedAt?: string };
    };

    const email = typeof body.email === 'string' ? body.email : '';
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (typeof body.fingerprint !== 'string' || body.fingerprint.length < 8) {
      return res.status(400).json({ error: 'fingerprint is required' });
    }

    try {
      // Save — fresh calculation (also updates email → reportId index)
      if (body.snapshot && Array.isArray(body.positions)) {
        const stored = await writeCareerReport({
          reportId: generateReportId(),
          email,
          fingerprint: body.fingerprint,
          fullName: typeof body.fullName === 'string' ? body.fullName.slice(0, 100) : undefined,
          birthDate: typeof body.birthDate === 'string' ? body.birthDate : undefined,
          birthTime: typeof body.birthTime === 'string' ? body.birthTime : undefined,
          birthPlaceLabel: typeof body.birthPlaceLabel === 'string' ? body.birthPlaceLabel.slice(0, 120) : undefined,
          birthInstant: body.birthInstant,
          snapshot: body.snapshot,
          positions: body.positions,
        });

        if (DEBUG_SERVER_LOGS) {
          serverLog('log', 'career-report', 'Report saved', { reportId: stored.reportId, email: stored.email });
        }

        return res.json({ saved: true, hit: false, reportId: stored.reportId, cachedAt: stored.updatedAt });
      }

      // Persist premium AI synthesis — email must match the report owner
      if (
        body.aiSynthesis &&
        typeof body.reportId === 'string' &&
        typeof body.aiSynthesis.text === 'string' &&
        typeof body.aiSynthesis.fingerprint === 'string'
      ) {
        const stored = await updateCareerReportSynthesis(body.reportId, email, {
          text: body.aiSynthesis.text,
          fingerprint: body.aiSynthesis.fingerprint,
          generatedAt:
            typeof body.aiSynthesis.generatedAt === 'string'
              ? body.aiSynthesis.generatedAt
              : new Date().toISOString(),
        });

        return res.json({
          saved: true,
          reportId: stored.reportId,
          aiSynthesis: stored.aiSynthesis,
          cachedAt: stored.updatedAt,
        });
      }

      // Load — return cached report when email + fingerprint match
      const lookup = await lookupCareerReportByEmail(email, body.fingerprint);
      if (lookup.hit === false) {
        return res.json({
          hit: false,
          stale: lookup.stale ?? false,
          reportId: lookup.reportId,
          cachedFingerprint: lookup.cachedFingerprint,
        });
      }

      const cached = lookup.report;
      return res.json({
        hit: true,
        reportId: cached.reportId,
        fingerprint: cached.fingerprint,
        snapshot: cached.snapshot,
        positions: cached.positions,
        aiSynthesis: cached.aiSynthesis,
        cachedAt: cached.updatedAt,
        fullName: cached.fullName,
        birthDate: cached.birthDate,
        birthTime: cached.birthTime,
        birthPlaceLabel: cached.birthPlaceLabel,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Career report cache error';
      serverLog('error', 'career-report', 'Cache operation failed', message);
      return res.status(500).json({ error: message });
    }
  });

  // Personal report cache — public share links at /personal/r/:reportId
  app.get('/api/personal/report/:reportId', rateLimit, async (req, res) => {
    const reportId = req.params.reportId ?? '';
    if (!isValidReportId(reportId)) {
      return res.status(400).json({ error: 'Invalid report id' });
    }

    try {
      const cached = await readPersonalReportById(reportId);
      if (!cached) {
        return res.status(404).json({ error: 'Report not found' });
      }

      return res.json({
        reportId: cached.reportId,
        email: cached.email,
        fingerprint: cached.fingerprint,
        snapshot: cached.snapshot,
        positions: cached.positions,
        aiSynthesis: cached.aiSynthesis,
        cachedAt: cached.updatedAt,
        fullName: cached.fullName,
        birthDate: cached.birthDate,
        birthTime: cached.birthTime,
        birthPlaceLabel: cached.birthPlaceLabel,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Personal report cache error';
      serverLog('error', 'personal-report', 'Load failed', message);
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/personal/report', rateLimit, async (req, res) => {
    const body = req.body as {
      email?: string;
      fingerprint?: string;
      reportId?: string;
      fullName?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlaceLabel?: string;
      birthInstant?: { iso: string; offsetMinutes: number };
      snapshot?: unknown;
      positions?: unknown[];
      aiSynthesis?: { text?: string; fingerprint?: string; generatedAt?: string };
    };

    const email = typeof body.email === 'string' ? body.email : '';
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (typeof body.fingerprint !== 'string' || body.fingerprint.length < 8) {
      return res.status(400).json({ error: 'fingerprint is required' });
    }

    try {
      if (body.snapshot && Array.isArray(body.positions)) {
        const stored = await writePersonalReport({
          reportId: generateReportId(),
          email,
          fingerprint: body.fingerprint,
          fullName: typeof body.fullName === 'string' ? body.fullName.slice(0, 100) : undefined,
          birthDate: typeof body.birthDate === 'string' ? body.birthDate : undefined,
          birthTime: typeof body.birthTime === 'string' ? body.birthTime : undefined,
          birthPlaceLabel: typeof body.birthPlaceLabel === 'string' ? body.birthPlaceLabel.slice(0, 120) : undefined,
          birthInstant: body.birthInstant,
          snapshot: body.snapshot,
          positions: body.positions,
        });

        if (DEBUG_SERVER_LOGS) {
          serverLog('log', 'personal-report', 'Report saved', { reportId: stored.reportId, email: stored.email });
        }

        return res.json({ saved: true, hit: false, reportId: stored.reportId, cachedAt: stored.updatedAt });
      }

      if (
        body.aiSynthesis &&
        typeof body.reportId === 'string' &&
        typeof body.aiSynthesis.text === 'string' &&
        typeof body.aiSynthesis.fingerprint === 'string'
      ) {
        const stored = await updatePersonalReportSynthesis(body.reportId, email, {
          text: body.aiSynthesis.text,
          fingerprint: body.aiSynthesis.fingerprint,
          generatedAt:
            typeof body.aiSynthesis.generatedAt === 'string'
              ? body.aiSynthesis.generatedAt
              : new Date().toISOString(),
        });

        return res.json({
          saved: true,
          reportId: stored.reportId,
          aiSynthesis: stored.aiSynthesis,
          cachedAt: stored.updatedAt,
        });
      }

      const lookup = await lookupPersonalReportByEmail(email, body.fingerprint);
      if (lookup.hit === false) {
        return res.json({
          hit: false,
          stale: lookup.stale ?? false,
          reportId: lookup.reportId,
          cachedFingerprint: lookup.cachedFingerprint,
        });
      }

      const cached = lookup.report;
      return res.json({
        hit: true,
        reportId: cached.reportId,
        fingerprint: cached.fingerprint,
        snapshot: cached.snapshot,
        positions: cached.positions,
        aiSynthesis: cached.aiSynthesis,
        cachedAt: cached.updatedAt,
        fullName: cached.fullName,
        birthDate: cached.birthDate,
        birthTime: cached.birthTime,
        birthPlaceLabel: cached.birthPlaceLabel,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Personal report cache error';
      serverLog('error', 'personal-report', 'Cache operation failed', message);
      return res.status(500).json({ error: message });
    }
  });

  // Daily report cache — public share links at /daily/r/:reportId
  app.get('/api/daily/report/:reportId', rateLimit, async (req, res) => {
    const reportId = req.params.reportId ?? '';
    if (!isValidReportId(reportId)) {
      return res.status(400).json({ error: 'Invalid report id' });
    }

    try {
      const cached = await readDailyReportById(reportId);
      if (!cached) {
        return res.status(404).json({ error: 'Report not found' });
      }

      return res.json({
        reportId: cached.reportId,
        email: cached.email,
        fingerprint: cached.fingerprint,
        snapshot: cached.snapshot,
        positions: cached.positions,
        aiGuidance: cached.aiGuidance,
        cachedAt: cached.updatedAt,
        fullName: cached.fullName,
        birthDate: cached.birthDate,
        birthTime: cached.birthTime,
        birthPlaceLabel: cached.birthPlaceLabel,
        currentPlaceLabel: cached.currentPlaceLabel,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Daily report cache error';
      serverLog('error', 'daily-report', 'Load failed', message);
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/daily/report', rateLimit, async (req, res) => {
    const body = req.body as {
      email?: string;
      fingerprint?: string;
      reportId?: string;
      fullName?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlaceLabel?: string;
      currentPlaceLabel?: string;
      birthInstant?: { iso: string; offsetMinutes: number };
      snapshot?: unknown;
      positions?: unknown[];
      aiGuidance?: { guidance?: unknown; fingerprint?: string; generatedAt?: string };
    };

    const email = typeof body.email === 'string' ? body.email : '';
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const isGuidanceOnly =
      body.aiGuidance &&
      typeof body.reportId === 'string' &&
      typeof body.aiGuidance.fingerprint === 'string';
    if (!isGuidanceOnly && (typeof body.fingerprint !== 'string' || body.fingerprint.length < 8)) {
      return res.status(400).json({ error: 'fingerprint is required' });
    }

    try {
      if (body.snapshot && Array.isArray(body.positions)) {
        const stored = await writeDailyReport({
          reportId: generateReportId(),
          email,
          fingerprint: body.fingerprint,
          fullName: typeof body.fullName === 'string' ? body.fullName.slice(0, 100) : undefined,
          birthDate: typeof body.birthDate === 'string' ? body.birthDate : undefined,
          birthTime: typeof body.birthTime === 'string' ? body.birthTime : undefined,
          birthPlaceLabel: typeof body.birthPlaceLabel === 'string' ? body.birthPlaceLabel.slice(0, 120) : undefined,
          currentPlaceLabel: typeof body.currentPlaceLabel === 'string' ? body.currentPlaceLabel.slice(0, 120) : undefined,
          birthInstant: body.birthInstant,
          snapshot: body.snapshot,
          positions: body.positions,
        });

        if (DEBUG_SERVER_LOGS) {
          serverLog('log', 'daily-report', 'Report saved', { reportId: stored.reportId, email: stored.email });
        }

        return res.json({ saved: true, hit: false, reportId: stored.reportId, cachedAt: stored.updatedAt });
      }

      if (
        body.aiGuidance &&
        typeof body.reportId === 'string' &&
        typeof body.aiGuidance.fingerprint === 'string' &&
        body.aiGuidance.guidance
      ) {
        const stored = await updateDailyReportGuidance(body.reportId, email, {
          guidance: body.aiGuidance.guidance,
          fingerprint: body.aiGuidance.fingerprint,
          generatedAt:
            typeof body.aiGuidance.generatedAt === 'string'
              ? body.aiGuidance.generatedAt
              : new Date().toISOString(),
        });

        return res.json({
          saved: true,
          reportId: stored.reportId,
          aiGuidance: stored.aiGuidance,
          cachedAt: stored.updatedAt,
        });
      }

      const lookup = await lookupDailyReportByEmail(email, body.fingerprint);
      if (lookup.hit === false) {
        return res.json({
          hit: false,
          stale: lookup.stale ?? false,
          reportId: lookup.reportId,
          cachedFingerprint: lookup.cachedFingerprint,
        });
      }

      const cached = lookup.report;
      return res.json({
        hit: true,
        reportId: cached.reportId,
        fingerprint: cached.fingerprint,
        snapshot: cached.snapshot,
        positions: cached.positions,
        aiGuidance: cached.aiGuidance,
        cachedAt: cached.updatedAt,
        fullName: cached.fullName,
        birthDate: cached.birthDate,
        birthTime: cached.birthTime,
        birthPlaceLabel: cached.birthPlaceLabel,
        currentPlaceLabel: cached.currentPlaceLabel,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Daily report cache error';
      serverLog('error', 'daily-report', 'Cache operation failed', message);
      return res.status(500).json({ error: message });
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
