import React, { useState } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { LandingFeatureGrid } from './LandingFeatureGrid';
import { LandingSignUpCTA } from './LandingSignUpCTA';
import { LandingFooter } from './LandingFooter';
import { CurrentPanchangTeaser, SampleAIInterpretation, SampleChartTeaser, TimingTeaser } from './components';
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
        <SampleChartTeaser compact />
      </LandingHero>
      <div id="observatory" className="relative z-10">
        <CurrentPanchangTeaser />
        <TimingTeaser />
        <SampleAIInterpretation />
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
