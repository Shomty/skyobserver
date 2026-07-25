const UTM_KEY = 'gift:utm';
const REFERRER_KEY = 'gift:referrer';

const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

/** Capture UTM + referrer once per tab session. */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!sessionStorage.getItem(UTM_KEY)) {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      for (const key of UTM_PARAMS) {
        const v = params.get(key);
        if (v) utm[key] = v;
      }
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
    if (!sessionStorage.getItem(REFERRER_KEY)) {
      sessionStorage.setItem(REFERRER_KEY, document.referrer || '');
    }
  } catch {
    // ignore storage failures
  }
}

export function getAttribution(): { utm: Record<string, string>; referrer: string } {
  if (typeof window === 'undefined') return { utm: {}, referrer: '' };
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    const utm = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const referrer = sessionStorage.getItem(REFERRER_KEY) ?? '';
    return { utm, referrer };
  } catch {
    return { utm: {}, referrer: '' };
  }
}
