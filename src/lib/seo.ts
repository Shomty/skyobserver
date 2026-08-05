import { useEffect } from 'react';
import { absoluteUrl, defaultOgImageUrl, SITE } from './siteConfig';

export interface PageMeta {
  title: string;
  description: string;
  /** Path for canonical URL, e.g. `/career`. Defaults to current pathname. */
  path?: string;
  noindex?: boolean;
  ogType?: 'website' | 'article';
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const JSON_LD_ID = 'soulblueprint-json-ld';

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data: PageMeta['jsonLd']): void {
  document.getElementById(JSON_LD_ID)?.remove();
  if (!data) return;

  const script = document.createElement('script');
  script.id = JSON_LD_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(Array.isArray(data) ? data : [data]);
  document.head.appendChild(script);
}

/** Apply document title, meta tags, canonical, robots, Open Graph, and JSON-LD. */
export function applyPageMeta(meta: PageMeta): void {
  const path = meta.path ?? `${window.location.pathname}${window.location.search}`;
  const canonical = absoluteUrl(path.split('?')[0] ?? path);
  const ogImage = meta.ogImage ?? defaultOgImageUrl();
  const robots = meta.noindex ? 'noindex, nofollow' : 'index, follow';

  document.title = meta.title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', robots);
  upsertLink('canonical', canonical);

  upsertMeta('property', 'og:type', meta.ogType ?? 'website');
  upsertMeta('property', 'og:site_name', SITE.name);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', ogImage);
  upsertMeta('property', 'og:locale', SITE.locale);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', ogImage);

  setJsonLd(meta.jsonLd);
}

export function usePageMeta(meta: PageMeta): void {
  useEffect(() => {
    applyPageMeta(meta);
  }, [meta.title, meta.description, meta.path, meta.noindex, meta.ogType, meta.ogImage]);
}

export function landingJsonLd(): Array<Record<string, unknown>> {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      alternateName: SITE.brand,
      url: SITE.url,
      description: SITE.description,
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.legalName,
      url: SITE.url,
      email: SITE.email,
      logo: defaultOgImageUrl(),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE.name,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: SITE.description,
      url: SITE.url,
    },
  ];
}
