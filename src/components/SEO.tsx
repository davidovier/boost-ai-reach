import { useEffect } from 'react';

interface SEOProps {
  title: string; // under 60 chars
  description?: string; // under 160 chars
  url?: string; // canonical URL
  ogImage?: string; // absolute or relative URL
  ogType?: 'website' | 'article' | 'profile' | 'product';
  noindex?: boolean; // prevent search engine indexing
  keywords?: string; // meta keywords (for internal use)
  author?: string; // page author
  publishedTime?: string; // article published time (ISO format)
  modifiedTime?: string; // article modified time (ISO format)
  // Back-compat (deprecated): if provided, used as url
  canonical?: string;
}

// Default SEO values
const DEFAULT_SEO = {
  siteName: 'FindableAI',
  domain: 'findable.ai',
  defaultTitle: 'FindableAI – AI Findability Optimization Platform',
  defaultDescription: 'Optimize your brand for AI discovery with comprehensive website scans, competitive analysis, and actionable insights.',
  defaultOgImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&h=630&auto=format&fit=crop', // Fallback OG image
  twitterHandle: '@FindableAI',
  locale: 'en_US',
} as const;

export function SEO({ 
  title, 
  description, 
  url, 
  ogImage, 
  ogType = 'website',
  noindex, 
  keywords,
  author,
  publishedTime,
  modifiedTime,
  canonical 
}: SEOProps) {
  useEffect(() => {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : `https://${DEFAULT_SEO.domain}`;
    
    const canonicalUrl = url || canonical || (typeof window !== 'undefined' ? window.location.href : '');
    const fullCanonicalUrl = canonicalUrl.startsWith('http') 
      ? canonicalUrl 
      : `${baseUrl}${canonicalUrl.startsWith('/') ? canonicalUrl : `/${canonicalUrl}`}`;
    
    const finalOgImage = ogImage || DEFAULT_SEO.defaultOgImage;
    const fullOgImage = finalOgImage.startsWith('http') 
      ? finalOgImage 
      : `${baseUrl}${finalOgImage}`;
    
    const finalDescription = description || DEFAULT_SEO.defaultDescription;
    const finalTitle = title.includes(DEFAULT_SEO.siteName) 
      ? title 
      : `${title} | ${DEFAULT_SEO.siteName}`;

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
    document.title = finalTitle;

    // Standard meta tags
    upsertMetaByName('description', finalDescription);
    upsertMetaByName('keywords', keywords);
    upsertMetaByName('author', author);
    
    // Robots meta
    if (noindex) {
      upsertMetaByName('robots', 'noindex, nofollow');
    } else {
      upsertMetaByName('robots', 'index, follow');
    }
    
    // Canonical URL
    upsertLink('canonical', fullCanonicalUrl);

    // OpenGraph meta tags
    upsertMetaByProp('og:site_name', DEFAULT_SEO.siteName);
    upsertMetaByProp('og:title', title); // Don't add site name to OG title
    upsertMetaByProp('og:description', finalDescription);
    upsertMetaByProp('og:type', ogType);
    upsertMetaByProp('og:url', fullCanonicalUrl);
    upsertMetaByProp('og:image', fullOgImage);
    upsertMetaByProp('og:image:alt', `${title} - ${DEFAULT_SEO.siteName}`);
    upsertMetaByProp('og:locale', DEFAULT_SEO.locale);
    
    // Article specific meta tags
    if (ogType === 'article') {
      upsertMetaByProp('article:published_time', publishedTime);
      upsertMetaByProp('article:modified_time', modifiedTime);
      upsertMetaByProp('article:author', author);
    }

    // Twitter Card meta tags
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:site', DEFAULT_SEO.twitterHandle);
    upsertMetaByName('twitter:creator', DEFAULT_SEO.twitterHandle);
    upsertMetaByName('twitter:title', title);
    upsertMetaByName('twitter:description', finalDescription);
    upsertMetaByName('twitter:image', fullOgImage);
    upsertMetaByName('twitter:image:alt', `${title} - ${DEFAULT_SEO.siteName}`);

    // Additional meta tags for better SEO
    upsertMetaByName('theme-color', '#3b82f6'); // Primary color
    upsertMetaByName('msapplication-TileColor', '#3b82f6');
    
  }, [title, description, url, ogImage, ogType, noindex, keywords, author, publishedTime, modifiedTime, canonical]);

  return null;
}
