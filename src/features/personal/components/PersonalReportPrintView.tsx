import { useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { ThemeContext } from '../../../context/ThemeContext';
import type { PersonalAiGuidance, PersonalPsychGuidanceFields, PersonalSnapshot } from '../types';
import { usePersonalPremiumUnlocked } from '../context/PersonalPremiumContext';
import { chapterThemeLong, lifeAreaYearFocus, signStyle, lifeAreaShort, activatedAreaLabel } from '../lib/personalPsychLabels';
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
  guidance: GuidanceState;
}

const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: INK,
  margin: '0 0 10px',
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
  guidance,
}: Props) {
  const premiumUnlocked = usePersonalPremiumUnlocked();
  const wheel = snapshot.personalityWheel;
  const display = {
    outerStyle: wheel.outerStyle ?? signStyle(wheel.lagnaSign).split(',')[0],
    emotionalStyle: wheel.emotionalStyle ?? signStyle(wheel.moonSign).split(',')[0],
    driveStyle: wheel.driveStyle ?? signStyle(wheel.sunSign).split(',')[0],
    identityFocus: wheel.identityFocus ?? lifeAreaShort(wheel.lagnaLordHouse),
  };

  const lightTheme = useMemo(
    () => ({ theme: 'light' as const, setTheme: () => {}, toggleTheme: () => {} }),
    [],
  );

  const chapterRows = [
    { label: t('chapter.major'), theme: chapterThemeLong(snapshot.dasha.mahadasha.planet), ref: snapshot.dasha.mahadasha },
    { label: t('chapter.active'), theme: chapterThemeLong(snapshot.dasha.antardasha.planet), ref: snapshot.dasha.antardasha },
    { label: t('chapter.near'), theme: chapterThemeLong(snapshot.dasha.pratyantardasha.planet), ref: snapshot.dasha.pratyantardasha },
    { label: t('chapter.next'), theme: chapterThemeLong(snapshot.dasha.nextAntardasha.planet), ref: snapshot.dasha.nextAntardasha },
  ];

  const scoreRows = [
    snapshot.scores.innerStrength,
    snapshot.scores.relationshipHarmony,
    snapshot.scores.lifeClarity,
  ];

  void lightTheme;

  const content = (
    <div id="personal-report-print-root" className="hidden personal-print-doc" style={{ padding: 24 }}>
      <header style={{ borderBottom: `2px solid ${GOLD_LIGHT}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
          Soul Blueprint
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

      <section className="personal-print-card" style={{ ...card, marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('blueprint.title')}</h2>
        <p style={{ margin: '0 0 10px', fontSize: 11, color: MUTED }}>{t('blueprint.subtitle')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: t('blueprint.persona'), value: display.outerStyle },
            { label: t('blueprint.emotion'), value: display.emotionalStyle },
            { label: t('blueprint.drive'), value: display.driveStyle },
          ].map((layer) => (
            <div key={layer.label} style={{ border: '1px solid #eee', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', color: MUTED }}>{layer.label}</div>
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{layer.value}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#333' }}>
          {t('blueprint.identityFocus')}: {display.identityFocus}
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('chapter.title')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {chapterRows.map((row) => (
            <div key={row.label} className="personal-print-dasha-row" style={card}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED }}>
                {row.label}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, fontWeight: 600, color: GOLD }}>
                {row.theme}
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>{fmtRange(row.ref)}</div>
            </div>
          ))}
        </div>
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
          {t('wheel.heading', { outer: display.outerStyle, emotional: display.emotionalStyle, drive: display.driveStyle })}
        </p>
        <p style={{ margin: '8px 0 0', lineHeight: 1.5, color: '#333', fontSize: 12 }}>
          {t('wheel.body', { focus: display.identityFocus })}
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={sectionTitle}>{t('timing.title')}</h2>
        <div className="personal-print-timing-row" style={card}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: MUTED }}>{t('timing.activeFocus')}</div>
          <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.55, color: '#333' }}>
            {snapshot.timing.activeYearFocus ?? lifeAreaYearFocus(snapshot.timing.activeSudarshanaHouse)}
          </div>
        </div>
        <div className="personal-print-timing-row" style={{ ...card, marginBottom: 0 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: MUTED }}>{t('timing.current')}</div>
          <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.55, fontWeight: 600, color: GOLD }}>
            {snapshot.timing.currentChapterTheme ?? chapterThemeLong(snapshot.timing.currentPeriodLord)}
          </div>
        </div>
        {snapshot.timing.activatedLifeAreas.length > 0 ? (
          <div className="personal-print-timing-row" style={{ ...card, marginTop: 10 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: MUTED }}>{t('timing.chapterThemes')}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#333' }}>
              {snapshot.timing.activatedLifeAreas.map(activatedAreaLabel).join(' · ')}
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
          <h2 style={sectionTitle}>{t('insight.title')}</h2>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: MUTED }}>{t('insight.subtitle')}</p>
        </div>
        {snapshot.parashari.sections.map((section) => {
          const locked = section.tier === 'premium' && !premiumUnlocked;
          return (
            <div key={section.id} className="personal-print-card" style={card}>
              <div className="personal-print-section-header">
                <div style={{ fontSize: 17, fontWeight: 700, color: GOLD }}>{section.title}</div>
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
