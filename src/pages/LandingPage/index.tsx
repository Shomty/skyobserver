import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { LandingFeatureGrid } from './LandingFeatureGrid';
import { LandingHowItWorks } from './LandingHowItWorks';
import { LandingSignUpCTA } from './LandingSignUpCTA';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  return (
    <div className="min-h-screen universe-bg dark text-white relative">
      <LandingNavbar onSignIn={onSignIn} />
      <LandingHero onSignIn={onSignIn} />
      <LandingFeatureGrid />
      <LandingHowItWorks />
      <LandingSignUpCTA onSignIn={onSignIn} />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
