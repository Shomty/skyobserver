import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { NextFunction, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/** The verified caller, available as `res.locals.user` after `requireFirebaseUser`. */
export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  /** e.g. `google.com`, `password`, `anonymous`. */
  signInProvider?: string;
}

export type TokenVerifier = (idToken: string) => Promise<AuthUser>;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** FIREBASE_PROJECT_ID, else the projectId in firebase-applet-config.json (the browser's config). */
export function resolveFirebaseProjectId(env: NodeJS.ProcessEnv = process.env): string {
  if (env.FIREBASE_PROJECT_ID) return env.FIREBASE_PROJECT_ID;
  try {
    const raw = readFileSync(path.join(repoRoot, 'firebase-applet-config.json'), 'utf8');
    const projectId = (JSON.parse(raw) as { projectId?: unknown }).projectId;
    if (typeof projectId === 'string' && projectId) return projectId;
  } catch {
    // fall through to the error below
  }
  throw new Error('Firebase project id not found: set FIREBASE_PROJECT_ID or provide firebase-applet-config.json');
}

/**
 * Verifies Firebase ID tokens with the Admin SDK. Only the project id is needed:
 * verification uses Google's public signing keys, not a service account.
 */
export function createFirebaseTokenVerifier(projectId: string): TokenVerifier {
  const app = getApps().find((a) => a.name === 'token-verifier')
    ?? initializeApp({ projectId }, 'token-verifier');
  const auth = getAuth(app);
  return async (idToken) => {
    const decoded = await auth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      emailVerified: decoded.email_verified === true,
      signInProvider: decoded.firebase?.sign_in_provider,
    };
  };
}

function readBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match ? match[1] : null;
}

/** Express middleware: 401 `auth_required` unless a valid Firebase ID token is presented. */
export function createRequireFirebaseUser(verify: TokenVerifier) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = readBearer(req);
    if (!token) {
      res.status(401).json({ error: 'Sign in required', code: 'auth_required' });
      return;
    }
    let user: AuthUser;
    try {
      user = await verify(token);
    } catch {
      res.status(401).json({ error: 'Session expired — please sign in again', code: 'auth_required' });
      return;
    }
    // Anonymous sessions cost nothing to mint, so they do not count as an account.
    if (user.signInProvider === 'anonymous') {
      res.status(401).json({ error: 'Sign in required', code: 'auth_required' });
      return;
    }
    res.locals.user = user;
    next();
  };
}
