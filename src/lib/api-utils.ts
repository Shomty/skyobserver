import { debugError, debugLog, debugWarn } from './debug';

/** Transient failures worth retrying: network blips, rate limits, 5xx. */
export function isTransientError(err: any): boolean {
  if (err?.noRetry) return false;
  const msg = String(err?.message || err).toLowerCase();
  return (
    err?.code === 'unavailable' ||
    err?.code === 'resource-exhausted' ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    err?.status === 429 ||
    err?.status >= 500
  );
}

/**
 * Generic retry wrapper for any asynchronous function.
 * `delay` can be a fixed number (ms) or a function (attempt, err) → ms
 * for error-specific backoff strategies.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number | ((attempt: number, err: any) => number);
    onRetry?: (error: any, attempt: number) => void;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const { 
    retries = 3, 
    delay = 1000, 
    onRetry, 
    shouldRetry = isTransientError,
  } = options;

  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      if (i < retries - 1 && shouldRetry(err)) {
        onRetry?.(err, i + 1);
        const waitMs = typeof delay === 'function'
          ? delay(i + 1, err)
          : delay * Math.pow(2, i); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Human-readable error extractor
 */
export function getErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred.";

  const code = typeof error?.code === 'string' ? error.code : '';
  const status = typeof error?.status === 'number' ? error.status : undefined;
  const msg = String(error?.message || error).toLowerCase();

  if (code === 'permission-denied' || code === 'PERMISSION_DENIED') {
    return "Access denied by security rules. You are signed in, but this action is not allowed. If this persists after a deploy, check Firestore rules for the path being written.";
  }

  if (msg.includes("quota exceeded") || msg.includes("rate limit") || status === 429) {
    return "API limit reached. Please wait a moment before trying again.";
  }

  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Network error. Please check your internet connection.";
  }

  if (code === 'unavailable' || msg.includes("unavailable") || (status !== undefined && status >= 500)) {
    return "Service temporarily unavailable. Our celestial servers are recalibrating.";
  }

  // Auth-related permission failures (not Firestore rules authz)
  if (code === 'unauthenticated' || msg.includes("insufficient")) {
    return "Permissions error. Please make sure you are logged in correctly.";
  }

  if (
    code === 'invalid-argument' ||
    msg.includes("invalid_argument") ||
    msg.includes("contents is not specified") ||
    status === 400
  ) {
    return "There was a problem with the request format. Please try again.";
  }

  return error?.message || "An unexpected error occurred.";
}

/**
 * An oversized request can leave Gemini generating until the connection dies,
 * which surfaces as a spinner that never resolves. Abort well before that so
 * callers get a real error they can report or retry.
 */
const GEMINI_TIMEOUT_MS = 90_000;

/**
 * Sends one Gemini request and resolves to the response text. Errors should
 * carry a numeric `status` so 429s get the long backoff.
 */
export type GeminiTransport = (
  params: Record<string, unknown>,
  signal: AbortSignal,
) => Promise<string>;

/** Thrown when an AI feature needs a signed-in user. Never retried. */
export class AuthRequiredError extends Error {
  readonly noRetry = true;
  readonly status = 401;

  constructor(message = 'Sign in to unlock your AI interpretation.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export function isAuthRequiredError(error: unknown): boolean {
  return error instanceof AuthRequiredError || (error as { name?: string } | null)?.name === 'AuthRequiredError';
}

type IdTokenProvider = () => Promise<string | null>;
let getIdToken: IdTokenProvider | null = null;

/**
 * Browser only: supply the signed-in user's Firebase ID token. /api/gemini
 * rejects anonymous calls, so without a token the request is not even sent.
 * Kept as an injection point so this module stays free of Firebase imports
 * (the Node server imports it too).
 */
export function configureGeminiAuth(provider: IdTokenProvider): void {
  getIdToken = provider;
}

/** Browser default: POST to the server's /api/gemini proxy. */
const proxyTransport: GeminiTransport = async (params, signal) => {
  const token = getIdToken ? await getIdToken() : null;
  if (!token) throw new AuthRequiredError();

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    if (res.status === 401) throw new AuthRequiredError(err.error);
    const error: any = new Error(err.error || 'Gemini API error');
    error.status = res.status;
    // A daily quota or a rejected request will not succeed on retry.
    error.noRetry = err.code === 'quota' || res.status === 400;
    debugError('gemini', 'Proxy request failed', { status: res.status, error: err.error });
    throw error;
  }
  const data = await res.json();
  return data.text as string;
};

let activeTransport: GeminiTransport = proxyTransport;

/**
 * Server-side only: route callGeminiProxy straight to the Gemini SDK instead
 * of the relative /api/gemini URL, which does not exist outside a browser.
 * Lets the feature generators run unchanged inside the Node process.
 */
export function configureGeminiTransport(transport: GeminiTransport): void {
  activeTransport = transport;
}

/**
 * Calls the backend Gemini proxy endpoint.
 * Keeps the API key server-side only.
 */
export async function callGeminiProxy(
  params: Record<string, unknown>,
  options: { timeoutMs?: number } = {},
): Promise<string> {
  const { timeoutMs = GEMINI_TIMEOUT_MS } = options;

  return withRetry(
    async () => {
      debugLog('gemini', 'Sending proxy request', {
        model: params.model,
        hasConfig: Boolean(params.config),
      });

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let text: string;
      try {
        text = await activeTransport(params, controller.signal);
      } catch (err: any) {
        // Deliberately not phrased with the word "timeout": shouldRetry treats
        // that as transient, and re-issuing a request that is too large to
        // complete would only stall again.
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          const aborted: any = new Error(
            `The celestial intelligence took longer than ${Math.round(timeoutMs / 1000)}s to respond. Please try again.`,
          );
          aborted.isTimeout = true;
          debugError('gemini', 'Proxy request aborted', { timeoutMs });
          throw aborted;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }

      debugLog('gemini', 'Proxy response received', {
        textLength: typeof text === 'string' ? text.length : 0,
      });
      return text;
    },
    {
      retries: 4,
      // 429 rate-limit: wait 15s → 30s → 60s before retrying
      // 5xx server errors: wait 1s → 2s → 4s
      delay: (attempt, err) =>
        err?.status === 429
          ? Math.min(15_000 * Math.pow(2, attempt - 1), 90_000)
          : Math.min(1_000 * Math.pow(2, attempt - 1), 8_000),
      onRetry: (err, attempt) => {
        const waitSec = err?.status === 429
          ? Math.min(15 * Math.pow(2, attempt - 1), 90)
          : Math.min(Math.pow(2, attempt - 1), 8);
        debugWarn('gemini', `Retrying proxy request after attempt ${attempt} (waiting ${waitSec}s)`, err.message);
      },
    }
  );
}

/**
 * Specifically for Gemini AI calls using @google/genai SDK
 */
export async function safeGenerateContent(
  genAI: any,
  params: {
    model: string;
    contents: any[];
    config?: any;
    generationConfig?: any;
    [key: string]: any;
  },
  retries = 2
): Promise<any> {
  return withRetry(
    () => genAI.models.generateContent(params),
    {
      retries,
      onRetry: (err, attempt) => {
        debugWarn('gemini', `Retrying direct Gemini request after attempt ${attempt}`, err.message);
      }
    }
  );
}
