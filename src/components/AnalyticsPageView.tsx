import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

/** Sends GA4 page_view on every client-side route change. */
export function AnalyticsPageView(): null {
  const { pathname, search } = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = `${pathname}${search}`;
    if (lastPath.current === path) return;
    lastPath.current = path;
    trackPageView(path);
  }, [pathname, search]);

  return null;
}
