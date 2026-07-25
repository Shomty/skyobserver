export interface DashaSubPeriod {
  planet: string;
  startDate: string;
  endDate: string;
}

export interface DashaMahadashaPeriod {
  planet: string;
  startDate: string;
  endDate: string;
  subPeriods: DashaSubPeriod[];
}

export interface VimshottariDashasResponse {
  dashaPeriods: DashaMahadashaPeriod[];
  current: {
    mahadasha: DashaSubPeriod | null;
    antardasha: DashaSubPeriod | null;
  };
  birthNakshatra: string;
  birthDashaLord: string;
}

const inflight = new Map<string, Promise<VimshottariDashasResponse>>();

export async function fetchVimshottariDashas(
  birthTime: Date,
  lat: number,
  lon: number,
  timezone?: string | null,
): Promise<VimshottariDashasResponse> {
  const dedupKey = `${birthTime.toISOString()}_${lat.toFixed(4)}_${lon.toFixed(4)}_${timezone ?? ''}`;

  const existing = inflight.get(dedupKey);
  if (existing) return existing;

  const body: Record<string, unknown> = {
    isoDate: birthTime.toISOString(),
    lat,
    lon,
  };
  if (timezone) body.timezone = timezone;

  const promise = fetch('/api/vimshottari-dashas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Dasha timeline request failed (${response.status})`);
      }
      return response.json() as Promise<VimshottariDashasResponse>;
    })
    .finally(() => {
      inflight.delete(dedupKey);
    });

  inflight.set(dedupKey, promise);
  return promise;
}
