import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { type AuthUser, isVerifiedEmailOwner } from './firebaseAuth.ts';

const AI_FIELDS = ['aiSynthesis', 'aiPlainSynthesis', 'aiGuidance', 'aiTransitGuidance'] as const;

function carriesAiText(body: unknown): boolean {
  return typeof body === 'object' && body !== null
    && AI_FIELDS.some((field) => (body as Record<string, unknown>)[field] !== undefined);
}

/**
 * Guards the funnel report-cache POSTs. Saving AI text into a shared report
 * requires a signed-in user whose verified email is the report's email; the
 * cache's `update*` functions then check that email against the stored owner.
 * Other POSTs (save a computed reading, look one up) pass through unchanged.
 */
export function createAiWriteGuard(requireUser: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!carriesAiText(req.body)) {
      next();
      return;
    }
    requireUser(req, res, (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }
      const user = res.locals.user as AuthUser;
      const email = typeof req.body.email === 'string' ? req.body.email : '';
      if (!isVerifiedEmailOwner(user, email)) {
        res.status(403).json({ error: 'Only the report owner can save its AI interpretation', code: 'not_owner' });
        return;
      }
      next();
    });
  };
}
