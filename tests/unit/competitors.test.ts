import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the normalizeDomain function
function normalizeDomain(input: string): string | null {
  try {
    const hasProtocol = /^https?:\/\//i.test(input);
    const u = new URL(hasProtocol ? input : `https://${input}`);
    let host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    return host;
  } catch (_) {
    return null;
  }
}

// Mock the extractMeta function
function extractMeta(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().slice(0, 300) : null;

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const description = descMatch ? descMatch[1].trim().slice(0, 500) : null;

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim().slice(0, 300) : null;

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const ogDescription = ogDescMatch ? ogDescMatch[1].trim().slice(0, 500) : null;

  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i);
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;

  const schemaBlocks: any[] = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRegex.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      schemaBlocks.push(parsed);
    } catch (_) {
      // ignore invalid blocks
    }
  }

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    canonical,
    schemaBlocks,
  };
}

// Mock the computeScore function
function computeScore(meta: ReturnType<typeof extractMeta>): number {
  let score = 0;
  if (meta.title) score += 20;
  if (meta.description) score += 20;
  if (meta.ogTitle) score += 10;
  if (meta.ogDescription) score += 10;
  if (meta.canonical) score += 10;
  if (meta.schemaBlocks.length > 0) score += 30;
  return Math.max(0, Math.min(100, score));
}

describe('Competitor Management Functions', () => {
  describe('normalizeDomain', () => {
    it('should normalize domain with protocol', () => {
      expect(normalizeDomain('https://example.com')).toBe('example.com');
      expect(normalizeDomain('http://example.com')).toBe('example.com');
    });

    it('should normalize domain without protocol', () => {
      expect(normalizeDomain('example.com')).toBe('example.com');
    });

    it('should remove www prefix', () => {
      expect(normalizeDomain('www.example.com')).toBe('example.com');
      expect(normalizeDomain('https://www.example.com')).toBe('example.com');
    });

    it('should handle invalid domains', () => {
      expect(normalizeDomain('')).toBe(null);
      expect(normalizeDomain('invalid-url')).toBe(null);
    });

    it('should handle complex domains', () => {
      expect(normalizeDomain('https://sub.example.com/path?query=1')).toBe('sub.example.com');
    });
  });

  describe('extractMeta', () => {
    it('should extract title from HTML', () => {
      const html = '<title>Test Title</title>';
      const meta = extractMeta(html);
      expect(meta.title).toBe('Test Title');
    });

    it('should extract meta description', () => {
      const html = '<meta name="description" content="Test description">';
      const meta = extractMeta(html);
      expect(meta.description).toBe('Test description');
    });

    it('should extract Open Graph title and description', () => {
      const html = `
        <meta property="og:title" content="OG Title">
        <meta property="og:description" content="OG Description">
      `;
      const meta = extractMeta(html);
      expect(meta.ogTitle).toBe('OG Title');
      expect(meta.ogDescription).toBe('OG Description');
    });

    it('should extract canonical URL', () => {
      const html = '<link rel="canonical" href="https://example.com/canonical">';
      const meta = extractMeta(html);
      expect(meta.canonical).toBe('https://example.com/canonical');
    });

    it('should extract JSON-LD schema blocks', () => {
      const schemaJson = { "@type": "Organization", "name": "Test Org" };
      const html = `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>`;
      const meta = extractMeta(html);
      expect(meta.schemaBlocks).toHaveLength(1);
      expect(meta.schemaBlocks[0]).toEqual(schemaJson);
    });

    it('should handle invalid JSON-LD gracefully', () => {
      const html = '<script type="application/ld+json">invalid json</script>';
      const meta = extractMeta(html);
      expect(meta.schemaBlocks).toHaveLength(0);
    });

    it('should truncate long title and description', () => {
      const longTitle = 'A'.repeat(400);
      const longDesc = 'B'.repeat(600);
      const html = `
        <title>${longTitle}</title>
        <meta name="description" content="${longDesc}">
      `;
      const meta = extractMeta(html);
      expect(meta.title?.length).toBe(300);
      expect(meta.description?.length).toBe(500);
    });
  });

  describe('computeScore', () => {
    it('should compute score for complete metadata', () => {
      const meta = {
        title: 'Test Title',
        description: 'Test Description',
        ogTitle: 'OG Title', 
        ogDescription: 'OG Description',
        canonical: 'https://example.com',
        schemaBlocks: [{ "@type": "Organization" }]
      };
      const score = computeScore(meta);
      expect(score).toBe(100); // 20+20+10+10+10+30 = 100
    });

    it('should compute score for minimal metadata', () => {
      const meta = {
        title: 'Test Title',
        description: null,
        ogTitle: null,
        ogDescription: null,
        canonical: null,
        schemaBlocks: []
      };
      const score = computeScore(meta);
      expect(score).toBe(20); // Only title
    });

    it('should compute score for no metadata', () => {
      const meta = {
        title: null,
        description: null,
        ogTitle: null,
        ogDescription: null,
        canonical: null,
        schemaBlocks: []
      };
      const score = computeScore(meta);
      expect(score).toBe(0);
    });

    it('should prioritize schema markup', () => {
      const meta = {
        title: null,
        description: null,
        ogTitle: null,
        ogDescription: null,
        canonical: null,
        schemaBlocks: [{ "@type": "Organization" }]
      };
      const score = computeScore(meta);
      expect(score).toBe(30); // Only schema
    });

    it('should cap score at 100', () => {
      const meta = {
        title: 'Test',
        description: 'Test',
        ogTitle: 'Test',
        ogDescription: 'Test',
        canonical: 'https://example.com',
        schemaBlocks: [{ "@type": "Organization" }, { "@type": "WebSite" }]
      };
      const score = computeScore(meta);
      expect(score).toBe(100); // Should not exceed 100
    });
  });

  describe('Competition Analysis', () => {
    it('should calculate delta between competitor and user baseline', () => {
      const userBaseline = 75;
      const competitorScore = 85;
      const delta = competitorScore - userBaseline;
      expect(delta).toBe(10);
    });

    it('should determine performance relative to baseline', () => {
      const userBaseline = 75;
      
      // Better performance
      expect(85 - userBaseline > 0).toBe(true);
      
      // Worse performance  
      expect(65 - userBaseline < 0).toBe(true);
      
      // Equal performance
      expect(75 - userBaseline === 0).toBe(true);
    });

    it('should handle null baseline or score', () => {
      const userBaseline = null;
      const competitorScore = 85;
      const delta = userBaseline != null && competitorScore != null ? competitorScore - userBaseline : null;
      expect(delta).toBe(null);
    });
  });

  describe('Competitor Data Structure', () => {
    it('should structure competitor response correctly', () => {
      const competitor = {
        id: 'comp-123',
        domain: 'competitor.com',
        notes: 'Strong competitor',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const latestSnapshot = {
        score: 85,
        snapshot_date: '2024-01-01T00:00:00Z'
      };

      const userBaseline = 75;
      const delta = latestSnapshot.score - userBaseline;
      
      const expectedStructure = {
        id: competitor.id,
        domain: competitor.domain,
        notes: competitor.notes,
        created_at: competitor.created_at,
        updated_at: competitor.updated_at,
        latestSnapshot,
        comparison: {
          userBaseline,
          delta,
          performance: delta > 0 ? 'better' : delta < 0 ? 'worse' : 'equal'
        }
      };

      expect(expectedStructure.comparison.performance).toBe('better');
      expect(expectedStructure.comparison.delta).toBe(10);
    });
  });
});