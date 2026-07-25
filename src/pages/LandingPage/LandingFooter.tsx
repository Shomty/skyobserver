import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="landing-section-footer px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-cosmic-accent/25">
            <Compass className="h-4 w-4 text-cosmic-accent" />
          </span>
          <span className="font-serif text-base italic text-white/85">Soul Blueprint</span>
          <span className="ml-1 text-xs text-white/35">© 2026</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          <span>Patterns before conclusions</span>
          <Link
            to="/privacy"
            className="rounded hover:text-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent/50"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="rounded hover:text-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cosmic-accent/50"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
};
