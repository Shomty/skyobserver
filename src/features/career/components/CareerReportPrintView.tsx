import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import type { PlanetPosition } from '../../../vedic-utils';
import type { CareerSnapshot } from '../types';
import { getLordInHouseLine } from '../copy/lordInHouse';
import { getTenthHouseParagraph } from '../copy/tenthHouseBySign';
import { t } from '../copy/t';

interface Props {
  fullName?: string;
  birthPlaceLabel?: string;
  cachedAt?: string | null;
  snapshot: CareerSnapshot;
  positions: PlanetPosition[];
}

/** Screen-hidden print layout portalled to document.body (see index.css `.print-root`). */
export function CareerReportPrintView({
  fullName,
  birthPlaceLabel,
  cachedAt,
  snapshot,
}: Props) {
  const content = (
    <div id="career-report-print-root" className="hidden print:block print-root" style={{ padding: 24 }}>
      <header style={{ borderBottom: '2px solid #d4af37', paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#b8860b', fontWeight: 700 }}>
          Vedic Sky Observer
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0', color: '#111' }}>{t('result.title')}</h1>
        {fullName ? (
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#333' }}>{t('result.for', { name: fullName })}</p>
        ) : null}
        {birthPlaceLabel ? (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#555' }}>{birthPlaceLabel}</p>
        ) : null}
        {cachedAt ? (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#777' }}>
            {format(new Date(cachedAt), 'PPP')}
          </p>
        ) : null}
      </header>

      <section style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 6 }}>{t('house.title')}</h2>
        <p style={{ margin: 0, fontWeight: 600, color: '#222' }}>
          {t('house.heading', { sign: snapshot.tenthHouse.sign })}
        </p>
        <p style={{ margin: '8px 0 0', lineHeight: 1.5, color: '#333' }}>
          {getTenthHouseParagraph(snapshot.tenthHouse.sign)}
        </p>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 6 }}>{t('engine.title')}</h2>
        <p style={{ margin: 0, fontWeight: 600, color: '#222' }}>
          {t('engine.heading', {
            lord: snapshot.tenthLord.planet,
            house: snapshot.tenthLord.house,
          })}
        </p>
        <p style={{ margin: '8px 0 0', lineHeight: 1.5, color: '#333' }}>
          {getLordInHouseLine(snapshot.tenthLord.planet, snapshot.tenthLord.house)}
        </p>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 }}>{t('scores.title')}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#333', lineHeight: 1.6 }}>
          <li>
            {snapshot.scores.tenthHouseStrength.label}: {snapshot.scores.tenthHouseStrength.value}
          </li>
          <li>
            {snapshot.scores.leadership.label}: {snapshot.scores.leadership.value}
          </li>
          <li>
            {snapshot.scores.careerDrive.label}: {snapshot.scores.careerDrive.value}
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 6 }}>{t('dasha.title')}</h2>
        <p style={{ margin: 0, color: '#333' }}>
          {t('timing.current')}: {snapshot.dasha.mahadasha.planet}
        </p>
      </section>

      <section style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 6 }}>{t('timing.title')}</h2>
        {snapshot.timing.opportunityWindow ? (
          <p style={{ margin: '0 0 6px', color: '#333' }}>
            {t('timing.opportunity')}: {snapshot.timing.opportunityWindow.from} –{' '}
            {snapshot.timing.opportunityWindow.to}
          </p>
        ) : null}
        {snapshot.timing.peakEarning ? (
          <p style={{ margin: 0, color: '#333' }}>
            {t('timing.peak')}: {snapshot.timing.peakEarning.from} – {snapshot.timing.peakEarning.to}
          </p>
        ) : null}
      </section>

      <section style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 6 }}>{t('yoga.title')}</h2>
        <p style={{ margin: 0, color: '#333' }}>
          {snapshot.wealthYogas.length > 0
            ? t('yoga.count', {
                count: snapshot.wealthYogas.length,
                names: snapshot.wealthYogas
                  .slice(0, 3)
                  .map((y) => y.shortTitle || y.name)
                  .join(', '),
              })
            : t('yoga.none')}
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 6 }}>{t('fields.title')}</h2>
        <p style={{ margin: 0, color: '#333' }}>
          {snapshot.fields
            .slice(0, 6)
            .map((f) => f.label)
            .join(' · ')}
        </p>
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
