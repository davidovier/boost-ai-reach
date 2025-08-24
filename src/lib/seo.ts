// JSON-LD helpers for pages
// Use with: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />

export type BreadcrumbItem = {
  name: string;
  item: string; // absolute URL
};

export function getBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': items.length > 0 ? `${items[items.length - 1].item}#breadcrumb` : '#breadcrumb',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: {
        '@type': 'WebPage',
        '@id': it.item,
        url: it.item,
        name: it.name
      },
    })),
  } as const;
}

export interface OrganizationOptions {
  name: string;
  url: string;
  logo?: string; // absolute URL
  sameAs?: string[]; // social/profile URLs
}

export function getOrganizationJsonLd(opts: OrganizationOptions) {
  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${opts.url}#organization`,
    name: opts.name,
    url: opts.url,
    foundingDate: '2024',
    industry: 'Software',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@findable.ai'
    }
  };
  if (opts.logo) {
    json.logo = {
      '@type': 'ImageObject',
      url: opts.logo,
      width: '200',
      height: '60'
    };
  }
  if (opts.sameAs?.length) json.sameAs = opts.sameAs;
  return json;
}

export function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
