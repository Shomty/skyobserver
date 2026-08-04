import { useMemo, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import NorthIndianChart from '../NorthIndianChart';
import { ThemeContext } from '../../context/ThemeContext';
import { PlanetPosition, PanchangData } from '../../vedic-utils';
import { AICosmicInterpretations } from '../../services/geminiService';
import { getOrdinal } from '../../lib/utils';

const GOLD = '#b8860b';
const GOLD_LIGHT = '#d4af37';
const INK = '#111';
const MUTED = '#555';

const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  fontStyle: 'italic',
  fontFamily: 'Georgia, "Times New Roman", serif',
  color: GOLD,
  margin: '0 0 12px',
  paddingBottom: 8,
  borderBottom: `1px solid ${GOLD_LIGHT}`,
};

const card: CSSProperties = {
  breakInside: 'avoid',
  padding: 14,
  marginBottom: 12,
  border: `1px solid #e8dcc8`,
  borderRadius: 8,
  background: '#faf8f4',
};

interface InterpretedBlueprint {
  ak: { planet: string; interpretation: string };
  amk: { planet: string; interpretation: string };
  ishta: { planet: string; interpretation: string };
  dharma: { planet: string; interpretation: string };
}

interface ChartQualities {
  element: { emoji: string; label: string; description: string };
  guna: { emoji: string; label: string; description: string };
}

export interface CosmicReportPrintViewProps {
  profile: any;
  birthPositions: PlanetPosition[];
  panchang: PanchangData;
  aiData: AICosmicInterpretations;
  interpretedBlueprint: InterpretedBlueprint | null;
  chartQualities: ChartQualities | null;
  yogas: { name: string; description?: string; implication?: string; strength?: string }[];
}

function panchangVal(val: unknown): string {
  if (val && typeof val === 'object' && 'name' in val) return String((val as { name: string }).name);
  return String(val ?? '—');
}

/**
 * Screen-hidden, paper-optimized Full Report layout. Portalled to <body> and
 * revealed only during print by the `.print-root` rules in index.css — see the
 * comment there for why it cannot live inside the app shell.
 */
function CosmicReportPrintView({
  profile,
  birthPositions,
  panchang,
  aiData,
  interpretedBlueprint,
  chartQualities,
  yogas,
}: CosmicReportPrintViewProps) {
  const subjectName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : (profile?.displayName || 'Seeker');

  const birthTimeRaw = profile?.birthDetails?.time || profile?.birthTime;
  const birthDate = birthTimeRaw ? format(new Date(birthTimeRaw), 'MMMM do, yyyy') : 'N/A';
  const birthTime = birthTimeRaw ? format(new Date(birthTimeRaw), 'HH:mm') : 'N/A';
  const birthPlace = profile?.birthDetails?.city || profile?.birthPlace || 'N/A';
  const lat = profile?.birthDetails?.lat ?? profile?.birthLat ?? 0;
  const lon = profile?.birthDetails?.lon ?? profile?.birthLon ?? 0;

  const panchangRows = [
    { label: 'Tithi', val: panchangVal(panchang.tithi), ai: aiData.panchang?.tithi },
    { label: 'Nakshatra', val: panchangVal(panchang.nakshatra), ai: aiData.panchang?.nakshatra },
    { label: 'Yoga', val: panchangVal(panchang.yoga), ai: aiData.panchang?.yoga },
    { label: 'Karana', val: panchangVal(panchang.karana), ai: aiData.panchang?.karana },
    { label: 'Vara', val: panchang.vara, ai: aiData.panchang?.vara },
  ];

  const blueprintItems = interpretedBlueprint
    ? [
        { key: 'Atmakaraka (Soul)', planet: interpretedBlueprint.ak.planet, text: aiData.blueprint?.ak || interpretedBlueprint.ak.interpretation },
        { key: 'Amatyakaraka (Career)', planet: interpretedBlueprint.amk.planet, text: aiData.blueprint?.amk || interpretedBlueprint.amk.interpretation },
        { key: 'Ishta Devata', planet: interpretedBlueprint.ishta.planet, text: aiData.blueprint?.ishta || interpretedBlueprint.ishta.interpretation },
        { key: 'Dharma Chakra', planet: interpretedBlueprint.dharma.planet, text: aiData.blueprint?.dharma || interpretedBlueprint.dharma.interpretation },
      ]
    : [];

  const transitEntries = aiData.transits ? Object.entries(aiData.transits) : [];

  // The chart reads the app theme; pin it to light so paper never gets the
  // dark palette's near-white strokes.
  const lightTheme = useMemo(
    () => ({ theme: 'light' as const, setTheme: () => {}, toggleTheme: () => {} }),
    [],
  );

  const content = (
    <div id="report-print-root" className="hidden print:block print-root">
      {/* Letterhead */}
      <header style={{ borderBottom: `2px solid ${GOLD_LIGHT}`, paddingBottom: 16, marginBottom: 24, breakInside: 'avoid' }}>
        <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
          Vedic Sky Observer · Cosmic Analysis Report
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, fontStyle: 'italic', fontFamily: 'Georgia, serif', margin: '8px 0 4px', color: INK }}>
          {subjectName}
        </h1>
        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: MUTED, margin: '0 0 12px' }}>
          Life Blueprint · Sidereal Jyotish
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 24px', fontSize: 11, color: INK }}>
          <div><span style={{ color: MUTED, textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Birth Date </span>{birthDate}</div>
          <div><span style={{ color: MUTED, textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Time </span>{birthTime}</div>
          <div><span style={{ color: MUTED, textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Place </span>{birthPlace}</div>
          <div><span style={{ color: MUTED, textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Coords </span>{lat.toFixed(4)}°, {lon.toFixed(4)}°</div>
        </div>
      </header>

      {/* Soul Synthesis */}
      <section style={{ marginBottom: 28, breakInside: 'avoid' }}>
        <h2 style={sectionTitle}>Soul Synthesis</h2>
        <blockquote style={{
          margin: 0,
          padding: '16px 20px',
          borderLeft: `4px solid ${GOLD_LIGHT}`,
          background: '#faf8f4',
          fontStyle: 'italic',
          fontSize: 14,
          lineHeight: 1.65,
          color: '#333',
        }}>
          &ldquo;{aiData.summary}&rdquo;
        </blockquote>
      </section>

      {/* Natal Chart */}
      <section style={{ marginBottom: 28, pageBreakInside: 'avoid' }}>
        <h2 style={sectionTitle}>Natal Birth Chart</h2>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto', maxWidth: 340 }}>
          <div style={{ width: 320, height: 320 }}>
            <ThemeContext.Provider value={lightTheme}>
              <NorthIndianChart positions={birthPositions} showHover={false} className="w-full h-full print-chart" />
            </ThemeContext.Provider>
          </div>
        </div>
      </section>

      {/* Life Blueprint */}
      {blueprintItems.length > 0 && (
        <section style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <h2 style={sectionTitle}>Your Unique Life Blueprint</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {blueprintItems.map(item => (
              <div key={item.key} style={card}>
                <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>
                  {item.key}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, marginBottom: 8 }}>{item.planet}</div>
                <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: INK }}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Element & Guna */}
      {chartQualities && (
        <section style={{ marginBottom: 28, breakInside: 'avoid' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={card}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 8 }}>Dominant Element</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28 }}>{chartQualities.element.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{chartQualities.element.label}</div>
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.55, color: MUTED }}>{chartQualities.element.description}</p>
                </div>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 8 }}>Primary Guna</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28 }}>{chartQualities.guna.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{chartQualities.guna.label}</div>
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.55, color: MUTED }}>{chartQualities.guna.description}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Panchang */}
      <section style={{ marginBottom: 28, pageBreakBefore: blueprintItems.length === 0 ? 'always' : undefined }}>
        <h2 style={sectionTitle}>Natal Panchang Parameters</h2>
        {panchangRows.map(row => (
          <div key={row.label} style={{ ...card, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: row.ai ? 8 : 0 }}>
              <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: MUTED }}>{row.label}</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{row.val}</span>
            </div>
            {row.ai && (
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: '#333', borderTop: '1px solid #e8dcc8', paddingTop: 8 }}>
                {row.ai}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Planetary Positions */}
      <section style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
        <h2 style={sectionTitle}>Planetary Alignment</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 20 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${GOLD_LIGHT}` }}>
              {['Planet', 'Rashi', 'Degrees', 'House', 'Nakshatra'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 6px', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: MUTED, fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {birthPositions.map(p => (
              <tr key={p.name} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '7px 6px', fontWeight: 600 }}>
                  {p.name}{p.isRetrograde ? ' (R)' : ''}
                </td>
                <td style={{ padding: '7px 6px' }}>{p.rashi}</td>
                <td style={{ padding: '7px 6px', fontFamily: 'monospace' }}>{p.degree.toFixed(2)}°</td>
                <td style={{ padding: '7px 6px' }}>{getOrdinal(p.house || 1)} House</td>
                <td style={{ padding: '7px 6px' }}>{p.nakshatra}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {aiData.planets && Object.keys(aiData.planets).length > 0 && (
          <>
            <h3 style={{ ...sectionTitle, fontSize: 13, marginTop: 16 }}>Planetary Insights</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {birthPositions.filter(p => aiData.planets[p.name]).map(p => (
                <div key={p.name} style={card}>
                  <div style={{ fontWeight: 700, color: GOLD, fontSize: 12, marginBottom: 4 }}>
                    {p.name}{p.isRetrograde ? ' (R)' : ''} · {p.rashi}
                  </div>
                  <p style={{ margin: 0, fontSize: 10, lineHeight: 1.6, color: INK }}>{aiData.planets[p.name]}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Yogas */}
      {yogas.length > 0 && (
        <section style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <h2 style={sectionTitle}>Significant Yogas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {yogas.map(yoga => (
              <div key={yoga.name} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: GOLD, fontSize: 12 }}>{yoga.name}</span>
                  {yoga.strength === 'strong' && (
                    <span style={{ fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD_LIGHT}`, padding: '2px 6px', borderRadius: 4 }}>
                      High Potential
                    </span>
                  )}
                </div>
                {yoga.description && (
                  <p style={{ margin: '0 0 8px', fontSize: 10, lineHeight: 1.55, color: MUTED }}>{yoga.description}</p>
                )}
                {yoga.implication && (
                  <p style={{ margin: '0 0 8px', fontSize: 9, fontStyle: 'italic', color: '#777' }}>
                    Effect: {yoga.implication}
                  </p>
                )}
                {aiData.yogas?.[yoga.name] && (
                  <p style={{ margin: 0, fontSize: 10, lineHeight: 1.6, color: INK, borderTop: '1px solid #e8dcc8', paddingTop: 8 }}>
                    {aiData.yogas[yoga.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transits */}
      {transitEntries.length > 0 && (
        <section style={{ marginBottom: 28, pageBreakBefore: 'always' }}>
          <h2 style={sectionTitle}>Sky Transits at Generation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {transitEntries.map(([title, interpretation]) => (
              <div key={title} style={card}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: INK }}>{title}</div>
                <p style={{ margin: 0, fontSize: 10, lineHeight: 1.6, color: '#333' }}>{interpretation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: 32,
        paddingTop: 16,
        borderTop: `1px solid ${GOLD_LIGHT}`,
        breakInside: 'avoid',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
        fontSize: 9,
        color: MUTED,
      }}>
        <div>
          <div style={{ fontWeight: 700, color: INK, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>Vedic Sky Report</div>
          <div style={{ letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>Sidereal Engine v2.0</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ letterSpacing: 1, textTransform: 'uppercase' }}>Generated On</div>
          <div style={{ fontWeight: 700, color: INK, marginTop: 2 }}>{format(new Date(), 'EEEE, MMMM do, yyyy')}</div>
        </div>
        <p style={{ flexBasis: '100%', margin: '8px 0 0', lineHeight: 1.5, fontSize: 8, border: '1px solid #eee', padding: 10, borderRadius: 6 }}>
          Disclaimer: This report is for personal guidance and information only. Vedic Astrology provides insights into probabilistic outcomes; free will and effort remain the primary drivers of destiny.
        </p>
      </footer>
    </div>
  );

  return createPortal(content, document.body);
}

export default CosmicReportPrintView;
