import { describe, expect, it } from 'vitest';
import { FixedWindowCounter, limitsFromEnv, UsageLimiter } from '../limits.ts';
import { QuotaExceededError } from '../toolResult.ts';

const DAY = 86_400_000;

describe('UsageLimiter', () => {
  it('allows calculation calls up to the per-minute limit, then resets next minute', () => {
    let t = 1_000_000_020_000;
    const limiter = new UsageLimiter({ calcPerMinute: 2, reportsPerDay: 10 }, () => t);
    limiter.consume('a', 'calc');
    limiter.consume('a', 'calc');
    expect(() => limiter.consume('a', 'calc')).toThrow(QuotaExceededError);
    t += 60_000;
    expect(() => limiter.consume('a', 'calc')).not.toThrow();
  });

  it('tracks clients and kinds independently', () => {
    const limiter = new UsageLimiter({ calcPerMinute: 1, reportsPerDay: 1 }, () => 0);
    limiter.consume('a', 'calc');
    expect(() => limiter.consume('b', 'calc')).not.toThrow();
    expect(() => limiter.consume('a', 'report')).not.toThrow();
    expect(() => limiter.consume('a', 'report')).toThrow(/Daily report quota/);
  });

  it('resets the report quota at UTC midnight', () => {
    let t = 10 * DAY + DAY - 1;
    const limiter = new UsageLimiter({ calcPerMinute: 1, reportsPerDay: 1 }, () => t);
    limiter.consume('a', 'report');
    expect(() => limiter.consume('a', 'report')).toThrow(QuotaExceededError);
    t += 1;
    expect(() => limiter.consume('a', 'report')).not.toThrow();
  });

  it('refund returns a consumed unit within the same window', () => {
    const limiter = new UsageLimiter({ calcPerMinute: 1, reportsPerDay: 1 }, () => 0);
    const window = limiter.consume('a', 'report');
    limiter.refund('a', 'report', window);
    expect(() => limiter.consume('a', 'report')).not.toThrow();
  });

  it('a refund after the window rolled over does not discount the new window', () => {
    let t = 10 * DAY + DAY - 1;
    const limiter = new UsageLimiter({ calcPerMinute: 1, reportsPerDay: 1 }, () => t);
    const window = limiter.consume('a', 'report');
    t += 1;
    limiter.consume('a', 'report');
    limiter.refund('a', 'report', window);
    expect(() => limiter.consume('a', 'report')).toThrow(QuotaExceededError);
  });
});

describe('limitsFromEnv', () => {
  it('uses defaults and ignores invalid values', () => {
    expect(limitsFromEnv({})).toEqual({ calcPerMinute: 120, reportsPerDay: 50 });
    expect(limitsFromEnv({ MCP_CALC_PER_MINUTE: '-3', MCP_REPORTS_PER_DAY: 'abc' }))
      .toEqual({ calcPerMinute: 120, reportsPerDay: 50 });
    expect(limitsFromEnv({ MCP_CALC_PER_MINUTE: '30', MCP_REPORTS_PER_DAY: '5' }))
      .toEqual({ calcPerMinute: 30, reportsPerDay: 5 });
  });
});

describe('FixedWindowCounter units', () => {
  it('consumes and refunds several units at once, all-or-nothing', () => {
    const counter = new FixedWindowCounter(() => 0);
    const msg = () => 'full';
    const w = counter.consume('k', DAY, 3, msg, 2);
    expect(() => counter.consume('k', DAY, 3, msg, 2)).toThrow('full');
    counter.consume('k', DAY, 3, msg, 1);
    expect(() => counter.consume('k', DAY, 3, msg, 1)).toThrow('full');
    counter.refund('k', w, 2);
    expect(() => counter.consume('k', DAY, 3, msg, 2)).not.toThrow();
  });
});
