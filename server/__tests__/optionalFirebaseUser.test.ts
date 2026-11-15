import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { type AuthUser, createOptionalFirebaseUser, isVerifiedEmailOwner } from '../firebaseAuth.ts';

const verified: AuthUser = { uid: 'u1', email: 'Owner@Example.com', emailVerified: true, signInProvider: 'google.com' };

function run(authorization: string | undefined, verify: (token: string) => Promise<AuthUser>) {
  const req = { headers: authorization ? { authorization } : {} } as Request;
  const res = { locals: {} } as Response;
  const next = vi.fn() as unknown as NextFunction;
  return createOptionalFirebaseUser(verify)(req, res, next).then(() => ({ res, next }));
}

describe('createOptionalFirebaseUser', () => {
  it('continues without a user when no token is sent', async () => {
    const verify = vi.fn();
    const { res, next } = await run(undefined, verify);
    expect(verify).not.toHaveBeenCalled();
    expect(res.locals.user).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it('sets the user for a valid token', async () => {
    const { res, next } = await run('Bearer good', async () => verified);
    expect(res.locals.user).toEqual(verified);
    expect(next).toHaveBeenCalledOnce();
  });

  it('treats an invalid token as signed out instead of rejecting', async () => {
    const { res, next } = await run('Bearer bad', async () => { throw new Error('expired'); });
    expect(res.locals.user).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it('ignores anonymous sessions', async () => {
    const { res } = await run('Bearer anon', async () => ({ ...verified, signInProvider: 'anonymous' }));
    expect(res.locals.user).toBeUndefined();
  });
});

describe('isVerifiedEmailOwner', () => {
  it('matches a verified user to their email, case-insensitively', () => {
    expect(isVerifiedEmailOwner(verified, ' owner@example.COM ')).toBe(true);
  });

  it('rejects a different email, an unverified user, or no user', () => {
    expect(isVerifiedEmailOwner(verified, 'victim@example.com')).toBe(false);
    expect(isVerifiedEmailOwner({ ...verified, emailVerified: false }, 'owner@example.com')).toBe(false);
    expect(isVerifiedEmailOwner(undefined, 'owner@example.com')).toBe(false);
    expect(isVerifiedEmailOwner(verified, '')).toBe(false);
  });
});
