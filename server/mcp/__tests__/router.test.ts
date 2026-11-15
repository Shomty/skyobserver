import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { hashApiKey } from '../auth.ts';
import { createMcpRouter } from '../router.ts';

const KEY = 'sbk_router-test-key';
const HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };

function listen(env: NodeJS.ProcessEnv): Promise<{ server: Server; url: string }> {
  // Mounted the way server.ts does it: before any global body parser.
  const app = express();
  app.use('/mcp', createMcpRouter(env));
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, url: `http://127.0.0.1:${port}/mcp` });
    });
  });
}

const rpc = (method: string, params: Record<string, unknown> = {}, id = 1) =>
  JSON.stringify({ jsonrpc: '2.0', id, method, params });

const INIT = rpc('initialize', {
  protocolVersion: '2025-06-18',
  capabilities: {},
  clientInfo: { name: 'router-test', version: '0' },
});

let configured: { server: Server; url: string };
let unconfigured: { server: Server; url: string };

beforeAll(async () => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  configured = await listen({ MCP_API_KEYS: `acme:${hashApiKey(KEY)}` });
  unconfigured = await listen({});
});

afterAll(() => {
  configured.server.close();
  unconfigured.server.close();
});

describe('POST /mcp', () => {
  it('returns 401 without a key', async () => {
    const res = await fetch(configured.url, { method: 'POST', headers: HEADERS, body: INIT });
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toMatch(/Bearer/);
  });

  it('returns 401 for a wrong key', async () => {
    const res = await fetch(configured.url, {
      method: 'POST', headers: { ...HEADERS, Authorization: 'Bearer sbk_nope' }, body: INIT,
    });
    expect(res.status).toBe(401);
  });

  it('returns 503 when no keys are configured', async () => {
    const res = await fetch(unconfigured.url, {
      method: 'POST', headers: { ...HEADERS, Authorization: `Bearer ${KEY}` }, body: INIT,
    });
    expect(res.status).toBe(503);
  });

  it('initializes and lists tools with a valid key (stateless, JSON responses)', async () => {
    const auth = { ...HEADERS, Authorization: `Bearer ${KEY}` };
    const init = await fetch(configured.url, { method: 'POST', headers: auth, body: INIT });
    expect(init.status).toBe(200);
    const initBody = await init.json();
    expect(initBody.result.serverInfo.name).toBe('soulblueprint');
    expect(init.headers.get('mcp-session-id')).toBeNull();

    const list = await fetch(configured.url, {
      method: 'POST',
      headers: { ...auth, 'mcp-protocol-version': '2025-06-18' },
      body: rpc('tools/list', {}, 2),
    });
    expect(list.status).toBe(200);
    const listBody = await list.json();
    expect(listBody.result.tools.map((t: { name: string }) => t.name)).toContain('get_birth_chart');
  });
});

describe('request bodies', () => {
  const auth = { ...HEADERS, Authorization: `Bearer ${KEY}` };

  it('answers malformed JSON with a JSON-RPC parse error', async () => {
    const res = await fetch(configured.url, { method: 'POST', headers: auth, body: '{not json' });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(-32700);
  });

  it('rejects oversized bodies', async () => {
    const res = await fetch(configured.url, { method: 'POST', headers: auth, body: JSON.stringify({ pad: 'x'.repeat(70_000) }) });
    expect(res.status).toBe(413);
  });
});

describe('other methods', () => {
  it('GET and DELETE answer 405 (no server-initiated streams or sessions)', async () => {
    expect((await fetch(configured.url, { method: 'GET' })).status).toBe(405);
    expect((await fetch(configured.url, { method: 'DELETE' })).status).toBe(405);
  });
});
