import { useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import NorthIndianChart from '../../../components/NorthIndianChart';
import { ThemeContext } from '../../../context/ThemeContext';
import { RASHIS, type PlanetPosition } from '../../../vedic-utils';
import type { PersonalAiGuidance, PersonalPsychGuidanceFields, PersonalSnapshot } from '../types';
import { usePersonalPremiumUnlocked } from '../context/PersonalPremiumContext';
import { t } from '../copy/t';

const GOLD = '#b8860b';
const GOLD_LIGHT = '#d4af37';
const INK = '#111';
const MUTED = '#555';

interface GuidanceState {
  guidance: PersonalAiGuidance | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
}

const PRINT_GUIDANCE_SECTIONS: Array<{ key: keyof PersonalPsychGuidanceFields; labelKey: string }> = [
  { key: 'selfUnderstanding', labelKey: 'guidance.selfUnderstanding' },
  { key: 'copingStrategies', labelKey: 'guidance.copingStrategies' },
  { key: 'dailyPractices', labelKey: 'guidance.dailyPractices' },
  { key: 'currentChapterGuidance', labelKey: 'guidance.currentChapter' },
  { key: 'whenToSeekSupport', labelKey: 'guidance.whenToSeekSupport' },
];

interface Props {
  fullName?: string;
  birthPlaceLabel?: string;
  cachedAt?: string | null;
  snapshot: PersonalSnapshot;
  positions: PlanetPosition[];
  guidance: GuidanceState;
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

export function PersonalReportPrintView({
  fullName,
  birthPlaceLabel,
  cachedAt,
  snapshot,
  positions,
  guidance,
}: Props) {
  const premiumUnlocked = usePersonalPremiumUnlocked();
  const wheel = snapshot.personalityWheel;
  const ascIndex = RASHIS.indexOf(snapshot.ascendantSignName);

  const highlightedPositions = useMemo(
    () =>
      positions.map((p) => {
        if (p.name === 'Moon') return { ...p, color: '#888' };
        if (p.name === 'Sun') return { ...p, color: GOLD_LIGHT };
        return p;
      }),
    [positions],
  );

  const lightTheme = useMemo(
    () => ({ theme: 'light' as const, setTheme: () => {}, toggleTheme: () => {} }),
    [],
  );

  const dashaRows = [
    { label: t('dasha.mahadasha'), ref: snapshot.dasha.mahadasha },
    { label: t('dasha.antardasha'), ref: snapshot.dasha.antardasha },
    { label: t('dasha.pratyantardasha'), ref: snapshot.dasha.pratyantardasha },
    { label: t('dasha.nextAntardasha'), ref: snapshot.dasha.nextAntardasha },
  ];

  const scoreRows = [
    snapshot.scores.innerStrength,
    snapshot.scores.relationshipHarmony,
    snapshot.scores.lifeClarity,
  ];

  const content = (
    <div id="personal-report-print-root" className="hidden personal-print-doc" style={{ padding: 24 }}>
      <header style={{ borderBottom: `2px solid ${GOLD_LIGHT}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
          Vedic Sky Observer
        </div>
        <h1 className="personal-print-doc-title" style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0', color: INK }}>
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

      <section className="personal-print-chart-box" style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('chart.title')}</h2>
        <p style={{ margin: '0 0 10px', fontSize: 11, color: MUTED }}>
          {t('chart.hint')} · {snapshot.ascendantSignName}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 300, height: 300 }}>
            <ThemeContext.Provider value={lightTheme}>
              <NorthIndianChart
                positions={highlightedPositions}
                selectedZodiac={ascIndex >= 0 ? ascIndex : null}
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
            className="personal-print-dasha-row"
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
            <div key={score.label} className="personal-print-score" style={card}>
              <div style={{ fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED }}>
                {score.label}
              </div>
              <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700, color: GOLD }}>{score.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="personal-print-card" style={{ ...card, marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('wheel.title')}</h2>
        <p style={{ margin: 0, fontWeight: 600, color: '#222', fontSize: 13 }}>
          {t('wheel.heading', { lagna: wheel.lagnaSign, moon: wheel.moonSign, sun: wheel.sunSign })}
        </p>
        <p style={{ margin: '8px 0 0', lineHeight: 1.5, color: '#333', fontSize: 12 }}>
          {t('wheel.body', {
            lord: wheel.lagnaLord,
            house: wheel.lagnaLordHouse,
            element: wheel.element,
            guna: wheel.guna,
          })}
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('timing.title')}</h2>
        <div className="personal-print-timing-row" style={card}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: MUTED }}>{t('timing.activeSudarshana')}</div>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>
            {t('timing.activeArea', {
              house: snapshot.timing.activeSudarshanaHouse,
              area: snapshot.timing.activeLifeArea.split(',')[0],
            })}
          </div>
        </div>
        {snapshot.timing.activatedLifeAreas.length > 0 ? (
          <div className="personal-print-timing-row" style={{ ...card, marginBottom: 0 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: MUTED }}>{t('timing.dashaAreas')}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#333' }}>
              {snapshot.timing.activatedLifeAreas.join(' · ')}
            </div>
          </div>
        ) : null}
      </section>

      <section style={{ marginBottom: 20 }}>
        <div className="personal-print-section-header">
          <h2 style={sectionTitle}>{t('guidance.title')}</h2>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: MUTED }}>{t('guidance.subtitle')}</p>
        </div>
        {guidance.loading ? (
          <p style={{ fontSize: 12, fontStyle: 'italic', color: '#999' }}>{t('print.guidancePending')}</p>
        ) : guidance.error ? null : guidance.guidance && premiumUnlocked ? (
          PRINT_GUIDANCE_SECTIONS.map(({ key, labelKey }) => (
            <div key={key} className="personal-print-card" style={{ ...card, marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 6 }}>{t(labelKey)}</div>
              {guidance.guidance!.guidance[key].split(/\n\n+/).map((paragraph) => (
                <p key={paragraph.slice(0, 48)} style={{ margin: '0 0 8px', lineHeight: 1.55, color: '#333', fontSize: 12 }}>
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          ))
        ) : (
          <>
            <p style={{ margin: '0 0 8px', lineHeight: 1.55, color: '#555', fontSize: 12 }}>{t('guidance.teaser')}</p>
            <p style={{ margin: 0, fontSize: 11, fontStyle: 'italic', color: '#999' }}>{t('print.unlockGuidance')}</p>
          </>
        )}
      </section>

      <section style={{ marginBottom: 20 }}>
        <div className="personal-print-section-header">
          <h2 style={sectionTitle}>{t('parashari.title')}</h2>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: MUTED }}>{t('parashari.subtitle')}</p>
        </div>
        {snapshot.parashari.sections.map((section) => {
          const locked = section.tier === 'premium' && !premiumUnlocked;
          return (
            <div key={section.id} className="personal-print-card" style={card}>
              <div className="personal-print-section-header">
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
                  {section.bullets?.map((b) => (
                    <p key={b} style={{ margin: '0 0 4px', fontSize: 11, color: '#444' }}>
                      · {b}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
