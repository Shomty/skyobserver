import { searchPlaces } from '../../gift/lib/geocode';
import type { PlaceResolution } from '../../gift/types';

interface ReverseGeocodeBody {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
}

function labelFromReverse(body: ReverseGeocodeBody): string {
  return [body.city ?? body.locality, body.principalSubdivision, body.countryName]
    .filter(Boolean)
    .join(', ');
}

async function timezoneForCoords(lat: number, lon: number, labelHint: string): Promise<PlaceResolution | null> {
  const results = await searchPlaces(labelHint || `${lat.toFixed(2)},${lon.toFixed(2)}`);
  const nearest = results[0];
  if (nearest) {
    return {
      ...nearest,
      latitude: lat,
      longitude: lon,
    };
  }
  return null;
}

/** Browser GPS → reverse geocode → Open-Meteo timezone lookup. */
export async function resolveBrowserGeolocation(): Promise<PlaceResolution> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not available in this browser');
  }

  const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(new Error(err.message || 'Could not read GPS location')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });

  const revRes = await fetch(
    `/api/reverse-geocode?lat=${coords.latitude}&lon=${coords.longitude}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!revRes.ok) throw new Error('Reverse geocoding failed');

  const body = (await revRes.json()) as ReverseGeocodeBody;
  const label = labelFromReverse(body) || 'Current location';
  const place = await timezoneForCoords(coords.latitude, coords.longitude, label);
  if (!place) throw new Error('Could not resolve timezone for your location');
  return { ...place, label: place.label || label };
}

interface IpLocationResponse {
  latitude: number;
  longitude: number;
  label: string;
  timezone?: string;
  source?: string;
}

/** IP-based approximate location — fallback when GPS is denied or unavailable. */
export async function resolveIpLocation(): Promise<PlaceResolution> {
  const res = await fetch('/api/ip-location', { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'IP location unavailable');
  }
  const data = (await res.json()) as IpLocationResponse;

  if (data.timezone) {
    return {
      label: data.label,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
    };
  }

  const place = await timezoneForCoords(data.latitude, data.longitude, data.label);
  if (!place) throw new Error('Could not resolve timezone for approximate location');
  return { ...place, label: data.label };
}
