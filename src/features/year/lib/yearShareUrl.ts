export function yearSharePath(reportId: string): string {
  return `/year/r/${reportId}`;
}

export function yearShareUrl(reportId: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${yearSharePath(reportId)}`;
}
