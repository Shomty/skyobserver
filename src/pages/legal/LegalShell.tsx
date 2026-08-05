import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';
import { usePageMeta } from '../../lib/seo';

interface Props {
  title: string;
  description: string;
  path: string;
  lastUpdated: string;
  children: ReactNode;
}

/** Shared layout for the standalone legal pages. No starfield — these are read, not admired. */
export function LegalShell({ title, description, path, lastUpdated, children }: Props) {
  const { theme } = useTheme();

  usePageMeta({
    title: `${title} | Vedic Sky`,
    description,
    path,
  });

  return (
    <div
      className={cn(
        'min-h-[100dvh] universe-bg',
        theme === 'dark' ? 'dark text-white' : 'light text-slate-900'
      )}
    >
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <Link
            to="/"
            className="font-serif italic text-title gold-gradient-text rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jyotish-gold/50"
          >
            Vedic Sky
          </Link>
        </header>

        <h1 className="font-serif text-heading">{title}</h1>
        <p
          className={cn(
            'mt-2 text-caption font-mono uppercase tracking-widest',
            theme === 'dark' ? 'text-white/40' : 'text-slate-500'
          )}
        >
          Last updated {lastUpdated}
        </p>

        <div
          className={cn(
            'mt-8 space-y-6 text-body',
            theme === 'dark' ? 'text-white/70' : 'text-slate-600'
          )}
        >
          {children}
        </div>

        <nav
          className={cn(
            'mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-label',
            theme === 'dark' ? 'border-white/10' : 'border-slate-200'
          )}
        >
          <Link to="/privacy" className="underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="underline-offset-4 hover:underline">
            Terms of Service
          </Link>
          <a href="mailto:hello@vedicsky.app" className="underline-offset-4 hover:underline">
            hello@vedicsky.app
          </a>
        </nav>
      </div>
    </div>
  );
}

interface SectionProps {
  heading: string;
  children: ReactNode;
}

export function LegalSection({ heading, children }: SectionProps) {
  const { theme } = useTheme();
  return (
    <section className="space-y-3">
      <h2
        className={cn(
          'font-serif text-title',
          theme === 'dark' ? 'text-white/90' : 'text-slate-900'
        )}
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}
