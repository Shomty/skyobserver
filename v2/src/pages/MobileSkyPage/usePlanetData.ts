import { useState, useEffect, useCallback } from 'react';
import { calculatePositions, PlanetPosition } from '../../vedic-utils';

export interface UserProfile {
  birthDate?: string;
  birthTime?: string;
  birthLat?: number;
  birthLon?: number;
  birthCity?: string;
  name?: string;
}

export type ViewMode = 'natal' | 'transit';

export function usePlanetData(mode: ViewMode, userProfile: UserProfile | null) {
  const [transitPositions, setTransitPositions] = useState<PlanetPosition[]>([]);
  const [birthPositions, setBirthPositions] = useState<PlanetPosition[] | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tick every minute for live transit
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Live transits
  useEffect(() => {
    let cancelled = false;
    const positions = calculatePositions(currentTime, undefined, undefined);
    if (!cancelled) setTransitPositions(positions);
    return () => { cancelled = true; };
  }, [currentTime]);

  // Birth chart positions
  useEffect(() => {
    if (!userProfile?.birthDate) return;
    let cancelled = false;

    const dt = userProfile.birthTime
      ? new Date(`${userProfile.birthDate}T${userProfile.birthTime}`)
      : new Date(`${userProfile.birthDate}T12:00`);

    const positions = calculatePositions(
      dt,
      userProfile.birthLat,
      userProfile.birthLon,
    );
    if (!cancelled) setBirthPositions(positions);
    return () => { cancelled = true; };
  }, [userProfile?.birthDate, userProfile?.birthTime, userProfile?.birthLat, userProfile?.birthLon]);

  const displayPositions = mode === 'natal' && birthPositions ? birthPositions : transitPositions;

  return { transitPositions, birthPositions, displayPositions, currentTime };
}
