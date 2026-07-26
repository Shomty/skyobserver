import React, { useState } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { LandingFeatureGrid } from './LandingFeatureGrid';
import { LandingSignUpCTA } from './LandingSignUpCTA';
import { LandingFooter } from './LandingFooter';
import { CurrentPanchangTeaser, LiveChartTeaser, SampleAIInterpretation, TimingTeaser } from './components';
import { AuthDialog, type AuthMode } from '../../features/auth';
import { loginWithEmail, registerWithEmail, resetPassword, signInWithGoogle } from '../../firebase';

const LandingPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [authOpen, setAuthOpen] = useState(false);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="landing-shell universe-bg dark relative min-h-screen text-white">
      <LandingNavbar onOpenAuth={openAuth} />
      <LandingHero onOpenAuth={openAuth}>
        <LiveChartTeaser compact />
      </LandingHero>
      <div id="observatory" className="dashboard-shell relative z-10 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-12">
        <div className="mx-auto max-w-7xl space-y-4">
          <header className="dashboard-header">
            <div className="flex items-center gap-3">
              <span className="dashboard-live-dot motion-reduce:animate-none animate-pulse" aria-hidden="true" />
              <div>
                <p className="landing-kicker">Live workspace preview</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-white sm:text-3xl">
                  Your <span className="italic text-cosmic-accent">dashboard</span> at a glance
                </h2>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/45">
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
