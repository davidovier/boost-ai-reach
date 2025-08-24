import { describe, it, expect } from 'vitest';
import { extractMetadata } from '../../supabase/functions/_shared/metadata-extractor';

describe('Metadata Extractor', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sample Page Title</title>
      <meta name="description" content="This is a sample page description for testing.">
      <meta name="keywords" content="test, sample, metadata">
      <meta name="author" content="Test Author">
      <meta property="og:title" content="Sample OG Title">
      <meta property="og:description" content="Sample OG description">
      <meta property="og:image" content="/og-image.jpg">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Sample Twitter Title">
      <link rel="canonical" href="https://example.com/canonical">
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Sample Article"
      }
      </script>
    </head>
    <body>Content</body>
    </html>
  `;

  describe('extractMetadata', () => {
    it('should extract title from HTML', () => {
      const result = extractMetadata(sampleHtml, 'https://example.com');
      expect(result.title).toBe('Sample Page Title');
    });

    it('should extract meta description', () => {
      const result = extractMetadata(sampleHtml, 'https://example.com');
      expect(result.description).toBe('This is a sample page description for testing.');
    });

    it('should extract Open Graph tags', () => {
      const result = extractMetadata(sampleHtml, 'https://example.com');
      expect(result.ogTitle).toBe('Sample OG Title');
      expect(result.ogDescription).toBe('Sample OG description');
      expect(result.ogImage).toBe('https://example.com/og-image.jpg');
    });

    it('should extract Twitter meta tags', () => {
      const result = extractMetadata(sampleHtml, 'https://example.com');
      expect(result.twitterCard).toBe('summary_large_image');
      expect(result.twitterTitle).toBe('Sample Twitter Title');
    });

    it('should extract canonical URL', () => {
      const result = extractMetadata(sampleHtml, 'https://example.com');
      expect(result.canonical).toBe('https://example.com/canonical');
    });

    it('should extract JSON-LD schema', () => {
      const result = extractMetadata(sampleHtml, 'https://example.com');
      expect(result.schema).toHaveLength(1);
      expect(result.schema![0]['@type']).toBe('Article');
      expect(result.schema![0]['headline']).toBe('Sample Article');
    });

    it('should handle missing elements gracefully', () => {
      const minimalHtml = '<html><head></head><body></body></html>';
      const result = extractMetadata(minimalHtml, 'https://example.com');
      
      expect(result.title).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.schema).toEqual([]);
    });

    it('should extract keywords and author', () => {
      const result = extractMetadata(sampleHtml, 'https://example.com');
      expect(result.keywords).toBe('test, sample, metadata');
      expect(result.author).toBe('Test Author');
    });

    it('should handle malformed JSON-LD', () => {
      const htmlWithBadJson = `
        <html>
        <head>
          <script type="application/ld+json">
          { invalid json }
          </script>
        </head>
        <body></body>
        </html>
      `;
      
      const result = extractMetadata(htmlWithBadJson, 'https://example.com');
      expect(result.schema).toEqual([]);
    });

    it('should resolve relative URLs to absolute', () => {
      const htmlWithRelativeUrls = `
        <html>
        <head>
          <meta property="og:image" content="/relative-image.jpg">
          <link rel="canonical" href="/relative-canonical">
        </head>
        <body></body>
        </html>
      `;
      
      const result = extractMetadata(htmlWithRelativeUrls, 'https://example.com');
      expect(result.ogImage).toBe('https://example.com/relative-image.jpg');
      expect(result.canonical).toBe('https://example.com/relative-canonical');
    });
  });
});