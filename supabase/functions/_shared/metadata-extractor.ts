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
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Extract meta tags
    const metaTags = html.match(/<meta[^>]+>/gi) || [];
    
    metaTags.forEach(tag => {
      const nameMatch = tag.match(/name=["']([^"']+)["']/i);
      const propertyMatch = tag.match(/property=["']([^"']+)["']/i);
      const contentMatch = tag.match(/content=["']([^"']*)["']/i);
      
      if (!contentMatch) return;
      
      const content = contentMatch[1].trim();
      const identifier = (nameMatch?.[1] || propertyMatch?.[1] || '').toLowerCase();
      
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
    });
    
    // Extract canonical link
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
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
    const scriptTags = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi) || [];
    
    scriptTags.forEach(scriptTag => {
      const jsonMatch = scriptTag.match(/>([^<]+)</);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[1].trim());
          schemas.push(jsonData);
        } catch (e) {
          console.warn('Failed to parse JSON-LD schema:', e);
        }
      }
    });
  } catch (error) {
    console.error('Error extracting JSON-LD schema:', error);
  }
  
  return schemas;
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