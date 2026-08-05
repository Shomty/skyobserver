export function dailySharePath(reportId: string): string {
  return `/daily/r/${reportId}`;
}

export function dailyShareUrl(reportId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${dailySharePath(reportId)}`;
  }
  return dailySharePath(reportId);
}
