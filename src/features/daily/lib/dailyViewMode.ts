export type DailyViewMode = 'vedic' | 'plain';

const STORAGE_KEY = 'soulblueprint-daily-view-mode';

export function readDailyViewMode(): DailyViewMode {
  if (typeof window === 'undefined') return 'vedic';
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'plain' ? 'plain' : 'vedic';
  } catch {
    return 'vedic';
  }
}

export function writeDailyViewMode(mode: DailyViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}
