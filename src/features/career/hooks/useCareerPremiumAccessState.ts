import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, fetchWithRetry } from '../../../firebase';
import { hasCareerPremiumAccess } from '../lib/careerPremiumAccess';

export function useCareerPremiumAccessState() {
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void (async () => {
        if (!user?.email) {
          setPremiumUnlocked(false);
          setLoading(false);
          return;
        }

        if (hasCareerPremiumAccess(user.email, null)) {
          setPremiumUnlocked(true);
          setLoading(false);
          return;
        }

        try {
          const userDoc = await fetchWithRetry(() => getDoc(doc(db, 'users', user.uid)));
          const role = userDoc.exists() ? (userDoc.data().role as string | undefined) : undefined;
          setPremiumUnlocked(hasCareerPremiumAccess(user.email, role));
        } catch {
          setPremiumUnlocked(false);
        } finally {
          setLoading(false);
        }
      })();
    });

    return unsubscribe;
  }, []);

  return { premiumUnlocked, loading };
}
