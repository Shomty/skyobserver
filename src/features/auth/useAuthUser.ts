import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase';

export interface AuthUserState {
  user: User | null;
  /** False until Firebase has restored (or ruled out) a session. */
  ready: boolean;
}

/** The signed-in Firebase user, for pages that live outside App.tsx (the funnels). */
export function useAuthUser(): AuthUserState {
  const [state, setState] = useState<AuthUserState>({ user: auth.currentUser, ready: false });

  useEffect(() => onAuthStateChanged(auth, (user) => setState({ user, ready: true })), []);

  return state;
}
