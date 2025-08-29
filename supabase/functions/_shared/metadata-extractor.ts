/**
 * Metadata extraction utilities for web pages
 */

export interface MetadataResult {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schema?: any[];
  robotsDirectives?: string[];
}

export interface ScanResult {
  url: string;
  metadata: MetadataResult;
  robotsTxt?: {
    exists: boolean;
    content?: string;
    error?: string;
  };
  sitemap?: {
    exists: boolean;
    url?: string;
    error?: string;
  };
  performance: {
    loadTime: number;
    statusCode: number;
    contentLength?: number;
  };
  timestamp: string;
}

/**
 * Extract metadata from HTML content
 */
export function extractMetadata(html: string, baseUrl: string): MetadataResult {
  const metadata: MetadataResult = {};
  
  try {
    // Extract title - handle HTML entities and nested tags
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      metadata.title = decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    
    // Extract meta tags with more robust regex
    const metaTagRegex = /<meta\s+[^>]*>/gi;
    let metaMatch;
    
    while ((metaMatch = metaTagRegex.exec(html)) !== null) {
      const tag = metaMatch[0];
      const nameMatch = tag.match(/name\s*=\s*["']([^"']+)["']/i);
      const propertyMatch = tag.match(/property\s*=\s*["']([^"']+)["']/i);
      const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i);
      
      if (!contentMatch) continue;
      
      const content = decodeHtmlEntities(contentMatch[1].trim());
      const identifier = (nameMatch?.[1] || propertyMatch?.[1] || '').toLowerCase();
      
      if (!content || !identifier) continue;
      
      switch (identifier) {
        case 'description':
          metadata.description = content;
          break;
        case 'keywords':
          metadata.keywords = content;
          break;
        case 'author':
          metadata.author = content;
          break;
        case 'robots':
          metadata.robotsDirectives = content.split(',').map(d => d.trim().toLowerCase());
          break;
        case 'og:title':
          metadata.ogTitle = content;
          break;
        case 'og:description':
          metadata.ogDescription = content;
          break;
        case 'og:image':
          metadata.ogImage = resolveUrl(content, baseUrl);
          break;
        case 'og:url':
          metadata.ogUrl = content;
          break;
        case 'og:type':
          metadata.ogType = content;
          break;
        case 'twitter:card':
          metadata.twitterCard = content;
          break;
        case 'twitter:title':
          metadata.twitterTitle = content;
          break;
        case 'twitter:description':
          metadata.twitterDescription = content;
          break;
        case 'twitter:image':
          metadata.twitterImage = resolveUrl(content, baseUrl);
          break;
      }
    }
    
    // Extract canonical link with more flexible regex
    const canonicalMatch = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i) ||
                          html.match(/<link[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["']/i);
    if (canonicalMatch) {
      metadata.canonical = resolveUrl(canonicalMatch[1], baseUrl);
    }
    
    // Extract JSON-LD schema
    metadata.schema = extractJsonLdSchema(html);
    
  } catch (error) {
    console.error('Error extracting metadata:', error);
  }
  
  return metadata;
}

/**
 * Extract JSON-LD schema markup from HTML
 */
function extractJsonLdSchema(html: string): any[] {
  const schemas: any[] = [];
  
  try {
    // More robust regex to handle multiline and various whitespace patterns
    const scriptRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    
    while ((match = scriptRegex.exec(html)) !== null) {
      const jsonContent = match[1].trim();
      if (jsonContent) {
        try {
          const jsonData = JSON.parse(jsonContent);
          // Ensure we have valid schema data
          if (jsonData && (jsonData['@type'] || jsonData.type)) {
            schemas.push(jsonData);
          }
        } catch (e) {
          console.warn('Failed to parse JSON-LD schema:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error extracting JSON-LD schema:', error);
  }
  
  return schemas;
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  };
  
  return text.replace(/&(?:#x?[a-f0-9]+|[a-z0-9]+);/gi, (entity) => {
    return entities[entity.toLowerCase()] || entity;
  });
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

/**
 * Check if robots.txt exists and fetch its content
 */
export async function checkRobotsTxt(baseUrl: string): Promise<{
  exists: boolean;
  content?: string;
  error?: string;
}> {
  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    const response = await fetch(robotsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'FindableAI-Scanner/1.0'
      }
    });
    
    if (response.ok) {
      const content = await response.text();
      return {
        exists: true,
        content: content.substring(0, 5000) // Limit content size
      };
    } else {
      return {
        exists: false,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if sitemap.xml exists
 */
export async function checkSitemap(baseUrl: string): Promise<{
  exists: boolean;
  url?: string;
  error?: string;
}> {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemaps.xml`
  ];
  
  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'FindableAI-Scanner/1.0'
        }
      });
      
      if (response.ok) {
        return {
          exists: true,
          url: sitemapUrl
        };
      }
    } catch (error) {
      // Continue to next URL
    }
  }
  
  return {
    exists: false,
    error: 'No sitemap found'
  };
}