export function personalSharePath(reportId: string): string {
  return `/personal/r/${reportId}`;
}

export function personalShareUrl(reportId: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${personalSharePath(reportId)}`;
}
