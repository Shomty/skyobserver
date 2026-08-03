import { useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import NorthIndianChart from '../../../components/NorthIndianChart';
import { ThemeContext } from '../../../context/ThemeContext';
import { getRashiLord, RASHIS, type PlanetPosition } from '../../../vedic-utils';
import type { CareerAiSynthesis, CareerSnapshot } from '../types';
import { useCareerPremiumUnlocked } from '../context/CareerPremiumContext';
import { getLordInHouseLine } from '../copy/lordInHouse';
import { getTenthHouseParagraph } from '../copy/tenthHouseBySign';
import { t } from '../copy/t';

const GOLD = '#b8860b';
const GOLD_LIGHT = '#d4af37';
const INK = '#111';
const MUTED = '#555';

const FREE_FIELD_COUNT = 2;

interface SynthesisState {
  synthesis: CareerAiSynthesis | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
}

interface Props {
  fullName?: string;
  birthPlaceLabel?: string;
  cachedAt?: string | null;
  snapshot: CareerSnapshot;
  positions: PlanetPosition[];
  synthesis: SynthesisState;
}

const sectionTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: INK,
  margin: '0 0 8px',
};

const card: CSSProperties = {
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  padding: 14,
  marginBottom: 10,
  background: '#fafafa',
};

function fmtRange(ref: { startDate: string; endDate: string }): string {
  if (!ref.startDate || !ref.endDate) return '—';
  return `${format(new Date(ref.startDate), 'MMM yyyy')} – ${format(new Date(ref.endDate), 'MMM yyyy')}`;
}

/**
 * Print/PDF source tree for the career report — always rendered but always
 * `hidden` (never itself shown at print). At print time `careerPrint.ts`
 * reads its `outerHTML` and hands that string to Paged.js, which paginates a
 * *copy* into a separate `.print-root` container it owns; see the comment
 * above the `@media print` block in src/index.css for why this indirection
 * exists rather than portalling this tree straight into `.print-root` the
 * way the Cosmic Report and Chat print views do.
 */
export function CareerReportPrintView({
  fullName,
  birthPlaceLabel,
  cachedAt,
  snapshot,
  positions,
  synthesis,
}: Props) {
  const premiumUnlocked = useCareerPremiumUnlocked();
  const tenthSignIndex = RASHIS.indexOf(snapshot.tenthHouse.sign);

  const highlightedPositions = useMemo(
    () =>
      positions.map((p) => {
        const isTenthLord = p.name === snapshot.tenthLord.planet;
        const inTenth = p.house === 10;
        if (!isTenthLord && !inTenth) return p;
        return { ...p, color: isTenthLord ? GOLD_LIGHT : p.color };
      }),
    [positions, snapshot.tenthLord.planet],
  );

  // The chart reads app theme via context; pin it to light so paper never
  // gets the dark palette's near-invisible low-opacity strokes.
  const lightTheme = useMemo(() => ({ theme: 'light' as const, setTheme: () => {}, toggleTheme: () => {} }), []);

  const dashaRows = [
    { label: t('dasha.mahadasha'), ref: snapshot.dasha.mahadasha },
    { label: t('dasha.antardasha'), ref: snapshot.dasha.antardasha },
    { label: t('dasha.pratyantardasha'), ref: snapshot.dasha.pratyantardasha },
    { label: t('dasha.nextAntardasha'), ref: snapshot.dasha.nextAntardasha },
  ];

  const scoreRows = [snapshot.scores.tenthHouseStrength, snapshot.scores.leadership, snapshot.scores.careerDrive];

  const visibleFields = premiumUnlocked ? snapshot.fields : snapshot.fields.slice(0, FREE_FIELD_COUNT);
  const lockedFieldCount = premiumUnlocked ? 0 : Math.max(snapshot.fields.length - FREE_FIELD_COUNT, 0);

  const content = (
    <div id="career-report-print-root" className="hidden career-print-doc" style={{ padding: 24 }}>
      <header style={{ borderBottom: `2px solid ${GOLD_LIGHT}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
          Vedic Sky Observer
        </div>
        <h1
          className="career-print-doc-title"
          style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0', color: INK }}
        >
          {t('result.title')}
        </h1>
        {fullName ? (
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#333' }}>{t('result.for', { name: fullName })}</p>
        ) : null}
        {birthPlaceLabel ? (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>{birthPlaceLabel}</p>
        ) : null}
        {cachedAt ? (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#777' }}>{format(new Date(cachedAt), 'PPP')}</p>
        ) : null}
      </header>

      <section className="career-print-chart-box" style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('chart.title')}</h2>
        <p style={{ margin: '0 0 10px', fontSize: 11, color: MUTED }}>
          {t('chart.hint')} · {snapshot.tenthHouse.sign} · lord {getRashiLord(snapshot.tenthHouse.sign)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 300, height: 300 }}>
            <ThemeContext.Provider value={lightTheme}>
              <NorthIndianChart
                positions={highlightedPositions}
                selectedZodiac={tenthSignIndex >= 0 ? tenthSignIndex : null}
                showHover={false}
                className="w-full h-full print-chart"
              />
            </ThemeContext.Provider>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('dasha.title')}</h2>
        {dashaRows.map((row) => (
          <div
            key={row.label}
            className="career-print-dasha-row"
            style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
          >
            <span style={{ fontSize: 11, color: MUTED }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {row.ref.planet}
              <span style={{ marginLeft: 8, fontSize: 11, color: '#888', fontWeight: 400 }}>{fmtRange(row.ref)}</span>
            </span>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('scores.title')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {scoreRows.map((score) => (
            <div key={score.label} className="career-print-score" style={card}>
              <div style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>
                {score.label}
              </div>
              {score.locked ? (
                <div style={{ marginTop: 6, fontSize: 12, fontStyle: 'italic', color: '#999' }}>
                  {t('print.unlockScore')}
                </div>
              ) : (
                <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700, color: GOLD }}>{score.value}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="career-print-card" style={{ ...card, marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('house.title')}</h2>
        <p style={{ margin: 0, fontWeight: 600, color: '#222', fontSize: 13 }}>
          {t('house.heading', { sign: snapshot.tenthHouse.sign })}
        </p>
        <p style={{ margin: '8px 0 0', lineHeight: 1.5, color: '#333', fontSize: 12 }}>
          {getTenthHouseParagraph(snapshot.tenthHouse.sign)}
        </p>
      </section>

      <section className="career-print-card" style={{ ...card, marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('engine.title')}</h2>
        <p style={{ margin: 0, fontWeight: 600, color: '#222', fontSize: 13 }}>
          {t('engine.heading', { lord: snapshot.tenthLord.planet, house: snapshot.tenthLord.house })}
        </p>
        <p style={{ margin: '8px 0 0', lineHeight: 1.5, color: '#333', fontSize: 12 }}>
          {getLordInHouseLine(snapshot.tenthLord.planet, snapshot.tenthLord.house)}
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('timing.title')}</h2>
        <div className="career-print-timing-row" style={card}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: MUTED }}>{t('timing.opportunity')}</div>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>
            {snapshot.timing.opportunityWindow
              ? `${snapshot.timing.opportunityWindow.from} – ${snapshot.timing.opportunityWindow.to}`
              : t('timing.none')}
          </div>
          {snapshot.timing.opportunityWindow ? (
            <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
              {snapshot.timing.opportunityWindow.reason}
            </div>
          ) : null}
        </div>
        <div className="career-print-timing-row" style={card}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: MUTED }}>{t('timing.peak')}</div>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>
            {snapshot.timing.peakEarning
              ? `${snapshot.timing.peakEarning.from} – ${snapshot.timing.peakEarning.to}`
              : t('timing.none')}
          </div>
        </div>
        <div className="career-print-timing-row" style={{ ...card, marginBottom: 0 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: MUTED }}>{t('timing.current')}</div>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: GOLD }}>
            {snapshot.timing.currentPeriodLord}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <div className="career-print-section-header">
          <h2 style={sectionTitle}>{t('synthesis.title')}</h2>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: MUTED }}>{t('synthesis.subtitle')}</p>
        </div>
        {synthesis.loading ? (
          <p style={{ fontSize: 12, fontStyle: 'italic', color: '#999' }}>{t('print.synthesisPending')}</p>
        ) : synthesis.error ? null : synthesis.synthesis ? (
          premiumUnlocked ? (
            synthesis.synthesis.text.split(/\n\n+/).map((paragraph) => (
              <p key={paragraph.slice(0, 48)} style={{ margin: '0 0 10px', lineHeight: 1.55, color: '#333', fontSize: 12 }}>
                {paragraph.trim()}
              </p>
            ))
          ) : (
            <>
              <p style={{ margin: '0 0 8px', lineHeight: 1.55, color: '#555', fontSize: 12 }}>
                {t('synthesis.teaser')}
              </p>
              <p style={{ margin: 0, fontSize: 11, fontStyle: 'italic', color: '#999' }}>
                {t('print.unlockSynthesis')}
              </p>
            </>
          )
        ) : null}
      </section>

      <section style={{ marginBottom: 20 }}>
        <div className="career-print-section-header">
          <h2 style={sectionTitle}>{t('parashari.title')}</h2>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: MUTED }}>{t('parashari.subtitle')}</p>
        </div>
        {snapshot.parashari.sections.map((section) => {
          const locked = section.tier === 'premium' && !premiumUnlocked;
          return (
            <div key={section.id} className="career-print-card" style={card}>
              <div className="career-print-section-header">
                <div style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>{section.title}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{section.subtitle}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#222', marginTop: 6 }}>{section.teaser}</div>
              </div>
              {locked ? (
                <p style={{ marginTop: 8, fontSize: 11, fontStyle: 'italic', color: '#999' }}>
                  {t('print.unlockSection', { title: section.title })}
                </p>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {section.paragraphs.map((p) => (
                    <p key={p.slice(0, 40)} style={{ margin: '0 0 8px', lineHeight: 1.5, color: '#333', fontSize: 12 }}>
                      {p}
                    </p>
                  ))}
                  {section.bullets && section.bullets.length > 0 ? (
                    <ul style={{ margin: '0 0 8px', paddingLeft: 18, color: '#333', fontSize: 12, lineHeight: 1.5 }}>
                      {section.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                  {section.quote ? (
                    <blockquote
                      style={{
                        borderLeft: `2px solid ${GOLD_LIGHT}`,
                        paddingLeft: 12,
                        fontStyle: 'italic',
                        fontSize: 11,
                        color: '#666',
                        margin: 0,
                      }}
                    >
                      {section.quote}
                    </blockquote>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
        {!premiumUnlocked ? (
          <p style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>{t('parashari.premiumNote')}</p>
        ) : null}
      </section>

      <section className="career-print-card" style={{ ...card, marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('yoga.title')}</h2>
        {snapshot.wealthYogas.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18, color: '#333', fontSize: 12, lineHeight: 1.6 }}>
            {snapshot.wealthYogas.map((y) => (
              <li key={y.name}>
                <strong>{y.shortTitle || y.name}</strong>
                {y.plainDescription ? ` — ${y.plainDescription}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: '#333' }}>{t('yoga.none')}</p>
        )}
      </section>

      <section className="career-print-card" style={{ ...card, marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('fields.title')}</h2>
        <p style={{ margin: 0, fontSize: 12, color: '#333' }}>{visibleFields.map((f) => f.label).join(' · ')}</p>
        {lockedFieldCount > 0 ? (
          <p style={{ margin: '8px 0 0', fontSize: 11, fontStyle: 'italic', color: '#999' }}>
            {t('print.moreFieldsLocked', { count: lockedFieldCount })}
          </p>
        ) : null}
      </section>

      <section className="career-print-card" style={card}>
        <h2 style={sectionTitle}>{t('faq.title')}</h2>
        {(['q1', 'q2', 'q3'] as const).map((q) => (
          <div key={q} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{t(`faq.${q}`)}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: '#555' }}>{t(`faq.a${q.slice(1)}`)}</div>
          </div>
        ))}
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
