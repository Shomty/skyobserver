import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { createRequireFirebaseUser, type AuthUser } from '../firebaseAuth.ts';
import {
  createGeminiProxyRouter,
  createGeminiQuota,
  MAX_OUTPUT_TOKENS,
  sanitizeGeminiRequest,
} from '../geminiProxy.ts';
import { QuotaExceededError } from '../mcp/toolResult.ts';

const MODEL = 'gemini-3-flash-preview';
const USERS: Record<string, AuthUser> = {
  'token-ana': { uid: 'ana', email: 'ana@example.com', emailVerified: true, signInProvider: 'google.com' },
  'token-bo': { uid: 'bo', email: 'bo@example.com', emailVerified: true, signInProvider: 'google.com' },
  'token-anon': { uid: 'anon', email: null, emailVerified: false, signInProvider: 'anonymous' },
};
const verify = vi.fn(async (token: string) => {
  const user = USERS[token];
  if (!user) throw new Error('bad token');
  return user;
});

describe('sanitizeGeminiRequest', () => {
  it('accepts the shapes the app sends and clamps the output budget', () => {
    const single = sanitizeGeminiRequest({ model: MODEL, contents: 'Hello', config: { temperature: 0.6 } });
    expect(single).toMatchObject({ ok: true, params: { config: { temperature: 0.6, maxOutputTokens: MAX_OUTPUT_TOKENS } } });

    const chat = sanitizeGeminiRequest({
      model: MODEL,
      contents: [
        { role: 'user', parts: [{ text: 'hi' }] },
        { role: 'model', parts: [{ text: 'hello' }] },
      ],
      config: { systemInstruction: 'Be kind', maxOutputTokens: 100_000, responseMimeType: 'application/json', responseSchema: { type: 'OBJECT' } },
    });
    expect(chat).toMatchObject({ ok: true, params: { config: { maxOutputTokens: MAX_OUTPUT_TOKENS } } });
  });

  it('rejects other models, tools, unknown keys and non-text parts', () => {
    expect(sanitizeGeminiRequest({ model: 'gemini-ultra', contents: 'x' }).ok).toBe(false);
    expect(sanitizeGeminiRequest({ model: MODEL, contents: 'x', config: { tools: [{ googleSearch: {} }] } }).ok).toBe(false);
    expect(sanitizeGeminiRequest({ model: MODEL, contents: 'x', cachedContent: 'c' }).ok).toBe(false);
    expect(sanitizeGeminiRequest({ model: MODEL, contents: 'x', generationConfig: {} }).ok).toBe(false);
    expect(sanitizeGeminiRequest({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] }],
    }).ok).toBe(false);
    expect(sanitizeGeminiRequest({ model: MODEL, contents: '' }).ok).toBe(false);
  });
});

describe('createGeminiQuota', () => {
  const verified = (uid: string) => ({ uid, emailVerified: true });

  it('enforces per-user minute and day limits and a global day cap', () => {
    let t = 0;
    const charge = createGeminiQuota({ perUserPerMinute: 2, perUserPerDay: 3, unverifiedPerDay: 1, globalPerDay: 4 }, () => t);
    charge(verified('a'));
    charge(verified('a'));
    expect(() => charge(verified('a'))).toThrow(/try again in/);
    t += 60_000;
    charge(verified('a'));
    expect(() => charge(verified('a'))).toThrow(/Daily AI limit/);
    charge(verified('b'));
    expect(() => charge(verified('c'))).toThrow(/daily capacity/);
  });

  it('gives unverified accounts the smaller daily limit', () => {
    let t = 0;
    const charge = createGeminiQuota({ perUserPerMinute: 10, perUserPerDay: 10, unverifiedPerDay: 1, globalPerDay: 100 }, () => t);
    charge({ uid: 'u', emailVerified: false });
    t += 60_000;
    expect(() => charge({ uid: 'u', emailVerified: false })).toThrow(/Verify your email/);
  });

  it('does not charge the per-user windows when the global cap rejects', () => {
    const charge = createGeminiQuota({ perUserPerMinute: 5, perUserPerDay: 5, unverifiedPerDay: 5, globalPerDay: 1 }, () => 0);
    charge(verified('a'));
    expect(() => charge(verified('b'))).toThrow(QuotaExceededError);
    expect(() => charge(verified('b'))).toThrow(/daily capacity/); // still global, not b's own minute limit
  });

  it('refund gives back the whole charge', () => {
    const charge = createGeminiQuota({ perUserPerMinute: 1, perUserPerDay: 1, unverifiedPerDay: 1, globalPerDay: 1 }, () => 0);
    const refund = charge(verified('a'));
    refund();
    expect(() => charge(verified('a'))).not.toThrow();
  });
});

describe('every real call-site shape passes the allowlist', () => {
  const chat = [
    { role: 'user', parts: [{ text: 'Earlier question' }] },
    { role: 'model', parts: [{ text: 'Earlier answer' }] },
    { role: 'user', parts: [{ text: 'New question' }] },
  ];
  const cases: Record<string, unknown> = {
    'App.tsx transit interpretation': { model: MODEL, contents: [chat[0]], config: { systemInstruction: 'sys', temperature: 0.7 } },
    'AIAssistant / AIChatPage chat': { model: MODEL, contents: chat, config: { systemInstruction: 'sys', temperature: 0.7, topP: 0.95, topK: 40 } },
    'DataDashboard insights': { model: MODEL, contents: [chat[0]], config: { temperature: 0.75, topP: 0.9, topK: 40 } },
    'DataDashboard JSON array schema': { model: MODEL, contents: [chat[0]], config: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'OBJECT' } } } },
    'geminiService JSON reports': { model: MODEL, contents: 'prompt', config: { responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: {} } } },
    'funnel text syntheses': { model: MODEL, contents: 'prompt', config: { temperature: 0.65, maxOutputTokens: 4096 } },
  };
  for (const [name, body] of Object.entries(cases)) {
    it(name, () => {
      expect(sanitizeGeminiRequest(body)).toMatchObject({ ok: true });
    });
  }
});

describe('POST /api/gemini', () => {
  const generateContent = vi.fn(async () => ({ text: 'An answer.' }));
  let server: Server;
  let url: string;

  beforeAll(async () => {
    const app = express();
    app.use('/api/gemini', createGeminiProxyRouter({
      ai: { models: { generateContent } } as never,
      requireUser: createRequireFirebaseUser(verify),
      limits: { perUserPerMinute: 3, perUserPerDay: 100, unverifiedPerDay: 100, globalPerDay: 100 },
    }));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/gemini`;
  });

  afterAll(() => server.close());

  beforeEach(() => {
    generateContent.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const post = (body: unknown, token?: string) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  it('rejects anonymous and invalid tokens with 401 before touching Gemini', async () => {
    const anon = await post({ model: MODEL, contents: 'hi' });
    expect(anon.status).toBe(401);
    expect((await anon.json()).code).toBe('auth_required');
    expect((await post({ model: MODEL, contents: 'hi' }, 'forged')).status).toBe(401);
    expect((await post({ model: MODEL, contents: 'hi' }, 'token-anon')).status).toBe(401);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('forwards an allowlisted request for a signed-in user', async () => {
    const res = await post({ model: MODEL, contents: 'hi', config: { temperature: 0.7 } }, 'token-ana');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: 'An answer.' });
    expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: MODEL,
      config: { temperature: 0.7, maxOutputTokens: MAX_OUTPUT_TOKENS },
    }));
  });

  it('rejects disallowed requests with 400', async () => {
    const res = await post({ model: MODEL, contents: 'hi', config: { tools: [{}] } }, 'token-bo');
    expect(res.status).toBe(400);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('returns 429 with code "quota" once the user is over the limit', async () => {
    for (let i = 0; i < 3; i++) await post({ model: MODEL, contents: 'hi' }, 'token-bo');
    const res = await post({ model: MODEL, contents: 'hi' }, 'token-bo');
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe('quota');
  });

  it('hides SDK error details but keeps 429 for backoff', async () => {
    generateContent.mockRejectedValueOnce(Object.assign(new Error('internal key detail'), { status: 500 }));
    const failed = await post({ model: MODEL, contents: 'hi' }, 'token-ana');
    expect(failed.status).toBe(502);
    expect(JSON.stringify(await failed.json())).not.toContain('key detail');

    generateContent.mockRejectedValueOnce(Object.assign(new Error('rate'), { status: 429 }));
    expect((await post({ model: MODEL, contents: 'hi' }, 'token-ana')).status).toBe(429);

    // Both failures were refunded: ana has used 1 of 3 this minute (earlier
    // test), so exactly 2 more succeed. Without refunds the first would be 429.
    expect((await post({ model: MODEL, contents: 'hi' }, 'token-ana')).status).toBe(200);
    expect((await post({ model: MODEL, contents: 'hi' }, 'token-ana')).status).toBe(200);
    expect((await post({ model: MODEL, contents: 'hi' }, 'token-ana')).status).toBe(429);
  });

  it('answers malformed and oversized bodies without a stack trace', async () => {
    expect((await post('{nope', 'token-ana')).status).toBe(400);
    const big = await post({ model: MODEL, contents: 'x'.repeat(300_000) }, 'token-ana');
    expect(big.status).toBe(413);
  });
});
