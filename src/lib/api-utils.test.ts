import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthRequiredError, callGeminiProxy, configureGeminiAuth, isAuthRequiredError } from './api-utils';

const PARAMS = { model: 'gemini-3-flash-preview', contents: 'hi' };

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('callGeminiProxy auth', () => {
  it('throws AuthRequiredError without sending a request when signed out', async () => {
    const fetchMock = mockFetch(200, { text: 'x' });
    configureGeminiAuth(async () => null);
    await expect(callGeminiProxy(PARAMS)).rejects.toBeInstanceOf(AuthRequiredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the ID token as a Bearer header', async () => {
    const fetchMock = mockFetch(200, { text: 'answer' });
    configureGeminiAuth(async () => 'id-token-1');
    await expect(callGeminiProxy(PARAMS)).resolves.toBe('answer');
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer id-token-1');
  });

  it('maps a 401 to AuthRequiredError and does not retry it', async () => {
    const fetchMock = mockFetch(401, { error: 'Session expired', code: 'auth_required' });
    configureGeminiAuth(async () => 'stale');
    const error = await callGeminiProxy(PARAMS).catch((e: unknown) => e);
    expect(isAuthRequiredError(error)).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('does not retry a daily quota rejection', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = mockFetch(429, { error: 'Daily AI limit reached', code: 'quota' });
    configureGeminiAuth(async () => 'token');
    await expect(callGeminiProxy(PARAMS)).rejects.toThrow(/Daily AI limit/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
