import { QuotaExceededError } from './toolResult.ts';

export type ToolKind = 'calc' | 'report';

export interface UsageLimits {
  /** Calculation tool calls per client per minute. */
  calcPerMinute: number;
  /** Gemini-backed report generations per client per UTC day (cache hits are free). */
  reportsPerDay: number;
}

interface Window {
  start: number;
  count: number;
}

export const MINUTE_MS = 60_000;
export const DAY_MS = 86_400_000;

export function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function limitsFromEnv(env: NodeJS.ProcessEnv = process.env): UsageLimits {
  return {
    calcPerMinute: positiveInt(env.MCP_CALC_PER_MINUTE, 120),
    reportsPerDay: positiveInt(env.MCP_REPORTS_PER_DAY, 50),
  };
}

/**
 * Fixed-window counters keyed by arbitrary strings, in memory (single-process
 * server). Windows align to the epoch, so day windows start at 00:00 UTC.
 */
export class FixedWindowCounter {
  private readonly windows = new Map<string, Window>();

  constructor(private readonly now: () => number = Date.now) {}

  /**
   * Count `units` against `key`, or throw `QuotaExceededError` with
   * `message(resetInSeconds)` when they do not all fit in the window. Returns
   * the window start (for `refund`).
   */
  consume(
    key: string,
    spanMs: number,
    limit: number,
    message: (resetInSeconds: number) => string,
    units = 1,
  ): number {
    const t = this.now();
    const start = t - (t % spanMs);
    const current = this.windows.get(key);
    const window = current && current.start === start ? current : { start, count: 0 };
    if (window.count + units > limit) {
      throw new QuotaExceededError(message(Math.ceil((start + spanMs - t) / 1000)));
    }
    this.windows.set(key, { start, count: window.count + units });
    this.prune(t);
    return start;
  }

  /** Give back `units`, but only while the window they were charged to is still current. */
  refund(key: string, chargedWindow: number, units = 1): void {
    const current = this.windows.get(key);
    if (current && current.start === chargedWindow && current.count > 0) {
      this.windows.set(key, { ...current, count: Math.max(0, current.count - units) });
    }
  }

  private lastPrune = 0;

  /** Drop windows older than a day, at most once a minute, so idle keys do not accumulate. */
  private prune(t: number): void {
    if (t - this.lastPrune < MINUTE_MS) return;
    this.lastPrune = t;
    for (const [key, window] of this.windows) {
      if (t - window.start > DAY_MS) this.windows.delete(key);
    }
  }
}

/** Per-client limits for the MCP connector. */
export class UsageLimiter {
  private readonly counter: FixedWindowCounter;

  constructor(
    private readonly limits: UsageLimits,
    now: () => number = Date.now,
  ) {
    this.counter = new FixedWindowCounter(now);
  }

  /** Count one call; returns the window it was charged to (for `refund`). */
  consume(clientId: string, kind: ToolKind): number {
    return kind === 'calc'
      ? this.counter.consume(`${clientId}|calc`, MINUTE_MS, this.limits.calcPerMinute,
        (resetIn) => `Rate limit reached (${this.limits.calcPerMinute} calculation calls/minute). Retry in ${resetIn}s.`)
      : this.counter.consume(`${clientId}|report`, DAY_MS, this.limits.reportsPerDay,
        () => `Daily report quota reached (${this.limits.reportsPerDay}/day). Resets at 00:00 UTC.`);
  }

  /**
   * Give back a unit consumed for work that then failed. Only applies while the
   * window it was charged to is still current — a refund after midnight must
   * not discount the new day.
   */
  refund(clientId: string, kind: ToolKind, chargedWindow: number): void {
    this.counter.refund(`${clientId}|${kind}`, chargedWindow);
  }
}
