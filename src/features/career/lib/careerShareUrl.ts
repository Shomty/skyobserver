/** Public share URL for a saved career report. */
export function careerSharePath(reportId: string): string {
  return `/career/r/${reportId}`;
}

export function careerShareUrl(reportId: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${careerSharePath(reportId)}`;
}
