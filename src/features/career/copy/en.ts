/** English copy for the public career calculator at /career */
export const en = {
  'meta.title': 'Free Career Path Report — Work Fit, Strengths & Timing | Soul Blueprint',
  'meta.description':
    'Discover your professional strengths, ideal work environments, and career timing from your birth details — free instant report in plain language with share link.',

  'page.title': 'Career Report Calculator',
  'page.subtitle':
    'Enter your birth details to see your 10th house, Vimshottari timing, and career strengths — no account required.',
  'page.submit': 'Calculate my career snapshot',
  'page.newReport': 'Calculate a new report',
  'page.recalculate': 'Try different details',
  'page.loading': 'Casting your chart…',
  'page.loadingShared': 'Loading shared report…',

  'form.title': 'Your birth details',
  'form.subtitle':
    'We use these to calculate your career indicators. After calculation you get a unique share link you can send over WhatsApp, iMessage, or social media.',

  'result.title': 'Your career snapshot',
  'result.for': 'For {name}',
  'result.savedAt': 'Saved {date}',
  'result.premiumUnlocked': 'Full report unlocked',
  'result.noShareLink':
    'Your report was calculated but the share link could not be saved. Hard-refresh this page (Cmd+Shift+R) and try again — the dev server may need a restart too.',

  'actions.share': 'Share',
  'actions.print': 'Print / PDF',
  'actions.copied': 'Link copied!',

  'share.title': 'My Vedic Career Report',
  'share.text': 'See my free Vedic career snapshot — 10th house, dashas, and career strengths.',

  'shared.notFoundTitle': 'Report not found',
  'shared.notFoundBody': 'This link may have expired or never existed. Calculate a fresh report below.',
  'shared.errorBody': 'We could not load this report. Please try again in a moment.',

  'meta.sharedTitle': 'Shared Career Report | Vedic Sky',

  'chart.title': 'Birth Chart (D1)',
  'chart.hint': '10th house highlighted',

  'dasha.title': 'Current Vimshottari Periods',
  'dasha.mahadasha': 'Mahadasha',
  'dasha.antardasha': 'Antardasha',
  'dasha.pratyantardasha': 'Pratyantardasha',
  'dasha.nextAntardasha': 'Next Antardasha',

  'scores.title': 'Career Strengths',
  'scores.locked': 'PREMIUM',

  'house.title': 'House of Career',
  'house.heading': 'Your 10th house falls in {sign}',

  'engine.title': 'Career Engine',
  'engine.heading': 'Your 10th lord {lord} sits in the {house} house',

  'timing.title': 'Career Timing',
  'timing.opportunity': 'Strongest opportunity window',
  'timing.peak': 'Peak earning period',
  'timing.current': 'Current Mahadasha lord',
  'timing.none': 'No standout window in the next 15 years',

  'yoga.title': 'Wealth Yogas',
  'yoga.count': 'Your chart forms {count} wealth yoga(s), including {names}.',
  'yoga.none': 'No major Dhana yogas detected in this snapshot.',

  'fields.title': 'Suggested Career Fields',
  'fields.locked': 'More fields in full report',

  'parashari.kicker': 'Parashari Varga Analysis',
  'parashari.title': 'The Jyotish Gem Consultation',
  'parashari.subtitle':
    'Classical BPHS teachings across D1, D9, and D10 — how your body, inner dharma, and professional action align. Teasers are free; full Parashari paragraphs unlock with a free account.',
  'parashari.premiumNote': 'PREMIUM sections — create a free account to read the full analysis',

  'synthesis.kicker': 'Gem · Jyotish Consultation',
  'synthesis.title': 'Your Core Career Reading',
  'synthesis.subtitle':
    'An in-depth Parashari analysis across D1, D9, and D10 with dasha timing — generated once by Gem and saved to your report.',
  'synthesis.loading': 'Gem is consulting your chart…',
  'synthesis.cachedNote': 'Saved to your report — no new API call on reload.',

  'plainSynthesis.kicker': 'Plain language',
  'plainSynthesis.title': 'Your Career Reading',
  'plainSynthesis.subtitle':
    'The same career signals translated into everyday coaching language — generated once and saved to your report.',
  'plainSynthesis.loading': 'Preparing your plain-language career reading…',
  'plainSynthesis.cachedNote': 'Saved to your report — no new API call on reload.',

  'viewMode.label': 'Report language',
  'viewMode.vedic': 'Vedic',
  'viewMode.plain': 'Plain language',
  'viewMode.hint':
    'Vedic shows classical chart analysis plus Gem\'s full Jyotish consultation. Plain language translates the same signals into everyday career coaching (one AI call each, saved to your report).',

  'plain.note': 'Plain-language career coaching — switch to Vedic for chart details and Gem\'s full consultation.',

  'upsell.title': 'Unlock your full career report',
  'upsell.body':
    'Unlock all four Parashari Varga sections, Career Drive score, and extra career fields. AI readings (Vedic and plain) are included with your email.',
  'upsell.cta': 'Create free account',
  'upsell.note': 'Free snapshot above · Full report with signup',

  'network.title': 'Connection failed',
  'network.body': 'Could not reach the chart server. Your details are still here — try again.',
  'network.retry': 'Try again',

  'faq.title': 'Frequently asked questions',
  'faq.q1': 'Is this really free?',
  'faq.a1': 'Yes — the snapshot and AI readings are free with your email. Full Parashari sections unlock after signup.',
  'faq.q2': 'How accurate is the birth time?',
  'faq.a2': 'Career indicators depend heavily on an accurate birth time. Use your birth certificate if possible.',
  'faq.q3': 'What is the 10th house?',
  'faq.a3': 'In Vedic astrology the 10th house governs career, public reputation, and life direction.',

  'print.unlockSection': 'Unlock the full {title} analysis in your online report.',
  'print.unlockSynthesis': 'Unlock your full AI Core Career Synthesis in your online report.',
  'print.unlockScore': 'Unlock',
  'print.moreFieldsLocked': '+{count} more fields available with a free account.',
  'print.synthesisPending': 'The AI synthesis was still generating when this report was printed — view the online report for the full analysis.',
} as const;

export type CopyKey = keyof typeof en;
