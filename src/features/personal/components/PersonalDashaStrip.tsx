import { format } from 'date-fns';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { t } from '../copy/t';
import type { PersonalSnapshot } from '../types';

interface Props {
  dasha: PersonalSnapshot['dasha'];
}

function fmtRange(ref: { startDate: string; endDate: string }): string {
  if (!ref.startDate || !ref.endDate) return '—';
  return `${format(new Date(ref.startDate), 'MMM yyyy')} – ${format(new Date(ref.endDate), 'MMM yyyy')}`;
}

export function PersonalDashaStrip({ dasha }: Props) {
  const { theme } = useTheme();
  const rows = [
    { label: t('dasha.mahadasha'), planet: dasha.mahadasha.planet, range: fmtRange(dasha.mahadasha) },
    { label: t('dasha.antardasha'), planet: dasha.antardasha.planet, range: fmtRange(dasha.antardasha) },
    { label: t('dasha.pratyantardasha'), planet: dasha.pratyantardasha.planet, range: fmtRange(dasha.pratyantardasha) },
    { label: t('dasha.nextAntardasha'), planet: dasha.nextAntardasha.planet, range: fmtRange(dasha.nextAntardasha) },
  ];

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <h3 className="font-serif text-title">{t('dasha.title')}</h3>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li
            key={row.label}
            className={cn(
              'flex flex-col gap-1 rounded-lg px-3 py-2 sm:flex-row sm:items-center sm:justify-between',
              theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-50'
            )}
          >
            <span className={cn('text-caption', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
              {row.label}
            </span>
            <span className="text-body font-medium">
              <span className="text-jyotish-gold">{row.planet}</span>
              <span className={cn('ml-2 text-caption', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
                {row.range}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
