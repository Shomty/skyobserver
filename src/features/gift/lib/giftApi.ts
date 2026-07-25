import type {
  CapacityResponse,
  GiftSlug,
  GiftSubmitPayload,
  SubmitResponse,
  SuggestionResponse,
  VerifyResponse,
} from '../types';

const MOCK_DELAY_MS = 600;

/** Mock until the real gift API ships. Opt out with VITE_GIFT_MOCK=0. */
function isMockMode(): boolean {
  const flag = import.meta.env.VITE_GIFT_MOCK;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  // Vite sometimes misses .env.local until restart — keep local demo working.
  return Boolean(import.meta.env.DEV);
}

function mockVariant(): string {
  if (typeof window === 'undefined') return 'ok';
  return new URLSearchParams(window.location.search).get('mock') ?? 'ok';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mockCapacity(gift: GiftSlug): Promise<CapacityResponse> {
  await delay(MOCK_DELAY_MS);
  const variant = mockVariant();
  if (variant === 'paused') {
    return {
      open: false,
      paused: true,
      resumeDate: '2026-08-01',
      message: 'Registrations are paused while we catch up.',
    };
  }
  void gift;
  return { open: true, paused: false };
}

async function mockSubmit(payload: GiftSubmitPayload): Promise<SubmitResponse> {
  await delay(MOCK_DELAY_MS);
  if (payload.meta.honeypot) {
    // Silently accept bots — backend would discard
    return { status: 'ok', maskedEmail: 'b***@example.com' };
  }
  const variant = mockVariant();
  const email = payload.values.email ?? 'user@example.com';
  const masked = maskEmail(email);

  switch (variant) {
    case 'duplicate':
      return { status: 'duplicate', maskedEmail: masked };
    case 'daily_cap':
      return { status: 'daily_cap' };
    case 'paused':
      return { status: 'paused', resumeDate: '2026-08-01' };
    case 'invalid':
      return { status: 'invalid', fieldErrors: { email: 'errors.email' } };
    case 'network':
      throw new Error('Network error (mock)');
    default:
      return { status: 'ok', maskedEmail: masked };
  }
}

async function mockSuggestion(): Promise<SuggestionResponse> {
  await delay(MOCK_DELAY_MS);
  if (mockVariant() === 'network') throw new Error('Network error (mock)');
  return { status: 'ok' };
}

async function mockVerify(token: string): Promise<VerifyResponse> {
  await delay(MOCK_DELAY_MS);
  const variant = mockVariant();
  if (variant === 'network') throw new Error('Network error (mock)');
  if (variant === 'expired' || token === 'expired') return { status: 'expired' };
  if (variant === 'invalid' || !token || token === 'invalid') return { status: 'invalid' };
  return { status: 'ok' };
}

export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return '***@***';
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

async function realJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Gift API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchCapacity(gift: GiftSlug): Promise<CapacityResponse> {
  if (isMockMode()) return mockCapacity(gift);
  return realJson(`/api/gift/capacity?gift=${encodeURIComponent(gift)}`);
}

export async function submitGift(payload: GiftSubmitPayload): Promise<SubmitResponse> {
  if (isMockMode()) return mockSubmit(payload);
  return realJson('/api/gift/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitSuggestion(body: {
  text: string;
  email?: string;
}): Promise<SuggestionResponse> {
  if (isMockMode()) return mockSuggestion();
  return realJson('/api/gift/suggestion', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function verifyGiftToken(token: string): Promise<VerifyResponse> {
  if (isMockMode()) return mockVerify(token);
  return realJson(`/api/gift/verify?token=${encodeURIComponent(token)}`);
}
