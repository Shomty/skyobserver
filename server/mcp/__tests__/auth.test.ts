import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { createApiKeyAuth, findClient, hashApiKey, parseApiKeys } from '../auth.ts';

const KEY = 'sbk_test-key-123';
const ENTRY = `acme:${hashApiKey(KEY)}`;

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    locals: {} as Record<string, unknown>,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
    setHeader(name: string, value: string) { this.headers[name] = value; },
  };
  return res;
}

function run(entries: ReturnType<typeof parseApiKeys>, authorization?: string) {
  const req = { headers: authorization ? { authorization } : {} } as Request;
  const res = mockRes();
  const next = vi.fn();
  createApiKeyAuth(entries)(req, res as unknown as Response, next);
  return { res, next };
}

describe('parseApiKeys', () => {
  it('returns no entries when unset or blank', () => {
    expect(parseApiKeys(undefined)).toEqual([]);
    expect(parseApiKeys('  ')).toEqual([]);
  });

  it('parses comma-separated clientId:hash pairs', () => {
    const entries = parseApiKeys(`${ENTRY}, beta:${hashApiKey('other')}`);
    expect(entries.map((e) => e.clientId)).toEqual(['acme', 'beta']);
  });

  it('throws on malformed entries instead of silently ignoring them', () => {
    expect(() => parseApiKeys('acme')).toThrow(/Invalid MCP_API_KEYS/);
    expect(() => parseApiKeys('acme:nothex')).toThrow(/Invalid MCP_API_KEYS/);
    expect(() => parseApiKeys(`bad id:${hashApiKey(KEY)}`)).toThrow(/Invalid MCP_API_KEYS/);
  });
});

describe('findClient', () => {
  it('matches the key whose hash is configured', () => {
    expect(findClient(parseApiKeys(ENTRY), KEY)).toEqual({ id: 'acme' });
  });

  it('rejects an unknown key', () => {
    expect(findClient(parseApiKeys(ENTRY), 'sbk_wrong')).toBeNull();
  });
});

describe('createApiKeyAuth', () => {
  const entries = parseApiKeys(ENTRY);

  it('passes a valid Bearer key through and identifies the client', () => {
    const { res, next } = run(entries, `Bearer ${KEY}`);
    expect(next).toHaveBeenCalledOnce();
    expect(res.locals.mcpClient).toEqual({ id: 'acme' });
  });

  it('rejects a missing key with 401 and a WWW-Authenticate challenge', () => {
    const { res, next } = run(entries);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.headers['WWW-Authenticate']).toMatch(/^Bearer/);
  });

  it('rejects a wrong key or a non-Bearer scheme with 401', () => {
    expect(run(entries, 'Bearer sbk_wrong').res.statusCode).toBe(401);
    expect(run(entries, `Basic ${KEY}`).res.statusCode).toBe(401);
  });

  it('answers 503 when no keys are configured', () => {
    const { res, next } = run([], `Bearer ${KEY}`);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(503);
  });
});
