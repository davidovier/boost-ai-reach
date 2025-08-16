import { useEffect } from 'react';

interface SEOProps {
  title: string; // under 60 chars
  description?: string; // under 160 chars
  url?: string; // canonical URL
  ogImage?: string; // absolute or relative URL
  noindex?: boolean; // prevent search engine indexing
  // Back-compat (deprecated): if provided, used as url
  canonical?: string;
}

export function SEO({ title, description, url, ogImage, noindex, canonical }: SEOProps) {
  useEffect(() => {
    const canonicalUrl = url || canonical || (typeof window !== 'undefined' ? window.location.href : '');
    const defaultOgImage = (typeof window !== 'undefined')
      ? new URL('/placeholder.svg', window.location.origin).toString()
      : '/placeholder.svg';

    const upsertMetaByName = (name: string, content: string | undefined) => {
      if (!content) return;
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const upsertMetaByProp = (property: string, content: string | undefined) => {
      if (!content) return;
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const upsertLink = (rel: string, href: string | undefined) => {
      if (!href) return;
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Title
    if (title) document.title = title;

    // Standard meta
    upsertMetaByName('description', description);
    if (noindex) {
      upsertMetaByName('robots', 'noindex, nofollow');
    }
    upsertLink('canonical', canonicalUrl);

    // OpenGraph
    upsertMetaByProp('og:title', title);
    upsertMetaByProp('og:description', description);
    upsertMetaByProp('og:type', 'website');
    upsertMetaByProp('og:url', canonicalUrl);
    upsertMetaByProp('og:image', ogImage || defaultOgImage);

    // Twitter
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', title);
    upsertMetaByName('twitter:description', description);
    upsertMetaByName('twitter:image', ogImage || defaultOgImage);
  }, [title, description, url, ogImage, noindex, canonical]);

  return null;
}
