/** English copy for the public year horoscope at /year */
export const en = {
  'meta.title': 'Free Year Horoscope — Identity, Partnership, Work & Timing | Soul Blueprint',
  'meta.description':
    'A sidereal year horoscope from your birth chart: who you are, how partnership ripens, where your work wants to go, and what this Vimshottari chapter asks of you.',
  'meta.sharedTitle': 'Shared Year Horoscope | Soul Blueprint',

  'page.title': 'Year Horoscope',
  'page.subtitle':
    'A reading of this calendar year from your birth chart. It treats the chart as a map of potential, not a script you are required to follow.',
  'page.submit': 'Read my year',
  'page.loading': 'Reading the year ahead…',
  'page.loadingShared': 'Loading shared horoscope…',
  'page.newReport': 'Read another year',

  'form.title': 'Your birth details',
  'form.subtitle': 'Date, time, and place set the chart. You will get a private share link when the reading is saved.',

  'result.kicker': 'Year horoscope',
  'result.subtitle': 'A map of potential for {year}',
  'result.noShareLink':
    'The chart was read, but the share link could not be saved. Refresh and try again if you want a link.',
  'result.consultation': 'Written consultation',
  'result.preparing': 'Writing the consultation for this year…',
  'result.consultationError': 'The chart reading is ready. The written consultation did not finish.',

  'actions.share': 'Copy share link',
  'actions.copied': 'Link copied',

  'shared.notFoundTitle': 'Horoscope not found',
  'shared.notFoundBody': 'This link may be wrong or no longer stored. Start a new reading.',
  'shared.errorBody': 'We could not load this horoscope. Please try again in a moment.',

  'facts.identity': 'Core identity',
  'facts.union': 'Inner path and union',
  'facts.action': 'Path of action',
  'facts.timing': 'Current timing',
  'facts.remedies': 'Support for a heavy stretch',
  'facts.vargottama': 'Vargottama, maximum strength',
  'facts.awake': 'Awake period',
  'facts.heavy': 'Heavy period',
} as const;

export type CopyKey = keyof typeof en;
