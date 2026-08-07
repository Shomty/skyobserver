/** English copy for the public personal insight calculator at /personal */
export const en = {
  'meta.title': 'Free Personality Blueprint — Inner Self, Life Themes & Strengths | Soul Blueprint',
  'meta.description':
    'Explore your personality wheel, inner vs outer self, life themes, and blind spots from your birth details — free instant report in plain language.',

  'page.title': 'Personal Insight Report',
  'page.subtitle':
    'Enter your birth details to see your outer self, emotional patterns, inner strengths, life domains, and current chapter — no account required.',
  'page.submit': 'Calculate my personal snapshot',
  'page.newReport': 'Calculate a new report',
  'page.loading': 'Building your profile…',
  'page.loadingShared': 'Loading shared report…',

  'form.title': 'Your birth details',
  'form.subtitle':
    'We use these to build your personal insight profile. After calculation you get a unique share link.',

  'result.title': 'Your personal snapshot',
  'result.for': 'For {name}',
  'result.savedAt': 'Saved {date}',
  'result.premiumUnlocked': 'Full report unlocked',
  'result.noShareLink':
    'Your report was calculated but the share link could not be saved. Hard-refresh and try again.',

  'actions.share': 'Share',
  'actions.print': 'Print / PDF',
  'actions.copied': 'Link copied!',

  'share.title': 'My Personality Blueprint Report',
  'share.text': 'See my free personality snapshot — inner landscape, life themes, and practical guidance.',

  'shared.notFoundTitle': 'Report not found',
  'shared.notFoundBody': 'This link may have expired or never existed. Calculate a fresh report below.',
  'shared.errorBody': 'We could not load this report. Please try again in a moment.',

  'meta.sharedTitle': 'Shared Personal Report | Soul Blueprint',

  'blueprint.title': 'Your Three-Layer Profile',
  'blueprint.subtitle': 'Outer self · emotional self · core drive',
  'blueprint.persona': 'Outer self',
  'blueprint.emotion': 'Emotional self',
  'blueprint.drive': 'Core drive',
  'blueprint.identityFocus': 'Identity development focus',

  'chapter.title': 'Life Chapters',
  'chapter.major': 'Major chapter',
  'chapter.active': 'Active window',
  'chapter.near': 'Near-term shift',
  'chapter.next': 'Next window',

  'scores.title': 'Personal Strengths',
  'scores.locked': 'PREMIUM',

  'wheel.title': 'Personality Wheel',
  'wheel.heading': '{outer} · {emotional} · {drive}',
  'wheel.body':
    'Identity development runs through {focus}. This triad maps how you present, what you feel, and what drives you — the foundation of your personal blueprint.',

  'timing.title': 'Life Timing',
  'timing.activeFocus': 'What this year is training',
  'timing.chapterThemes': 'Also active in your life now',
  'timing.current': 'Your major life chapter',

  'insight.kicker': 'Full Report',
  'insight.title': 'Your Full Personal Reading',
  'insight.subtitle':
    'Outer self, inner life, purpose, hidden patterns, and life domains — teasers free; full reading unlocks with a free account.',
  'insight.premiumNote': 'PREMIUM sections — create a free account to read the full reading',

  'guidance.kicker': 'Premium · Coaching Guide',
  'guidance.title': 'Your Personal Growth Guide',
  'guidance.subtitle':
    'Practical coaching with inner and outer steps you can use this week — warm, direct, and actionable.',
  'guidance.loading': 'Preparing your personalized guidance…',
  'guidance.cachedNote': 'Saved to your report — no new API call on reload.',
  'guidance.disclaimer':
    'This is coaching-style guidance, not therapy or diagnosis. If something here resonates as a serious concern, please speak with a licensed professional.',
  'guidance.teaser':
    'Unlock practical coping strategies, daily practices, and current-chapter guidance tailored to your profile.',
  'guidance.selfUnderstanding': 'Self-understanding',
  'guidance.copingStrategies': 'Coping strategies (inner & outer)',
  'guidance.dailyPractices': 'Daily practices',
  'guidance.currentChapter': 'Current chapter',
  'guidance.whenToSeekSupport': 'When to seek support',

  'upsell.title': 'Unlock your full personal report',
  'upsell.body':
    'Unlock all premium sections, your AI coaching guide (saved to your report), and the complete inner-life and purpose analysis.',
  'upsell.cta': 'Create free account',
  'upsell.note': 'Free snapshot above · Full report with signup',

  'print.unlockSection': 'Unlock the full {title} reading in your online report.',
  'print.unlockGuidance': 'Unlock your full Coaching Guide in your online report.',
  'print.guidancePending':
    'Coaching guidance was still generating when this report was printed — view the online report for the full reading.',
} as const;

export type CopyKey = keyof typeof en;
