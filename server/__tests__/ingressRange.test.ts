import { describe, expect, it } from 'vitest';
import { assertIngressRange, InvalidIngressRangeError, MAX_INGRESS_RANGE_DAYS } from '../ingressRange.ts';

const DAY_MS = 86_400_000;
const start = new Date('2026-01-01T00:00:00Z');
const after = (days: number) => new Date(start.getTime() + days * DAY_MS);

describe('assertIngressRange', () => {
  it('accepts the ranges the app and MCP tools request', () => {
    expect(() => assertIngressRange(start, after(120))).not.toThrow();
    expect(() => assertIngressRange(start, after(365))).not.toThrow();
    expect(() => assertIngressRange(start, start)).not.toThrow();
  });

  it('accepts exactly the maximum span', () => {
    expect(() => assertIngressRange(start, after(MAX_INGRESS_RANGE_DAYS))).not.toThrow();
  });

  it('rejects a span longer than the maximum', () => {
    expect(() => assertIngressRange(start, after(MAX_INGRESS_RANGE_DAYS + 1))).toThrow(InvalidIngressRangeError);
    expect(() => assertIngressRange(new Date('0001-01-01'), new Date('9999-01-01'))).toThrow(InvalidIngressRangeError);
  });

  it('rejects a reversed range', () => {
    expect(() => assertIngressRange(after(10), start)).toThrow(InvalidIngressRangeError);
  });

  it('rejects invalid dates', () => {
    expect(() => assertIngressRange(new Date('nope'), start)).toThrow(InvalidIngressRangeError);
    expect(() => assertIngressRange(start, new Date(Number.NaN))).toThrow(InvalidIngressRangeError);
  });
});
