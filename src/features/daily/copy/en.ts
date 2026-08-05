/** English copy for the public daily energy report at /daily */
export const en = {
  'meta.title': 'Daily Vedic Energy Report | Vedic Sky',
  'meta.description':
    'Personalized daily energy and 7-day forecast from your birth chart, current transits, and location — free instant report.',

  'page.title': 'Daily Energy Report',
  'page.subtitle':
    'Enter birth details and your current location to see today\'s cosmic weather, a week-ahead forecast, and your natal foundation (D1, D9, D10).',
  'page.submit': 'Generate my daily report',
  'page.newReport': 'New report',
  'page.loading': 'Reading the sky for you…',
  'page.loadingShared': 'Loading shared report…',

  'form.title': 'Your details',
  'form.subtitle':
    'Birth data casts your natal chart. Current location pins transits to where you are now (Swiss Ephemeris / openastrology).',
  'form.currentPlace': 'Current location',
  'form.currentPlaceHint': 'Where you are today — used for transit positions and panchang',
  'form.useMyLocation': 'Use my location',
  'form.useApproxLocation': 'Use approximate location (dev: defaults to Belgrade on localhost)',
  'form.locating': 'Locating…',

  'result.title': 'Your daily energy report',
  'result.for': 'For {name}',
  'result.savedAt': 'Saved {date}',
  'result.fromCache': 'Loaded from saved report — chart and AI text served from cache when available.',
  'result.location': 'Transits for {place}',
  'result.noShareLink':
    'Your report was calculated but the share link could not be saved. Refresh and try again.',

  'actions.share': 'Share',
  'actions.copied': 'Link copied!',

  'share.title': 'My Daily Vedic Energy Report',
  'share.text': 'See my personalized daily energy and 7-day Vedic forecast.',

  'shared.notFoundTitle': 'Report not found',
  'shared.notFoundBody': 'This link may have expired. Generate a fresh report below.',
  'shared.errorBody': 'We could not load this report. Please try again.',

  'meta.sharedTitle': 'Shared Daily Report | Vedic Sky',

  'energy.title': "Today's Energy",
  'energy.score': 'Energy index',
  'energy.high': 'High vitality — favorable for initiative and outward action',
  'energy.balanced': 'Balanced flow — steady progress with mindful pacing',
  'energy.low': 'Quieter tone — prioritize rest, routine, and inner work',
  'energy.caution': 'Heightened friction — move deliberately and protect boundaries',

  'forecast.title': '7-Day Forecast',
  'forecast.subtitle': 'Tap a day to explore transits and panchang',
  'forecast.transits': 'Active transit influences',
  'forecast.transitsLoading': 'Generating practical transit meanings…',
  'forecast.transitAiNote': 'AI interpretation · saved to your report',
  'forecast.panchang': 'Panchang',
  'forecast.noTransits': 'No major natal triggers flagged for this day.',

  'chart.title': 'Birth Chart (D1)',
  'chart.hint': 'Natal foundation for daily transits',

  'dasha.title': 'Current Vimshottari Periods',

  'parashari.kicker': 'Natal Foundation',
  'parashari.title': 'Your Cosmic Blueprint',
  'parashari.subtitle':
    'D1 identity, D9 inner path, D10 career action, dasha timing, and Purushartha guidance — the baseline against which daily transits play.',

  'network.title': 'Could not generate report',
  'network.body': 'The chart server returned an error. If you just added /daily, restart the dev server (npm run dev) and try again.',
  'network.retry': 'Try again',

  'viewMode.label': 'Report language',
  'viewMode.vedic': 'Vedic',
  'viewMode.plain': 'Plain language',
  'viewMode.hint': 'Vedic shows classical chart analysis. Plain language translates the same signals into everyday psychological coaching (one AI call, saved to your report).',

  'plain.kicker': 'Plain language · AI coach',
  'plain.title': 'Your daily psychological weather',
  'plain.subtitle':
    'Derived from the same timing signals as the Vedic report — written like a thoughtful psychologist, with no astrology jargon.',
  'plain.loading': 'Translating today\'s signals into plain language…',
  'plain.cachedNote': 'Saved to your report — no new API call on reload.',
  'plain.disclaimer': 'Coaching-style guidance, not clinical therapy or medical advice.',
  'plain.today': 'Today',
  'plain.foundation': 'Your inner baseline',
  'plain.period': 'This life chapter',
  'plain.moves': 'Practical moves this week',
  'plain.dayRead': 'Psychological read',
  'plain.dayPending': 'Plain-language read loading…',
  'plain.energyNote': 'Energy index from chart timing · psychological read below',
  'plain.energyTitle': 'Energy · {day}',
  'plain.energyMind': 'Mind',
  'plain.energyBody': 'Body',
  'plain.energySoul': 'Inner life',
  'plain.energyLoading': 'Translating energy score into mind, body, and inner life…',
  'plain.energyPending': 'Energy profile loading…',
} as const;

export type CopyKey = keyof typeof en;
