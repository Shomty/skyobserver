import { useMemo, useState } from 'react';
import NorthIndianChart from '../../../components/NorthIndianChart';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { RASHIS, type PlanetPosition } from '../../../vedic-utils';
import { t } from '../copy/t';

interface Props {
  positions: PlanetPosition[];
  ascendantSign: string;
}

export function DailyChart({ positions, ascendantSign }: Props) {
  const { theme } = useTheme();
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(1);
  const ascIndex = RASHIS.indexOf(ascendantSign);

  const highlighted = useMemo(
    () =>
      positions.map((p) => {
        if (p.name !== 'Moon' && p.name !== 'Sun') return p;
        return { ...p, color: p.name === 'Sun' ? '#D4AF37' : p.color };
      }),
    [positions],
  );

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
      )}
    >
      <h3 className="font-serif text-title">{t('chart.title')}</h3>
      <p className={cn('mt-1 text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
        {t('chart.hint')} · {ascendantSign} Lagna
      </p>
      <div className="mx-auto mt-4 max-w-sm">
        <NorthIndianChart
          positions={highlighted}
          hoveredHouse={hoveredHouse}
          setHoveredHouse={setHoveredHouse}
          selectedZodiac={ascIndex >= 0 ? ascIndex : null}
          setSelectedZodiac={() => {}}
          showHover
          className="w-full"
        />
      </div>
    </section>
  );
}
