/**
 * Transit-ingress search is synchronous native work whose cost grows with the
 * span searched, so an unbounded range can stall the whole Node process.
 * Two years covers every caller (the app asks for ~120 days, MCP ≤ 365).
 */
export const MAX_INGRESS_RANGE_DAYS = 731;

const DAY_MS = 86_400_000;

/** A caller-supplied range that will not be computed; maps to HTTP 400. */
export class InvalidIngressRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIngressRangeError';
  }
}

/** Throws InvalidIngressRangeError unless `start..end` is a valid, bounded range. */
export function assertIngressRange(start: Date, end: Date): void {
  const from = start.getTime();
  const to = end.getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new InvalidIngressRangeError('Invalid startDate or endDate');
  }
  if (to < from) {
    throw new InvalidIngressRangeError('endDate must not be before startDate');
  }
  if (to - from > MAX_INGRESS_RANGE_DAYS * DAY_MS) {
    throw new InvalidIngressRangeError(`Date range must not exceed ${MAX_INGRESS_RANGE_DAYS} days`);
  }
}
