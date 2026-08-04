/** Test accounts that see the full career report without signup gating. */
export const CAREER_PREMIUM_TEST_EMAILS = new Set([
  'mmilos085@gmail.com',
  'shomty@hotmail.com',
]);

export function normalizePremiumEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Unlock Parashari sections, Career Drive score, and extra fields. */
export function hasCareerPremiumAccess(
  email: string | null | undefined,
  role: string | null | undefined,
): boolean {
  if (role === 'admin') return true;
  if (!email) return false;
  return CAREER_PREMIUM_TEST_EMAILS.has(normalizePremiumEmail(email));
}

/**
 * Premium state for the career report.
 *
 * `signedInUnlocked` comes from the authenticated account (admin role or an
 * allowlisted address). `reportEmail` is the address the report on screen was
 * generated for: the two test accounts unlock without signing in, so the full
 * report can be reviewed anonymously. Everyone else stays gated — an ordinary
 * visitor cannot unlock by typing their own address.
 */
export function resolveCareerPremiumUnlocked(
  signedInUnlocked: boolean,
  reportEmail: string | null | undefined,
): boolean {
  return signedInUnlocked || hasCareerPremiumAccess(reportEmail, null);
}
