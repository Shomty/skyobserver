import { Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LandingPageShell } from '../components/LandingPageShell';
import { lazyWithReload } from '../lib/lazyWithReload';

const LandingPage = lazyWithReload(() => import('../pages/LandingPage/index.tsx'));
const App = lazyWithReload(() => import('../App.tsx'));

/** Homepage: landing for visitors; full app only after a session is detected. */
export function HomeRoute() {
  const { user, ready } = useAuth();

  if (ready && user) {
    return (
      <Suspense fallback={<LandingPageShell />}>
        <App />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LandingPageShell />}>
      <LandingPage />
    </Suspense>
  );
}
