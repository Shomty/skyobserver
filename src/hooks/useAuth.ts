import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

/** Minimal auth state for route gating — defers Firebase until first mount. */
export function useAuth(): { user: User | null; ready: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    import('../firebase').then(({ auth, onAuthStateChanged }) => {
      if (cancelled) return;
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { user, ready };
}
