/** Public site metadata — used by SEO, sitemap, and structured data. */
const rawUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');

export const SITE = {
  name: 'Soul Blueprint',
  brand: 'Vedic Sky',
  legalName: 'Vedic Sky Observer',
  tagline: 'Sidereal Vedic astrology with AI-powered insights',
  description:
    'Map your personality blueprint, life chapters, and daily emotional weather in one calm workspace. Free Vedic career, personal, and daily report calculators — precision astronomy, Lahiri ayanamsa, private by default.',
  url: rawUrl || 'https://vedicsky.app',
  locale: 'en_US',
  email: 'hello@vedicsky.app',
  twitterHandle: '@vedicskyapp',
  gaMeasurementId: (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || 'G-FSFQ96MPGT',
  gtmId: (import.meta.env.VITE_GTM_ID as string | undefined) || 'GTM-PN7TR3J7',
} as const;

/** Indexable public routes for sitemap generation (server mirrors this list). */
export const PUBLIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/career', changefreq: 'weekly', priority: '0.9' },
  { path: '/personal', changefreq: 'weekly', priority: '0.9' },
  { path: '/daily', changefreq: 'daily', priority: '0.9' },
  { path: '/gift', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

export function defaultOgImageUrl(): string {
  return absoluteUrl('/og-image.svg');
}
