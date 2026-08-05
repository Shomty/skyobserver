import React, { lazy, useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { trackEvent } from '../../lib/analytics';
import { landingJsonLd, usePageMeta } from '../../lib/seo';
import { SITE } from '../../lib/siteConfig';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { LandingFeatureGrid } from './LandingFeatureGrid';
import { LandingSignUpCTA } from './LandingSignUpCTA';
import { LandingFooter } from './LandingFooter';
import { SampleAIInterpretation, TimingTeaser } from './components';
import { LazyWhenVisible } from '../../components/LazyWhenVisible';
import { HeroChartTeaser } from './components/HeroChartTeaser';
import { AuthDialog, type AuthMode } from '../../features/auth';
import { Loader2 } from 'lucide-react';

const CurrentPanchangTeaser = lazy(() =>
  import('./components/CurrentPanchangTeaser').then((m) => ({ default: m.CurrentPanchangTeaser })),
);

type AuthActions = {
  signInWithGoogle: () => ReturnType<typeof import('../../firebase').signInWithGoogle>;
  loginWithEmail: (email: string, password: string) => ReturnType<typeof import('../../firebase').loginWithEmail>;
  registerWithEmail: (email: string, password: string) => ReturnType<typeof import('../../firebase').registerWithEmail>;
  resetPassword: (email: string) => ReturnType<typeof import('../../firebase').resetPassword>;
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authOpen, setAuthOpen] = useState(false);
  const [authActions, setAuthActions] = useState<AuthActions | null>(null);

  usePageMeta({
    title: 'Soul Blueprint — Free Career, Personal & Daily Birth-Chart Reports',
    description: SITE.description,
    path: '/',
    jsonLd: landingJsonLd(),
  });

  useEffect(() => {
    if (searchParams.get('auth') === 'signup') {
      setAuthMode('signup');
      setAuthOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    trackEvent('landing_page_viewed', {
      auth_prompt: searchParams.get('auth') ?? undefined,
    });
  }, [searchParams]);

  useEffect(() => {
    if (!authOpen || authActions) return;
    import('../../firebase').then((firebase) => {
      setAuthActions({
        signInWithGoogle: firebase.signInWithGoogle,
        loginWithEmail: firebase.loginWithEmail,
        registerWithEmail: firebase.registerWithEmail,
        resetPassword: firebase.resetPassword,
      });
    });
  }, [authOpen, authActions]);

  const openAuth = useCallback((mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
    trackEvent('landing_auth_opened', { mode });
  }, []);

  return (
    <div className={cn(
      'landing-shell universe-bg relative min-h-screen',
      isDark ? 'dark text-white' : 'light text-ink-primary'
    )}>
      <LandingNavbar onOpenAuth={openAuth} />
      <main id="main-content">
        <LandingHero onOpenAuth={openAuth}>
          <HeroChartTeaser compact />
        </LandingHero>
        <div id="observatory" className={cn('dashboard-shell relative z-10 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-12', isDark ? 'dark' : 'light')}>
          <div className="mx-auto max-w-7xl space-y-4">
            <header className={cn('dashboard-header', isDark ? 'dark' : 'light')}>
              <div className="flex items-center gap-3">
                <span className="dashboard-live-dot motion-reduce:animate-none animate-pulse" aria-hidden="true" />
                <div>
                  <p className="landing-kicker">Live workspace preview</p>
                  <h2 className={cn('mt-1 font-serif text-2xl font-semibold sm:text-3xl', isDark ? 'text-white' : 'text-ink-primary')}>
                    Your <span className="italic text-cosmic-accent">dashboard</span> at a glance
                  </h2>
                </div>
              </div>
              <p className={cn('max-w-md text-sm leading-6', isDark ? 'text-white/45' : 'text-ink-muted')}>
                Panels update with real astronomy — mood ledger, timing windows, and sample chart views in one place.
              </p>
            </header>

            <LazyWhenVisible minHeight="14rem">
              <CurrentPanchangTeaser />
            </LazyWhenVisible>
            <TimingTeaser />
            <SampleAIInterpretation />
          </div>
        </div>
        <LandingFeatureGrid />
        <LandingSignUpCTA onOpenAuth={openAuth} />
      </main>
      <LandingFooter />
      {authOpen && (
        authActions ? (
          <AuthDialog
            isOpen={authOpen}
            initialMode={authMode}
            onModeChange={setAuthMode}
            onClose={() => setAuthOpen(false)}
            onGoogleAuth={authActions.signInWithGoogle}
            onEmailSignIn={authActions.loginWithEmail}
            onEmailSignUp={authActions.registerWithEmail}
            onResetPassword={authActions.resetPassword}
            onSuccess={() => {
              setAuthOpen(false);
              navigate('/sky');
            }}
          />
        ) : (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" role="status" aria-label="Loading sign in">
            <Loader2 className="h-10 w-10 animate-spin text-jyotish-gold" />
          </div>
        )
      )}
    </div>
  );
};

export default LandingPage;
