export interface FaqItem {
  question: string;
  answer: string;
}

/** Homepage FAQ copy — shared by the visible accordion and the FAQPage structured data. */
export const LANDING_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What does "soul blueprint" actually mean?',
    answer:
      'Your soul blueprint is the pattern locked in at the moment you were born — the exact positions of the planets against the stars, read through sidereal Vedic astrology. It is not a prediction. It is a map of tendencies: how you tend to process the world, where things come easily, where they take more effort, and how that pattern moves through different chapters of your life.',
  },
  {
    question: 'Is Soul Blueprint the same as Western astrology?',
    answer:
      'No. Soul Blueprint uses sidereal Vedic astrology with the Lahiri ayanamsa, which measures planetary positions against the actual constellations rather than the fixed seasonal calendar Western tropical astrology uses. It is the same system behind dashas (planetary life-chapter timing), nakshatras, and yogas — calculated with Swiss Ephemeris precision, not simplified sun-sign astrology.',
  },
  {
    question: 'Do I need an account to see my soul blueprint?',
    answer:
      'No. The career, personal, and daily energy reports are free, instant, and require only your birth date, time, and place — no account, no email, no payment. Creating a free account unlocks a private workspace to save charts, track daily energy over time, and go deeper with AI-guided interpretation.',
  },
  {
    question: 'How accurate are the planetary positions?',
    answer:
      'Positions are computed with Swiss Ephemeris, the same astronomical engine used by professional Vedic astrologers, applying the Lahiri ayanamsa for sidereal accuracy. This is precision astronomy, not an approximation — the same math behind Panchang calendars and dasha timelines used across India.',
  },
  {
    question: 'Is my birth data private?',
    answer:
      'Yes. Birth details and saved charts are stored per-account with strict access rules — no one else can read your data, and nothing is shared or sold. You can generate the free reports without ever creating an account or saving anything.',
  },
];
