/** English copy for the public personal insight calculator at /personal */
export const en = {
  'meta.title': 'Free Vedic Personal Insight Report | Vedic Sky',
  'meta.description':
    'Discover your Personality Wheel, inner vs outer self, life mission, and shadow themes from your birth chart — free instant snapshot.',

  'page.title': 'Personal Insight Report',
  'page.subtitle':
    'Enter your birth details to see your Lagna–Moon–Sun triad, D9 inner strength, Sudarshana life areas, and Vimshottari timing — no account required.',
  'page.submit': 'Calculate my personal snapshot',
  'page.newReport': 'Calculate a new report',
  'page.loading': 'Casting your chart…',
  'page.loadingShared': 'Loading shared report…',

  'form.title': 'Your birth details',
  'form.subtitle':
    'We use these to calculate your personal insight indicators. After calculation you get a unique share link.',

  'result.title': 'Your personal snapshot',
  'result.for': 'For {name}',
  'result.savedAt': 'Saved {date}',
  'result.premiumUnlocked': 'Full report unlocked',
  'result.noShareLink':
    'Your report was calculated but the share link could not be saved. Hard-refresh and try again.',

  'actions.share': 'Share',
  'actions.print': 'Print / PDF',
  'actions.copied': 'Link copied!',

  'share.title': 'My Vedic Personal Insight Report',
  'share.text': 'See my free Vedic personal snapshot — personality, inner self, life mission, and timing.',

  'shared.notFoundTitle': 'Report not found',
  'shared.notFoundBody': 'This link may have expired or never existed. Calculate a fresh report below.',
  'shared.errorBody': 'We could not load this report. Please try again in a moment.',

  'meta.sharedTitle': 'Shared Personal Report | Vedic Sky',

  'chart.title': 'Birth Chart (D1)',
  'chart.hint': 'Lagna · Moon · Sun highlighted',

  'dasha.title': 'Current Vimshottari Periods',
  'dasha.mahadasha': 'Mahadasha',
  'dasha.antardasha': 'Antardasha',
  'dasha.pratyantardasha': 'Pratyantardasha',
  'dasha.nextAntardasha': 'Next Antardasha',

  'scores.title': 'Personal Strengths',
  'scores.locked': 'PREMIUM',

  'wheel.title': 'Personality Wheel',
  'wheel.heading': '{lagna} rising · Moon in {moon} · Sun in {sun}',
  'wheel.body':
    'Lagna lord {lord} in the {house} house ({element}, {guna} guna on the ascendant). This triad maps outer presentation, emotional needs, and core vitality.',

  'timing.title': 'Life Timing',
  'timing.activeSudarshana': 'Active Sudarshana year',
  'timing.activeArea': 'House {house} — {area}',
  'timing.dashaAreas': 'Dasha-activated life areas',
  'timing.current': 'Current Mahadasha lord',

  'parashari.kicker': 'Parashari Personal Analysis',
  'parashari.title': 'Your Personal Insight Reading',
  'parashari.subtitle':
    'D1 personality, D9 inner self, life mission, shadow work, and Sudarshana triangulation — teasers free; full paragraphs unlock with a free account.',
  'parashari.premiumNote': 'PREMIUM sections — create a free account to read the full analysis',

  'guidance.kicker': 'Premium · Practical Guidance',
  'guidance.title': 'Your Personal Growth Guide',
  'guidance.subtitle':
    'Secular, psychology-grounded coping strategies derived from your reading — plain language only, no astrology terms.',
  'guidance.loading': 'Preparing your personalized guidance…',
  'guidance.cachedNote': 'Saved to your report — no new API call on reload.',
  'guidance.disclaimer':
    'This is coaching-style guidance, not therapy or diagnosis. If something here resonates as a serious concern, please speak with a licensed professional.',
  'guidance.teaser':
    'Unlock practical coping strategies, daily practices, and current-chapter guidance — written in plain psychological language, with no chart terminology.',
  'guidance.selfUnderstanding': 'Self-understanding',
  'guidance.copingStrategies': 'Coping strategies',
  'guidance.dailyPractices': 'Daily practices',
  'guidance.currentChapter': 'Current chapter',
  'guidance.whenToSeekSupport': 'When to seek support',

  'upsell.title': 'Unlock your full personal report',
  'upsell.body':
    'Unlock all premium Parashari sections, your AI Practical Guidance (saved to your report), and the complete shadow-work and life-mission analysis.',
  'upsell.cta': 'Create free account',
  'upsell.note': 'Free snapshot above · Full report with signup',

  'print.unlockSection': 'Unlock the full {title} analysis in your online report.',
  'print.unlockGuidance': 'Unlock your full Practical Guidance in your online report.',
  'print.guidancePending':
    'Practical guidance was still generating when this report was printed — view the online report for the full analysis.',
} as const;

export type CopyKey = keyof typeof en;
