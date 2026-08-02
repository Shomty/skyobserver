/** English copy for the public career calculator at /career */
export const en = {
  'meta.title': 'Free Vedic Career Report Calculator | Vedic Sky',
  'meta.description':
    'Discover your 10th house, career dashas, and professional strengths from your birth chart — free instant snapshot.',

  'page.title': 'Career Report Calculator',
  'page.subtitle':
    'Enter your birth details to see your 10th house, Vimshottari timing, and career strengths — no account required.',
  'page.submit': 'Calculate my career snapshot',
  'page.recalculate': 'Try different details',
  'page.loading': 'Casting your chart…',

  'form.title': 'Your birth details',
  'form.subtitle': 'We use these to calculate your career indicators. Pick your city from the list for accuracy.',

  'result.title': 'Your career snapshot',
  'result.for': 'For {name}',

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

  'upsell.title': 'Unlock your full career report',
  'upsell.body':
    'Get a personalized deep-dive with Amatyakaraka analysis, D10 Dashamsha breakdown, dasha-by-dasha career timeline, and AI-guided recommendations.',
  'upsell.cta': 'Create free account',
  'upsell.note': 'Free snapshot above · Full report with signup',

  'network.title': 'Connection failed',
  'network.body': 'Could not reach the chart server. Your details are still here — try again.',
  'network.retry': 'Try again',

  'faq.title': 'Frequently asked questions',
  'faq.q1': 'Is this really free?',
  'faq.a1': 'Yes — the snapshot above is free and requires no account. The full AI report unlocks after signup.',
  'faq.q2': 'How accurate is the birth time?',
  'faq.a2': 'Career indicators depend heavily on an accurate birth time. Use your birth certificate if possible.',
  'faq.q3': 'What is the 10th house?',
  'faq.a3': 'In Vedic astrology the 10th house governs career, public reputation, and life direction.',
} as const;

export type CopyKey = keyof typeof en;
