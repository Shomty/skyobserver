import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { PlanetPosition } from '../../vedic-utils';

// ── Layout constants (matches HTML prototype viewBox 390×430) ──────────────
const CX = 195;
const CY = 218;
const ARIES_DEG = 152; // Aries start: degrees clockwise from top (12 o'clock)

const R = {
  outerBg: 175,
  nakOut:  172,
  nakIn:   154,
  zodOut:  154,
  zodIn:   137,
  r1:      120,
  r2:      100,
  r3:       80,
  r4:       60,
  center:    8,
} as const;

// Concentric orbit radii for planet placement (avoids overlap)
const PLANET_ORBITS = [68, 78, 88, 98, 108, 118];

const ZODIAC_ABBR = ['ARI','TAU','GEM','CAN','LEO','VIR','LIB','SCO','SAG','CAP','AQU','PIS'];
const NAKS = ['ASW','BHA','KRI','ROH','MRI','ARD','PUN','PUS','ASL','MAG','PPH','UPH','HAS','CHI','SWT','VIS','ANU','JYE','MOL','PAS','UAS','SRA','DHA','SAT','PBH','UBH','REV'];

// Planet display names (short)
const PLANET_NAMES: Record<string, string> = {
  Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Merc',
  Jupiter: 'Jup', Venus: 'Venus', Saturn: 'Sat',
  Rahu: 'Rahu', Ketu: 'Ketu', Ascendant: 'ASC',
};

// ── Math helpers ──────────────────────────────────────────────────────────────
function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function arc(fromDeg: number, toDeg: number, r: number): string {
  const a = polar(fromDeg, r);
  const b = polar(toDeg, r);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

/** Map siderealLongitude (0–360 from Aries) → chart angle (clockwise from 12 o'clock) */
function lonToAngle(siderealLon: number): number {
  return (ARIES_DEG + siderealLon) % 360;
}

/** Spread overlapping planets onto different orbit rings */
function layoutPlanets(planets: PlanetPosition[]): Array<{ p: PlanetPosition; angle: number; r: number }> {
  const sorted = [...planets].sort((a, b) => a.siderealLongitude - b.siderealLongitude);
  const placed: Array<{ angle: number; r: number; p: PlanetPosition }> = [];

  sorted.forEach(p => {
    const angle = lonToAngle(p.siderealLongitude);
    // Find an orbit radius that doesn't clash with nearby planets (within 12°)
    let orbitIdx = 0;
    for (let i = 0; i < PLANET_ORBITS.length; i++) {
      const clash = placed.some(q => {
        const diff = Math.abs(angle - q.angle);
        const dist = Math.min(diff, 360 - diff);
        return dist < 12 && q.r === PLANET_ORBITS[i];
      });
      if (!clash) { orbitIdx = i; break; }
      orbitIdx = i; // worst case: use last available orbit
    }
    placed.push({ p, angle, r: PLANET_ORBITS[orbitIdx] });
  });

  return placed;
}

// ── Static star field (seeded so it's stable across renders) ─────────────────
function genStars(seed = 42) {
  const stars: Array<{ x: number; y: number; r: number; opacity: number }> = [];
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

  for (let i = 0; i < 140; i++) {
    const a = rand() * 360;
    const rr = Math.sqrt(rand()) * R.outerBg;
    const p = polar(a + 90, rr);
    stars.push({ x: p.x, y: p.y, r: rand() * 1.2 + 0.25, opacity: rand() * 0.5 + 0.1 });
  }
  return stars;
}
const STARS = genStars();

// ── Sub-components ─────────────────────────────────────────────────────────────

function Stars() {
  return (
    <g id="stars">
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
      ))}
    </g>
  );
}

function ChartRings() {
  return (
    <g id="rings">
      {/* Background glow */}
      <circle cx={CX} cy={CY} r={R.nakOut} fill="url(#chartGlow)" />
      <circle cx={CX} cy={CY} r={R.nakOut} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

      {/* 12 house spokes */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ARIES_DEG + i * 30;
        const p1 = polar(a, R.center + 2);
        const p2 = polar(a, R.nakOut);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />;
      })}

      {/* 27 nakshatra sub-spokes */}
      {Array.from({ length: 27 }, (_, i) => {
        const a = ARIES_DEG + i * (360 / 27);
        const p1 = polar(a, R.nakIn);
        const p2 = polar(a, R.nakOut);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.07)" strokeWidth={0.6} />;
      })}

      {/* Concentric rings */}
      {[
        { r: R.nakOut, stroke: 'rgba(255,255,255,0.14)', w: 0.8 },
        { r: R.nakIn,  stroke: 'rgba(255,255,255,0.20)', w: 1.0 },
        { r: R.zodIn,  stroke: 'rgba(255,255,255,0.14)', w: 0.8 },
        { r: R.r1,     stroke: 'rgba(0,184,156,0.40)',   w: 1.2 },
        { r: R.r2,     stroke: 'rgba(0,184,156,0.28)',   w: 1.0 },
        { r: R.r3,     stroke: 'rgba(120,60,220,0.22)',  w: 0.8 },
        { r: R.r4,     stroke: 'rgba(255,255,255,0.10)', w: 0.7 },
        { r: R.center, stroke: 'rgba(255,255,255,0.28)', w: 1.0 },
      ].map(({ r, stroke, w }, i) => (
        <circle key={i} cx={CX} cy={CY} r={r} fill="none" stroke={stroke} strokeWidth={w} />
      ))}
    </g>
  );
}

function ZodiacLabels() {
  return (
    <g id="zodiac">
      {/* Nakshatra labels */}
      {Array.from({ length: 27 }, (_, i) => {
        const mid = ARIES_DEG + (i + 0.5) * (360 / 27);
        const lr = (R.nakOut + R.nakIn) / 2 + 1;
        const p = polar(mid, lr);
        const rot = mid > 270 || mid <= 90 ? mid : mid - 180;
        return (
          <text
            key={i}
            x={p.x} y={p.y}
            transform={`rotate(${rot},${p.x},${p.y})`}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={6.5} fill="rgba(255,255,255,0.35)"
            fontFamily="ui-monospace,monospace" letterSpacing="0.04em"
          >
            {NAKS[i]}
          </text>
        );
      })}

      {/* Zodiac sign labels */}
      {Array.from({ length: 12 }, (_, i) => {
        const mid = ARIES_DEG + (i + 0.5) * 30;
        const lr = (R.zodOut + R.zodIn) / 2;
        const p = polar(mid, lr);
        return (
          <text
            key={i}
            x={p.x} y={p.y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={9.5} fill="rgba(255,255,255,0.50)" fontWeight={500}
          >
            {ZODIAC_ABBR[i]}
          </text>
        );
      })}
    </g>
  );
}

function Earth() {
  return (
    <g id="earth">
      <circle cx={CX} cy={CY} r={13} fill="rgba(68,153,238,0.15)" />
      <line x1={CX - 12} y1={CY} x2={CX + 12} y2={CY} stroke="rgba(68,153,238,0.4)" strokeWidth={0.8} />
      <line x1={CX} y1={CY - 12} x2={CX} y2={CY + 12} stroke="rgba(68,153,238,0.4)" strokeWidth={0.8} />
      <circle cx={CX} cy={CY} r={7} fill="#4499ee" filter="url(#glowMd)" />
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MobileSkyChartProps {
  positions: PlanetPosition[];
  ascendantPosition?: PlanetPosition;
  onPlanetTap: (planet: PlanetPosition) => void;
  zoom: number;
}

const PLANET_RADIUS = 10;

const MobileSkyChart: React.FC<MobileSkyChartProps> = ({ positions, ascendantPosition, onPlanetTap, zoom }) => {
  const placed = useMemo(() => {
    const visible = positions.filter(p => p.name !== 'Ascendant');
    return layoutPlanets(visible);
  }, [positions]);

  const asc = ascendantPosition ?? positions.find(p => p.name === 'Ascendant');
  const ascAngle = asc ? lonToAngle(asc.siderealLongitude) : null;

  const tx = CX * (1 - zoom);
  const ty = CY * (1 - zoom);
  const transform = `translate(${tx} ${ty}) scale(${zoom})`;

  return (
    <svg
      viewBox="0 0 390 430"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
    >
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#0e0b2c" />
          <stop offset="65%" stopColor="#060410" />
          <stop offset="100%" stopColor="#020108" />
        </radialGradient>
        <radialGradient id="chartGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#160f40" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#0a0820" stopOpacity={0} />
        </radialGradient>
        <filter id="glowMd" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={2.5} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowSm" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={1.5} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowXs" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={1} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="390" height="430" fill="url(#bgGrad)" />

      <g transform={transform}>
        <Stars />
        <ChartRings />
        <ZodiacLabels />

        {/* Ascendant marker */}
        {ascAngle !== null && (() => {
          const ascPos = polar(ascAngle, 118);
          return (
            <g>
              <circle cx={ascPos.x} cy={ascPos.y} r={14} fill="#00c090" filter="url(#glowSm)" />
              <text x={ascPos.x} y={ascPos.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={8} fontWeight={700} fill="white" pointerEvents="none">ASC</text>
            </g>
          );
        })()}

        {/* Planet bodies */}
        {placed.map(({ p, angle, r: orbit }) => {
          const pos = polar(angle, orbit);
          const bx = pos.x + PLANET_RADIUS - 1;
          const by = pos.y - PLANET_RADIUS + 1;
          const isAsc = p.name === 'Ascendant';
          if (isAsc) return null;

          return (
            <g
              key={p.name}
              role="button"
              aria-label={p.name}
              style={{ cursor: 'pointer' }}
              onClick={() => onPlanetTap(p)}
            >
              {/* Halo */}
              <circle cx={pos.x} cy={pos.y} r={PLANET_RADIUS + 4} fill={`${p.color}28`} />
              {/* Main badge */}
              <circle cx={pos.x} cy={pos.y} r={PLANET_RADIUS} fill={p.color} filter="url(#glowXs)" />
              {/* Symbol */}
              <text x={pos.x} y={pos.y + 0.5} textAnchor="middle" dominantBaseline="middle"
                fontSize={12} fill="white" fontWeight={600} pointerEvents="none">
                {p.symbol}
              </text>
              {/* Retrograde badge */}
              {p.isRetrograde && (
                <>
                  <circle cx={bx} cy={by} r={5.5} fill="#e85d04" />
                  <text x={bx} y={by + 0.5} textAnchor="middle" dominantBaseline="middle"
                    fontSize={6.5} fill="white" fontWeight={700} pointerEvents="none">R</text>
                </>
              )}
            </g>
          );
        })}

        <Earth />
      </g>
    </svg>
  );
};

export default MobileSkyChart;
