import { describe, expect, it, vi } from 'vitest';
import type { Request, RequestHandler, Response } from 'express';
import { createAiWriteGuard } from '../aiWriteGuard.ts';
import type { AuthUser } from '../firebaseAuth.ts';

function fakeRequireUser(user: AuthUser | null): RequestHandler {
  return (_req, res, next) => {
    if (!user) {
      res.status(401).json({ code: 'auth_required' });
      return;
    }
    res.locals.user = user;
    next();
  };
}

function run(body: Record<string, unknown>, user: AuthUser | null) {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    locals: {} as Record<string, unknown>,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  const next = vi.fn();
  createAiWriteGuard(fakeRequireUser(user))({ body } as Request, res as unknown as Response, next);
  return { res, next };
}

const OWNER: AuthUser = { uid: 'u1', email: 'Owner@Example.com', emailVerified: true };

describe('createAiWriteGuard', () => {
  it('lets non-AI saves and lookups through without a token', () => {
    expect(run({ email: 'x@y.z', fingerprint: 'abcdefgh', snapshot: {} }, null).next).toHaveBeenCalled();
  });

  it('requires a signed-in user to save AI text', () => {
    const { res, next } = run({ email: 'owner@example.com', reportId: 'r', aiSynthesis: { text: 't' } }, null);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('allows the owner (verified email, case-insensitive)', () => {
    expect(run({ email: 'owner@example.com', reportId: 'r', aiGuidance: {} }, OWNER).next).toHaveBeenCalled();
  });

  it('rejects another user or an unverified email with 403', () => {
    const other = run({ email: 'owner@example.com', reportId: 'r', aiSynthesis: {} },
      { uid: 'u2', email: 'other@example.com', emailVerified: true });
    expect(other.res.statusCode).toBe(403);
    const unverified = run({ email: 'owner@example.com', reportId: 'r', aiTransitGuidance: {} },
      { ...OWNER, emailVerified: false });
    expect(unverified.res.statusCode).toBe(403);
  });
});
