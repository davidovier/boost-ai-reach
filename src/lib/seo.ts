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
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.item,
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
    name: opts.name,
    url: opts.url,
  };
  if (opts.logo) json.logo = opts.logo;
  if (opts.sameAs?.length) json.sameAs = opts.sameAs;
  return json;
}

export function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
