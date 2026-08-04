import { useMemo, useState } from 'react';
import NorthIndianChart from '../../../components/NorthIndianChart';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { getRashiLord, RASHIS, type PlanetPosition } from '../../../vedic-utils';
import { t } from '../copy/t';

interface Props {
  positions: PlanetPosition[];
  tenthSign: string;
  tenthLord: string;
}

export function CareerChart({ positions, tenthSign, tenthLord }: Props) {
  const { theme } = useTheme();
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(10);
  const tenthSignIndex = RASHIS.indexOf(tenthSign);

  const highlightedPositions = useMemo(() => {
    return positions.map((p) => {
      const isTenthLord = p.name === tenthLord;
      const inTenth = p.house === 10;
      if (!isTenthLord && !inTenth) return p;
      return { ...p, color: isTenthLord ? '#D4AF37' : p.color };
    });
  }, [positions, tenthLord]);

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <h3 className="font-serif text-title">{t('chart.title')}</h3>
      <p className={cn('mt-1 text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
        {t('chart.hint')} · {tenthSign} · lord {getRashiLord(tenthSign)}
      </p>
      <div className="mx-auto mt-4 max-w-sm">
        <NorthIndianChart
          positions={highlightedPositions}
          hoveredHouse={hoveredHouse}
          setHoveredHouse={setHoveredHouse}
          selectedZodiac={tenthSignIndex >= 0 ? tenthSignIndex : null}
          setSelectedZodiac={() => {}}
          showHover
          className="w-full"
        />
      </div>
    </section>
  );
}
