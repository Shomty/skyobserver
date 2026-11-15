import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env
import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import {
  generateReportId,
  isValidEmail,
  isValidReportId,
  lookupCareerReportByEmail,
  readCareerReportById,
  updateCareerReportPlainSynthesis,
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
  updateDailyReportTransitGuidance,
  writeDailyReport,
} from './server/dailyReportCache.ts';
import {
  isValidEmail as isValidYearEmail,
  isValidReportId as isValidYearReportId,
  lookupYearReportByEmail,
  readYearReportById,
  updateYearReportSynthesis,
  writeYearReport,
} from './server/yearReportCache.ts';
import { GoogleGenAI } from '@google/genai';
import {
  computeDashas,
  computePositions,
  computeTransitIngresses,
  disposeEphemeris,
  fetchTimezoneForCoords,
} from './server/ephemeris.ts';
import { installServerRuntime } from './server/runtime.ts';
import { InvalidIngressRangeError } from './server/ingressRange.ts';
import { createMcpRouter } from './server/mcp/router.ts';
import {
  type AuthUser,
  createFirebaseTokenVerifier,
  createOptionalFirebaseUser,
  createRequireFirebaseUser,
  isVerifiedEmailOwner,
  resolveFirebaseProjectId,
} from './server/firebaseAuth.ts';
import type { EmailIndexPolicy } from './server/emailIndex.ts';
import { createGeminiProxyRouter, geminiLimitsFromEnv } from './server/geminiProxy.ts';
import { createAiWriteGuard } from './server/aiWriteGuard.ts';

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

/**
 * Number of reverse-proxy hops in front of the app (nginx in front of pm2).
 * Express then reads the client IP from the entry that hop appended to
 * X-Forwarded-For, so a client cannot spoof `req.ip` by sending its own header.
 * Set TRUST_PROXY_HOPS=0 when the app is reached directly.
 */
function trustProxyHops(raw: string | undefined): number {
  const parsed = Number(raw ?? '1');
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 1;
}

function getClientIp(req: express.Request): string {
  return req.ip ?? req.socket.remoteAddress ?? '';
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
  app.set('trust proxy', trustProxyHops(process.env.TRUST_PROXY_HOPS));

  // Gzip/deflate every text-based response (JS/CSS/HTML/JSON) — the built
  // assets were being served completely uncompressed, which dominated load
  // time on mobile networks far more than any client-side rendering cost.
  app.use(compression());

  // MCP connector for API clients — Bearer API key auth, its own body parser
  // and per-client limits live inside the router, so it is mounted before the
  // global JSON parser and outside the per-IP browser rate limit.
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  installServerRuntime(ai);
  app.use('/mcp', createMcpRouter());

  // Browser Gemini proxy — signed-in users only, allowlisted request shape,
  // per-user and global quotas. Parses its own (smaller) body after auth.
  const verifyFirebaseToken = createFirebaseTokenVerifier(resolveFirebaseProjectId());
  const requireUser = createRequireFirebaseUser(verifyFirebaseToken);
  const optionalUser = createOptionalFirebaseUser(verifyFirebaseToken);
  // Only the verified owner of an email may repoint its cached report; anyone
  // else can claim an email that has no report yet, never replace one.
  const indexPolicyFor = (res: express.Response, email: string): EmailIndexPolicy =>
    isVerifiedEmailOwner(res.locals.user as AuthUser | undefined, email) ? 'overwrite' : 'claim-if-absent';
  app.use('/api/gemini', createGeminiProxyRouter({ ai, ipLimit: rateLimit, requireUser, limits: geminiLimitsFromEnv() }));
  const guardAiWrites = createAiWriteGuard(requireUser);

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
  const SITE_URL = (process.env.VITE_SITE_URL ?? process.env.SITE_URL ?? 'https://thesoulblueprint.online').replace(/\/$/, '');
  const PUBLIC_SITEMAP_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/career', changefreq: 'weekly', priority: '0.9' },
    { path: '/personal', changefreq: 'weekly', priority: '0.9' },
    { path: '/daily', changefreq: 'daily', priority: '0.9' },
    { path: '/year', changefreq: 'weekly', priority: '0.9' },
    { path: '/gift', changefreq: 'monthly', priority: '0.7' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
    { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  ];

  app.get('/sitemap.xml', (_req, res) => {
    const lastmod = new Date().toISOString().slice(0, 10);
    const urls = PUBLIC_SITEMAP_ROUTES.map(
      (route) => `  <url>
    <loc>${SITE_URL}${route.path === '/' ? '/' : route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
    ).join('\n');

    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`,
    );
  });

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

    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    try {
      const timezone = await fetchTimezoneForCoords(latitude, longitude);

      const bdcResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
      if (bdcResponse.ok) {
        if (DEBUG_SERVER_LOGS) {
          serverLog('log', 'reverse-geocode', 'BigDataCloud reverse geocoding succeeded');
        }
        const body = await bdcResponse.json() as Record<string, unknown>;
        return res.json({ ...body, ...(timezone ? { timezone } : {}) });
      }

      const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
        headers: { 'User-Agent': 'VedicSkyObserver/1.0' }
      });
      if (nominatimResponse.ok) {
        if (DEBUG_SERVER_LOGS) {
          serverLog('log', 'reverse-geocode', 'Nominatim reverse geocoding fallback succeeded');
        }
        const body = await nominatimResponse.json() as Record<string, unknown>;
        return res.json({ ...body, ...(timezone ? { timezone } : {}) });
      }
      serverLog('warn', 'reverse-geocode', 'Reverse geocoding services failed', { status: nominatimResponse.status });
      res.status(nominatimResponse.status).json({ error: 'Failed to fetch from reverse geocoding services' });
    } catch (e) {
      serverLog('error', 'reverse-geocode', 'Proxy reverse geocoding error', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // IANA timezone from coordinates — used by GPS/IP location on /daily.
  app.get('/api/timezone', rateLimit, async (req, res) => {
    const { lat, lon } = req.query;
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'Valid lat and lon are required' });
    }

    try {
      const timezone = await fetchTimezoneForCoords(latitude, longitude);
      if (!timezone) {
        return res.status(503).json({ error: 'Timezone lookup failed' });
      }
      res.json({ timezone, latitude, longitude });
    } catch (e) {
      serverLog('error', 'timezone', 'Timezone lookup error', e);
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

      const timezone = await fetchTimezoneForCoords(data.lat, data.lon);

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
      const positions = await computePositions(d, lat, lon);

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
      const at = targetDate ? new Date(targetDate) : new Date();
      const payload = await computeDashas(isoDate, lat, lon, timezone, at);

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
        fingerprint: cached.fingerprint,
        snapshot: cached.snapshot,
        positions: cached.positions,
        aiSynthesis: cached.aiSynthesis,
        aiPlainSynthesis: cached.aiPlainSynthesis,
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

  app.post('/api/career/report', rateLimit, optionalUser, guardAiWrites, async (req, res) => {
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
      aiPlainSynthesis?: { text?: string; fingerprint?: string; generatedAt?: string };
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
        }, indexPolicyFor(res, email));

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

      // Persist plain-English AI synthesis — email must match the report owner
      if (
        body.aiPlainSynthesis &&
        typeof body.reportId === 'string' &&
        typeof body.aiPlainSynthesis.text === 'string' &&
        typeof body.aiPlainSynthesis.fingerprint === 'string'
      ) {
        const stored = await updateCareerReportPlainSynthesis(body.reportId, email, {
          text: body.aiPlainSynthesis.text,
          fingerprint: body.aiPlainSynthesis.fingerprint,
          generatedAt:
            typeof body.aiPlainSynthesis.generatedAt === 'string'
              ? body.aiPlainSynthesis.generatedAt
              : new Date().toISOString(),
        });

        return res.json({
          saved: true,
          reportId: stored.reportId,
          aiPlainSynthesis: stored.aiPlainSynthesis,
          cachedAt: stored.updatedAt,
        });
      }

      // Load — return cached report when email + fingerprint match
      const lookup = await lookupCareerReportByEmail(email, body.fingerprint);
      if (lookup.hit === false) {
        return res.json({
          hit: false,
          stale: lookup.stale ?? false,
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
        aiPlainSynthesis: cached.aiPlainSynthesis,
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

  app.post('/api/personal/report', rateLimit, optionalUser, guardAiWrites, async (req, res) => {
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
        }, indexPolicyFor(res, email));

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
        fingerprint: cached.fingerprint,
        snapshot: cached.snapshot,
        positions: cached.positions,
        aiGuidance: cached.aiGuidance,
        aiTransitGuidance: cached.aiTransitGuidance,
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

  app.post('/api/daily/report', rateLimit, optionalUser, guardAiWrites, async (req, res) => {
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
      aiTransitGuidance?: { guidance?: unknown; fingerprint?: string; generatedAt?: string };
    };

    const email = typeof body.email === 'string' ? body.email : '';
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const isGuidanceOnly =
      (body.aiGuidance || body.aiTransitGuidance) &&
      typeof body.reportId === 'string' &&
      ((body.aiGuidance && typeof body.aiGuidance.fingerprint === 'string') ||
        (body.aiTransitGuidance && typeof body.aiTransitGuidance.fingerprint === 'string'));
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
        }, indexPolicyFor(res, email));

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

      if (
        body.aiTransitGuidance &&
        typeof body.reportId === 'string' &&
        typeof body.aiTransitGuidance.fingerprint === 'string' &&
        body.aiTransitGuidance.guidance
      ) {
        const stored = await updateDailyReportTransitGuidance(body.reportId, email, {
          guidance: body.aiTransitGuidance.guidance,
          fingerprint: body.aiTransitGuidance.fingerprint,
          generatedAt:
            typeof body.aiTransitGuidance.generatedAt === 'string'
              ? body.aiTransitGuidance.generatedAt
              : new Date().toISOString(),
        });

        return res.json({
          saved: true,
          reportId: stored.reportId,
          aiTransitGuidance: stored.aiTransitGuidance,
          cachedAt: stored.updatedAt,
        });
      }

      const lookup = await lookupDailyReportByEmail(email, body.fingerprint);
      if (lookup.hit === false) {
        return res.json({
          hit: false,
          stale: lookup.stale ?? false,
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
        aiTransitGuidance: cached.aiTransitGuidance,
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

  // Year horoscope cache — public share links at /year/r/:reportId
  app.get('/api/year/report/:reportId', rateLimit, async (req, res) => {
    const reportId = req.params.reportId ?? '';
    if (!isValidYearReportId(reportId)) {
      return res.status(400).json({ error: 'Invalid report id' });
    }
    try {
      const cached = await readYearReportById(reportId);
      if (!cached) return res.status(404).json({ error: 'Report not found' });
      return res.json({
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
      const message = e instanceof Error ? e.message : 'Year report cache error';
      serverLog('error', 'year-report', 'Load failed', message);
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/year/report', rateLimit, optionalUser, guardAiWrites, async (req, res) => {
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
    if (!isValidYearEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const isSynthesisOnly =
      body.aiSynthesis &&
      typeof body.reportId === 'string' &&
      typeof body.aiSynthesis.fingerprint === 'string' &&
      typeof body.aiSynthesis.text === 'string';

    if (!isSynthesisOnly && (typeof body.fingerprint !== 'string' || body.fingerprint.length < 8)) {
      return res.status(400).json({ error: 'fingerprint is required' });
    }

    try {
      if (body.snapshot && Array.isArray(body.positions) && typeof body.fingerprint === 'string') {
        const stored = await writeYearReport({
          email,
          fingerprint: body.fingerprint,
          fullName: typeof body.fullName === 'string' ? body.fullName.slice(0, 100) : undefined,
          birthDate: typeof body.birthDate === 'string' ? body.birthDate : undefined,
          birthTime: typeof body.birthTime === 'string' ? body.birthTime : undefined,
          birthPlaceLabel: typeof body.birthPlaceLabel === 'string' ? body.birthPlaceLabel.slice(0, 120) : undefined,
          birthInstant: body.birthInstant,
          snapshot: body.snapshot,
          positions: body.positions,
        }, indexPolicyFor(res, email));
        return res.json({ saved: true, hit: false, reportId: stored.reportId, cachedAt: stored.updatedAt });
      }

      if (isSynthesisOnly && body.aiSynthesis && typeof body.reportId === 'string') {
        const stored = await updateYearReportSynthesis(body.reportId, email, {
          text: body.aiSynthesis.text ?? '',
          fingerprint: body.aiSynthesis.fingerprint ?? '',
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

      if (typeof body.fingerprint !== 'string') {
        return res.status(400).json({ error: 'fingerprint is required' });
      }

      const lookup = await lookupYearReportByEmail(email, body.fingerprint);
      if (lookup.hit === false) {
        return res.json({
          hit: false,
          stale: lookup.stale ?? false,
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
      const message = e instanceof Error ? e.message : 'Year report cache error';
      serverLog('error', 'year-report', 'Cache operation failed', message);
      return res.status(500).json({ error: message });
    }
  });

  // Swiss Ephemeris transit-ingress engine — exact sign-change timestamps
  app.post('/api/transit-ingresses', rateLimit, async (req, res) => {
    const { startDate, endDate, planets } = req.body as { startDate?: string; endDate?: string; planets?: unknown };
    if (!startDate || typeof startDate !== 'string' || !endDate || typeof endDate !== 'string') {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    if (planets !== undefined && (!Array.isArray(planets) || planets.length > 20 || !planets.every((p) => typeof p === 'string'))) {
      return res.status(400).json({ error: 'planets must be an array of planet names' });
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate or endDate' });
      }

      const ingresses = computeTransitIngresses(start, end, planets as string[] | undefined);

      if (DEBUG_SERVER_LOGS) {
        serverLog('log', 'transit-ingresses', 'Ingresses calculated', { startDate, endDate, count: ingresses.length });
      }
      res.json(ingresses);
    } catch (e: unknown) {
      if (e instanceof InvalidIngressRangeError) {
        return res.status(400).json({ error: e.message });
      }
      serverLog('error', 'transit-ingresses', 'Transit ingress calculation error', e instanceof Error ? e.message : e);
      res.status(500).json({ error: 'Transit ingress calculation failed' });
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
    app.use(express.static(distPath, {
      acceptRanges: false,
      // Vite fingerprints every file under /assets with a content hash, so
      // it is safe to cache those responses forever — a new deploy produces
      // new filenames. Everything else (notably index.html, which references
      // the current hashes) must always be revalidated.
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }));
    app.get('*', (_req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    serverLog('log', 'startup', `Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    serverLog('log', 'shutdown', 'Shutting down server...');
    disposeEphemeris();
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
