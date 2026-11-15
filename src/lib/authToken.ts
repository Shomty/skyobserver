/**
 * The signed-in user's Firebase ID token, or null when signed out. Firebase is
 * imported lazily so callers outside the authenticated app do not pull the
 * auth bundle up front; `authStateReady` waits for a restored session.
 */
export async function getCurrentIdToken(): Promise<string | null> {
  const { auth } = await import('../firebase');
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

/** `headers` plus `Authorization: Bearer <idToken>` when someone is signed in. */
export async function withAuthHeader(headers: Record<string, string>): Promise<Record<string, string>> {
  const token = await getCurrentIdToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}
