import React from 'react';
import { Compass } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-jyotish-gold" />
          <span className="font-serif italic text-white/80 text-sm">Vedic Sky Observer</span>
          <span className="text-white/30 text-sm ml-1">© 2026</span>
        </div>
        <div className="flex items-center gap-6 text-white/40 text-xs font-mono">
          <span>Made with Gemini AI</span>
          <span className="cursor-pointer hover:text-white/60 transition-colors">Privacy</span>
          <span className="cursor-pointer hover:text-white/60 transition-colors">Terms</span>
        </div>
      </div>
    </footer>
  );
};
