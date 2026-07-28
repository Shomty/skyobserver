import React from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { StatTile } from '../ui';
import type { Ashtakavarga, PlanetPosition } from '../../vedic-utils';

const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function savBand(score: number): { label: string; color: string } {
  if (score >= 30) return { label: 'Supportive', color: 'text-green-500' };
  if (score >= 25) return { label: 'Mixed', color: 'text-jyotish-gold' };
  return { label: 'Challenging', color: 'text-red-400' };
}

interface SavSummaryTileProps {
  natalAshtakavarga: Ashtakavarga | null;
  birthPositions: PlanetPosition[] | null;
}

export function SavSummaryTile({ natalAshtakavarga, birthPositions }: SavSummaryTileProps) {
  const { theme } = useTheme();

  if (!natalAshtakavarga || !birthPositions) return null;

  const asc = birthPositions.find(p => p.name === 'Ascendant');
  if (!asc) return null;

  const lagnaIdx = RASHIS.indexOf(asc.rashi);
  if (lagnaIdx === -1) return null;

  const lagnaSav = natalAshtakavarga.sav[lagnaIdx];
  const band = savBand(lagnaSav);

  let strongestIdx = 0;
  let weakestIdx = 0;
  for (let i = 1; i < 12; i++) {
    if (natalAshtakavarga.sav[i] > natalAshtakavarga.sav[strongestIdx]) strongestIdx = i;
    if (natalAshtakavarga.sav[i] < natalAshtakavarga.sav[weakestIdx]) weakestIdx = i;
  }

  return (
    <div className="col-span-2">
      <StatTile
        label="Sarvashtakavarga (Lagna Sign)"
        value={
          <div className="flex items-center justify-between w-full gap-2">
            <span className={cn('font-mono', band.color)}>
              {lagnaSav} pts — {band.label}
            </span>
            <span className={cn('text-caption font-mono truncate', theme === 'dark' ? 'text-white/40' : 'text-ink-faint')}>
              {RASHIS[lagnaIdx]}
            </span>
          </div>
        }
        delta={
          <span className={cn('text-caption font-mono', theme === 'dark' ? 'text-white/50' : 'text-ink-muted')}>
            Strongest: {RASHIS[strongestIdx]} ({natalAshtakavarga.sav[strongestIdx]}) · Weakest: {RASHIS[weakestIdx]} ({natalAshtakavarga.sav[weakestIdx]})
          </span>
        }
      />
    </div>
  );
}
