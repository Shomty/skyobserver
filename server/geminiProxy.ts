import express, { type NextFunction, type Request, type RequestHandler, type Response, type Router } from 'express';
import type { GenerateContentParameters, GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type { AuthUser } from './firebaseAuth.ts';
import { DAY_MS, FixedWindowCounter, MINUTE_MS, positiveInt } from './mcp/limits.ts';
import { QuotaExceededError } from './mcp/toolResult.ts';

export const ALLOWED_MODELS = ['gemini-3-flash-preview'] as const;
export const MAX_OUTPUT_TOKENS = 8192;

const MAX_TEXT = 100_000;

const textPart = z.object({ text: z.string().max(MAX_TEXT) }).strict();
const turn = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(textPart).min(1).max(8),
}).strict();

/**
 * Exactly what the app sends: text-only turns, a string system instruction and
 * a handful of generation settings. Tools, cached content, file/inline data and
 * other models are rejected, so the proxy cannot be used as a general Gemini
 * gateway even by a signed-in user.
 */
const requestSchema = z.object({
  model: z.enum(ALLOWED_MODELS),
  contents: z.union([z.string().min(1).max(MAX_TEXT * 2), z.array(turn).min(1).max(60)]),
  config: z.object({
    systemInstruction: z.string().max(MAX_TEXT).optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().int().min(1).max(100).optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    responseMimeType: z.enum(['application/json', 'text/plain']).optional(),
    responseSchema: z.record(z.string(), z.unknown()).optional(),
  }).strict().optional(),
}).strict();

export type SanitizeResult =
  | { ok: true; params: GenerateContentParameters }
  | { ok: false; error: string };

/** Validate against the allowlist and clamp the output budget. */
export function sanitizeGeminiRequest(body: unknown): SanitizeResult {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? ` at ${issue.path.join('.')}` : '';
    return { ok: false, error: `Request not allowed${where}: ${issue?.message ?? 'invalid'}` };
  }
  const { config, ...rest } = parsed.data;
  const maxOutputTokens = Math.min(config?.maxOutputTokens ?? MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS);
  return { ok: true, params: { ...rest, config: { ...config, maxOutputTokens } } as GenerateContentParameters };
}

export interface GeminiLimits {
  perUserPerMinute: number;
  /** Daily calls for accounts with a verified email (all Google sign-ins). */
  perUserPerDay: number;
  /** Daily calls for unverified email/password accounts, which are free to mint in bulk. */
  unverifiedPerDay: number;
  globalPerDay: number;
}

export function geminiLimitsFromEnv(env: NodeJS.ProcessEnv = process.env): GeminiLimits {
  return {
    perUserPerMinute: positiveInt(env.GEMINI_PER_MINUTE, 20),
    perUserPerDay: positiveInt(env.GEMINI_PER_DAY, 300),
    unverifiedPerDay: positiveInt(env.GEMINI_UNVERIFIED_PER_DAY, 30),
    globalPerDay: positiveInt(env.GEMINI_GLOBAL_PER_DAY, 5_000),
  };
}

/** Gives back everything one successful charge took — for a call that then failed. */
export type QuotaRefund = () => void;

/**
 * Per-user minute and day windows plus a global daily circuit breaker on total
 * spend. Charging is all-or-nothing; the returned function refunds the charge.
 */
export function createGeminiQuota(limits: GeminiLimits, now: () => number = Date.now) {
  const counter = new FixedWindowCounter(now);
  return (user: Pick<AuthUser, 'uid' | 'emailVerified'>): QuotaRefund => {
    const perDay = user.emailVerified ? limits.perUserPerDay : limits.unverifiedPerDay;
    const charged: Array<[string, number]> = [];
    const refund = () => charged.forEach(([key, window]) => counter.refund(key, window));
    const charge = (key: string, span: number, limit: number, message: (resetIn: number) => string) => {
      charged.push([key, counter.consume(key, span, limit, message)]);
    };
    try {
      charge(`u|${user.uid}|m`, MINUTE_MS, limits.perUserPerMinute,
        (resetIn) => `Too many AI requests — try again in ${resetIn}s.`);
      charge(`u|${user.uid}|d`, DAY_MS, perDay,
        () => user.emailVerified
          ? 'Daily AI limit reached for your account. It resets at 00:00 UTC.'
          : 'Daily AI limit reached. Verify your email address for a higher limit.');
      charge('global|d', DAY_MS, limits.globalPerDay,
        () => 'The AI service has reached its daily capacity. Please try again tomorrow.');
    } catch (error: unknown) {
      // Only the windows that were actually charged are given back.
      refund();
      throw error;
    }
    return refund;
  };
}

export interface GeminiProxyOptions {
  ai: Pick<GoogleGenAI, 'models'>;
  /** Runs before authentication — e.g. the per-IP limiter shared with /api. */
  ipLimit?: RequestHandler;
  requireUser: RequestHandler;
  limits: GeminiLimits;
  now?: () => number;
}

function log(level: 'warn' | 'error', message: string, details?: unknown): void {
  console[level](`${new Date().toISOString()} [SoulBlueprint:gemini] ${message}`, details ?? '');
}

/**
 * POST /api/gemini for the browser app. Signed-in users only, allowlisted
 * request shape, per-user and global quotas. The body is parsed only after
 * authentication.
 */
export function createGeminiProxyRouter({ ai, ipLimit, requireUser, limits, now }: GeminiProxyOptions): Router {
  const router = express.Router();
  const chargeQuota = createGeminiQuota(limits, now);
  const passThrough: RequestHandler = (_req, _res, next) => next();

  router.post('/', ipLimit ?? passThrough, requireUser, express.json({ limit: '256kb' }), async (req: Request, res: Response) => {
    const user = res.locals.user as AuthUser;
    const sanitized = sanitizeGeminiRequest(req.body);
    if ('error' in sanitized) {
      res.status(400).json({ error: sanitized.error });
      return;
    }

    let refund: QuotaRefund;
    try {
      refund = chargeQuota(user);
    } catch (error: unknown) {
      if (error instanceof QuotaExceededError) {
        res.status(429).json({ error: error.message, code: 'quota' });
        return;
      }
      throw error;
    }

    try {
      const response = await ai.models.generateContent(sanitized.params);
      res.json({ text: response.text });
    } catch (error: unknown) {
      // The client retries 429/5xx; a failed call must not eat into the quota.
      refund();
      const status = (error as { status?: number })?.status;
      log('error', 'Gemini request failed', { status, message: error instanceof Error ? error.message : String(error) });
      // Keep 429/503 so the client's backoff applies; hide SDK details otherwise.
      if (status === 429 || status === 503) {
        res.status(status).json({ error: 'The AI service is busy. Retrying shortly…' });
      } else {
        res.status(502).json({ error: 'The AI service could not complete this request.' });
      }
    }
  });

  router.use((err: { status?: number; type?: string }, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent || !err?.type?.startsWith('entity.')) {
      next(err);
      return;
    }
    res.status(err.status ?? 400).json({ error: err.status === 413 ? 'Request too large' : 'Malformed request' });
  });

  return router;
}
