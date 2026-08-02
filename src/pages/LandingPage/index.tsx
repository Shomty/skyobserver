import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { LandingFeatureGrid } from './LandingFeatureGrid';
import { LandingSignUpCTA } from './LandingSignUpCTA';
import { LandingFooter } from './LandingFooter';
import { CurrentPanchangTeaser, LiveChartTeaser, SampleAIInterpretation, TimingTeaser } from './components';
import { AuthDialog, type AuthMode } from '../../features/auth';
import { loginWithEmail, registerWithEmail, resetPassword, signInWithGoogle } from '../../firebase';

const LandingPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('auth') === 'signup') {
      setAuthMode('signup');
      setAuthOpen(true);
    }
  }, [searchParams]);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className={cn(
      'landing-shell universe-bg relative min-h-screen',
      isDark ? 'dark text-white' : 'light text-ink-primary'
    )}>
      <LandingNavbar onOpenAuth={openAuth} />
      <LandingHero onOpenAuth={openAuth}>
        <LiveChartTeaser compact />
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

          <CurrentPanchangTeaser />
          <TimingTeaser />
          <SampleAIInterpretation />
        </div>
      </div>
      <LandingFeatureGrid />
      <LandingSignUpCTA onOpenAuth={openAuth} />
      <LandingFooter />
      <AuthDialog
        isOpen={authOpen}
        initialMode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthOpen(false)}
        onGoogleAuth={signInWithGoogle}
        onEmailSignIn={loginWithEmail}
        onEmailSignUp={registerWithEmail}
        onResetPassword={resetPassword}
      />
    </div>
  );
};

export default LandingPage;
