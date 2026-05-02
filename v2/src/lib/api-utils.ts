import { debugError, debugLog, debugWarn } from './debug';

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
    shouldRetry = (err) => {
      // Common transient error patterns
      const msg = String(err?.message || err).toLowerCase();
      return (
        err.code === 'unavailable' || 
        err.code === 'resource-exhausted' ||
        msg.includes('unavailable') || 
        msg.includes('timeout') || 
        msg.includes('network') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        err.status === 429 ||
        err.status >= 500
      );
    }
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
  
  const msg = String(error?.message || error).toLowerCase();
  
  if (msg.includes("quota exceeded") || msg.includes("rate limit") || error.status === 429) {
    return "API limit reached. Please wait a moment before trying again.";
  }
  
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Network error. Please check your internet connection.";
  }
  
  if (msg.includes("unavailable") || error.status >= 500) {
    return "Service temporarily unavailable. Our celestial servers are recalibrating.";
  }

  if (msg.includes("permission") || msg.includes("insufficient")) {
    return "Permissions error. Please make sure you are logged in correctly.";
  }

  if (msg.includes("invalid_argument") || msg.includes("contents is not specified") || error.status === 400) {
    return "There was a problem with the request format. Please try again.";
  }

  return error?.message || "An unexpected error occurred.";
}

/**
 * Calls the backend Gemini proxy endpoint.
 * Keeps the API key server-side only.
 */
export async function callGeminiProxy(params: Record<string, unknown>): Promise<string> {
  return withRetry(
    async () => {
      debugLog('gemini', 'Sending proxy request', {
        model: params.model,
        hasConfig: Boolean(params.config),
      });

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        const error: any = new Error(err.error || 'Gemini API error');
        error.status = res.status;
        debugError('gemini', 'Proxy request failed', { status: res.status, error: err.error });
        throw error;
      }
      const data = await res.json();
      debugLog('gemini', 'Proxy response received', {
        textLength: typeof data.text === 'string' ? data.text.length : 0,
      });
      return data.text as string;
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
