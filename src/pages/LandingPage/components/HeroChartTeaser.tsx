import React, { lazy, Suspense, useEffect, useState } from 'react';
import { StaticHeroChart } from './StaticHeroChart';

const LiveChartTeaser = lazy(() =>
  import('./LiveChartTeaser').then((m) => ({ default: m.LiveChartTeaser })),
);

function useMinWidth(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

interface HeroChartTeaserProps {
  compact?: boolean;
}

/** Desktop: live chart after idle. Mobile: static placeholder until user opts in. */
export const HeroChartTeaser: React.FC<HeroChartTeaserProps> = ({ compact = false }) => {
  const isDesktop = useMinWidth('(min-width: 1024px)');
  const [loadLive, setLoadLive] = useState(false);

  useEffect(() => {
    if (!isDesktop || loadLive) return;
    const enable = () => setLoadLive(true);
    const id = globalThis.setTimeout(enable, 2500);
    return () => globalThis.clearTimeout(id);
  }, [isDesktop, loadLive]);

  if (loadLive) {
    return (
      <Suspense fallback={<StaticHeroChart compact={compact} />}>
        <LiveChartTeaser compact={compact} />
      </Suspense>
    );
  }

  return (
    <StaticHeroChart
      compact={compact}
      showLoadButton={!isDesktop}
      onLoadLive={() => setLoadLive(true)}
    />
  );
};
