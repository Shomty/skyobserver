export type CareerViewMode = 'vedic' | 'plain';

const STORAGE_KEY = 'soulblueprint-career-view-mode';

export function readCareerViewMode(): CareerViewMode {
  if (typeof window === 'undefined') return 'vedic';
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'plain' ? 'plain' : 'vedic';
  } catch {
    return 'vedic';
  }
}

export function writeCareerViewMode(mode: CareerViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}
