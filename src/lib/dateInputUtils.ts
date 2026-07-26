/** Local-time helpers — keep picker output aligned with existing chart calculations. */

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Same shape as `<input type="datetime-local" />` value strings (local time). */
export function toDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Parse datetime-local value or ISO fragment as local time (matches native input behaviour). */
export function fromDateTimeLocalValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function mergeDatePart(base: Date, year: number, month: number, day: number): Date {
  const next = new Date(base);
  next.setFullYear(year, month, day);
  return next;
}

export function mergeTimePart(base: Date, hours: number, minutes: number): Date {
  const next = new Date(base);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function clampMinutes(minutes: number): number {
  return Math.max(0, Math.min(59, minutes));
}

export function clampHours(hours: number): number {
  return Math.max(0, Math.min(23, hours));
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr) return null;
  const combined = `${dateStr}T${timeStr || '12:00'}`;
  const parsed = new Date(combined);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
