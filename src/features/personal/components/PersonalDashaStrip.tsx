import { format } from 'date-fns';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';
import { chapterThemeLong } from '../lib/personalPsychLabels';
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
    { label: t('chapter.major'), theme: chapterThemeLong(dasha.mahadasha.planet), range: fmtRange(dasha.mahadasha) },
    { label: t('chapter.active'), theme: chapterThemeLong(dasha.antardasha.planet), range: fmtRange(dasha.antardasha) },
    { label: t('chapter.near'), theme: chapterThemeLong(dasha.pratyantardasha.planet), range: fmtRange(dasha.pratyantardasha) },
    { label: t('chapter.next'), theme: chapterThemeLong(dasha.nextAntardasha.planet), range: fmtRange(dasha.nextAntardasha) },
  ];

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-6',
        theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200',
      )}
    >
      <h3 className="font-serif text-title">{t('chapter.title')}</h3>
      <ul className="mt-4 grid gap-3 lg:grid-cols-2 lg:gap-4">
        {rows.map((row) => (
          <li
            key={row.label}
            className={cn(
              'rounded-xl px-4 py-3.5',
              theme === 'dark' ? 'bg-white/[0.04]' : 'bg-slate-50',
            )}
          >
            <p className={cn('text-caption font-medium uppercase tracking-wide', theme === 'dark' ? 'text-white/50' : 'text-slate-500')}>
              {row.label}
            </p>
            <p className="mt-2 text-body-lg font-medium leading-relaxed text-jyotish-gold">{row.theme}</p>
            <p className={cn('mt-1.5 text-caption tabular-nums', theme === 'dark' ? 'text-white/40' : 'text-slate-400')}>
              {row.range}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
