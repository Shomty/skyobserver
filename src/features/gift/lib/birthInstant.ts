/**
 * Wall-clock birth time + IANA zone -> absolute UTC instant.
 *
 * The Jyotish engine (`calculatePositions(date, lat, lon)`) needs a real instant.
 * A birth date and time on their own are ambiguous by up to a full day, and the
 * report is generated later in a backend job where the visitor's browser
 * timezone no longer exists — so the funnel has to resolve the instant here,
 * while it still knows the birth location.
 *
 * Pure: no React, no browser APIs beyond `Intl`, so the backend can import it.
 */

export interface BirthInstant {
  /** Absolute instant, ISO-8601 with `Z`. */
  iso: string;
  /** Zone offset in minutes east of UTC at that instant (Belgrade in June = 120). */
  offsetMinutes: number;
}

/**
 * Offset of `timeZone` from UTC, in minutes, at a given instant.
 * Uses tzdata via `Intl`, so historical rules apply — a 1985 Belgrade birth gets
 * 1985's DST rules, not today's.
 */
export function zoneOffsetMinutes(instant: Date, timeZone: string): number | null {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(instant);
  } catch {
    // RangeError for an unknown zone identifier.
    return null;
  }

  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const raw = parts.find((p) => p.type === type)?.value;
    return raw === undefined ? Number.NaN : Number(raw);
  };

  const year = read('year');
  const month = read('month');
  const day = read('day');
  // Some ICU builds emit hour 24 for midnight under hour12:false.
  const hour = read('hour') === 24 ? 0 : read('hour');
  const minute = read('minute');
  const second = read('second');

  if ([year, month, day, hour, minute, second].some(Number.isNaN)) return null;

  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return (asUtc - instant.getTime()) / 60000;
}

/**
 * Resolve a local wall-clock reading in `timeZone` to a UTC instant.
 *
 * Two passes: the first guesses using the offset at the naive instant, the
 * second corrects it using the offset at the candidate instant. That settles
 * DST boundaries, where the offset before and after the transition differ.
 *
 * @param dateIso `YYYY-MM-DD`
 * @param timeHhMm `HH:MM` (24-hour)
 */
export function resolveBirthInstant(
  dateIso: string,
  timeHhMm: string,
  timeZone: string
): BirthInstant | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeHhMm);
  if (!dateMatch || !timeMatch) return null;

  const [, y, m, d] = dateMatch;
  const [, hh, mm] = timeMatch;

  // Treat the wall clock as if it were UTC, then shift by the zone's offset.
  const naive = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));

  const firstOffset = zoneOffsetMinutes(new Date(naive), timeZone);
  if (firstOffset === null) return null;

  const candidate = naive - firstOffset * 60000;
  const secondOffset = zoneOffsetMinutes(new Date(candidate), timeZone);
  if (secondOffset === null) return null;

  const instant = new Date(naive - secondOffset * 60000);
  if (Number.isNaN(instant.getTime())) return null;

  return { iso: instant.toISOString(), offsetMinutes: secondOffset };
}
