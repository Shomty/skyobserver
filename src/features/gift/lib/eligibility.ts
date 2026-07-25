import type { EligibilityRule } from '../types';

/** Day-of-year distance, wrapping around year boundaries (0–182). */
export function daysFromBirthday(birthDateIso: string, today: Date = new Date()): number | null {
  const birth = parseIsoDate(birthDateIso);
  if (!birth) return null;

  const thisYear = today.getFullYear();
  const birthdayThisYear = new Date(thisYear, birth.getMonth(), birth.getDate());
  const birthdayLastYear = new Date(thisYear - 1, birth.getMonth(), birth.getDate());
  const birthdayNextYear = new Date(thisYear + 1, birth.getMonth(), birth.getDate());

  const startOfToday = startOfDay(today);
  const candidates = [birthdayThisYear, birthdayLastYear, birthdayNextYear].map(startOfDay);
  let min = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    const diff = Math.abs(diffDays(startOfToday, c));
    if (diff < min) min = diff;
  }
  return Number.isFinite(min) ? min : null;
}

export function isEligibleForBirthdayWindow(
  birthDateIso: string,
  rule: EligibilityRule,
  today: Date = new Date()
): boolean {
  if (rule.kind !== 'birthdayWindow') return true;
  const days = daysFromBirthday(birthDateIso, today);
  if (days === null) return false;
  return days <= Math.max(rule.daysBefore, rule.daysAfter);
}

export function ageFromBirthDate(birthDateIso: string, today: Date = new Date()): number | null {
  const birth = parseIsoDate(birthDateIso);
  if (!birth) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}
