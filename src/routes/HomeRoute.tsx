import '../landing.css';
import { Suspense } from 'react';
import { LandingPageShell } from '../components/LandingPageShell';
import { lazyWithReload } from '../lib/lazyWithReload';

const LandingPage = lazyWithReload(() => import('../pages/LandingPage/index.tsx'));

/** Homepage always serves the lightweight landing bundle — no Firebase auth probe. */
export function HomeRoute() {
  return (
    <Suspense fallback={<LandingPageShell />}>
      <LandingPage />
    </Suspense>
  );
}
