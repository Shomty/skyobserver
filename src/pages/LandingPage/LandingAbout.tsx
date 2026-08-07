import React from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import { LANDING_FAQ_ITEMS } from './lib/faqConfig';

export const LandingAbout: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className={cn('landing-section-about relative z-10 px-5 py-20 md:px-8 md:py-24', isDark ? 'dark' : 'light')}>
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1fr]">
        <div>
          <p className="landing-kicker mb-4">The idea behind the name</p>
          <h2 className={cn('max-w-md font-serif text-4xl font-medium italic leading-[0.98] md:text-5xl', isDark ? 'text-[#ede8f5]' : 'text-ink-primary')}>
            What is a Soul Blueprint?
          </h2>
          <div className={cn('mt-6 space-y-4 text-sm leading-7', isDark ? 'text-white/60' : 'text-ink-secondary')}>
            <p>
              Your soul blueprint is the pattern locked in at the exact moment you were born — the
              positions of the planets against the stars, read through sidereal Vedic astrology
              rather than the fixed seasonal calendar Western tropical astrology uses. It is not a
              prediction of what will happen. It is a map of tendencies: how you tend to process the
              world, where things come easily, where they take more effort, and how that pattern
              moves through different chapters of your life.
            </p>
            <p>
              Soul Blueprint calculates that pattern with Swiss Ephemeris precision astronomy and the
              Lahiri ayanamsa — the same math behind dashas, nakshatras, and Panchang timing used by
              professional Vedic astrologers — then translates it into plain language instead of
              jargon. No birth chart literacy required.
            </p>
            <p>
              Three free instant reports — career, personality, and daily energy — read your chart
              from different angles with a shareable link and no account required. A free account
              unlocks a private workspace to save charts, track your energy over time, and go deeper
              with AI-guided reflection.
            </p>
          </div>
        </div>

        <div>
          <p className="landing-kicker mb-4">Common questions</p>
          <div className="space-y-3">
            {LANDING_FAQ_ITEMS.map(({ question, answer }) => (
              <details
                key={question}
                className={cn(
                  'group dashboard-panel rounded-xl px-5 py-4',
                  isDark ? 'dark' : 'light',
                )}
              >
                <summary
                  className={cn(
                    'cursor-pointer list-none text-sm font-semibold marker:content-none',
                    isDark ? 'text-white/90' : 'text-ink-primary',
                  )}
                >
                  {question}
                </summary>
                <p className={cn('mt-3 text-sm leading-6', isDark ? 'text-white/55' : 'text-ink-muted')}>
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
