import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculatePositions, type PlanetPosition } from '../../../vedic-utils';
import { fetchPlanetPositions } from '../../../services/positionsService';

export interface TeaserCoordinates {
  latitude: number;
  longitude: number;
  label: string;
}

const DEFAULT_LOCATION: TeaserCoordinates = {
  latitude: 51.5074,
  longitude: -0.1278,
  label: 'London, UK',
};

export type TeaserLocationStatus = 'idle' | 'requesting' | 'active' | 'approximate' | 'denied';

async function resolveLocationLabel(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (!res.ok) return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    const data = await res.json() as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      address?: { city?: string; town?: string };
    };
    return (
      data.city
      || data.locality
      || data.principalSubdivision
      || data.address?.city
      || data.address?.town
      || `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    );
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

export function useTeaserAstronomy() {
  const [now, setNow] = useState(() => new Date());
  const [coordinates, setCoordinates] = useState<TeaserCoordinates>(DEFAULT_LOCATION);
  const [locationStatus, setLocationStatus] = useState<TeaserLocationStatus>('idle');
  const [positions, setPositions] = useState<PlanetPosition[]>(() =>
    calculatePositions(new Date(), DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude),
  );
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [hasServerPositions, setHasServerPositions] = useState(false);

  const minuteKey = Math.floor(now.getTime() / 60_000);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchPlanetPositions(now, coordinates.latitude, coordinates.longitude)
      .then((pos) => {
        if (cancelled) return;
        setPositions(pos);
        setHasServerPositions(true);
        setPositionsError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setPositions(calculatePositions(now, coordinates.latitude, coordinates.longitude));
        if (!hasServerPositions) {
          setPositionsError('Using local ephemeris — high-precision server unavailable.');
        }
      })
      .finally(() => {
        if (!cancelled) setPositionsLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minuteKey, coordinates.latitude, coordinates.longitude]);

  const mapOffset = useMemo(() => {
    const ascendant = positions.find((p) => p.name === 'Ascendant');
    return ascendant ? -ascendant.siderealLongitude - 90 : 0;
  }, [positions]);

  const applyCoordinates = useCallback(async (
    latitude: number,
    longitude: number,
    status: Extract<TeaserLocationStatus, 'active' | 'approximate'>,
    preferredLabel?: string,
  ) => {
    const label = preferredLabel || await resolveLocationLabel(latitude, longitude);
    setCoordinates({ latitude, longitude, label });
    setLocationStatus(status);
  }, []);

  const requestIpLocation = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/ip-location');
      if (!res.ok) return false;
      const data = await res.json() as {
        latitude?: number;
        longitude?: number;
        label?: string;
      };
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return false;
      await applyCoordinates(data.latitude, data.longitude, 'approximate', data.label);
      return true;
    } catch {
      return false;
    }
  }, [applyCoordinates]);

  const requestLocation = useCallback(() => {
    setLocationStatus('requesting');

    const canUseGps = window.isSecureContext && 'geolocation' in navigator;
    if (!canUseGps) {
      void requestIpLocation().then((ok) => {
        if (!ok) setLocationStatus('denied');
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void applyCoordinates(coords.latitude, coords.longitude, 'active');
      },
      () => {
        void requestIpLocation().then((ok) => {
          if (!ok) setLocationStatus('denied');
        });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [applyCoordinates, requestIpLocation]);

  const locationStatusMessage = useMemo(() => {
    if (locationStatus === 'active') return 'Chart updated for your coordinates.';
    if (locationStatus === 'approximate') {
      return window.isSecureContext
        ? 'Using approximate city-level location from your network.'
        : 'Precise GPS needs HTTPS. Using approximate city-level location instead.';
    }
    if (locationStatus === 'denied') {
      return window.isSecureContext
        ? 'Location unavailable. Showing London until you allow access.'
        : 'Location unavailable on this connection. Showing London.';
    }
    return 'Showing London, UK until you share your location.';
  }, [locationStatus]);

  return {
    now,
    coordinates,
    locationStatus,
    locationStatusMessage,
    positions,
    positionsLoading,
    positionsError,
    mapOffset,
    requestLocation,
  };
}
