import { describe, it, expect } from 'vitest';
import { validateUrl, getBaseDomain } from '../../supabase/functions/_shared/url-validator';

describe('URL Validator', () => {
  describe('validateUrl', () => {
    it('should validate legitimate URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/');
    });

    it('should normalize HTTP URLs', () => {
      const result = validateUrl('http://test.com/path?query=1');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('http://test.com/path?query=1');
    });

    it('should reject non-HTTP protocols', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only HTTP and HTTPS protocols are allowed');
    });

    it('should block private IP addresses', () => {
      const testCases = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '127.0.0.1'
      ];

      testCases.forEach(ip => {
        const result = validateUrl(`http://${ip}`);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Private IP addresses are not allowed');
      });
    });

    it('should block localhost domains', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This domain is not allowed');
    });

    it('should block metadata service URLs', () => {
      const result = validateUrl('http://169.254.169.254/metadata');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This domain is not allowed');
    });

    it('should handle invalid URL formats', () => {
      const result = validateUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should allow legitimate domains with ports', () => {
      const result = validateUrl('https://api.example.com:443/endpoint');
      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe('https://api.example.com/endpoint');
    });
  });

  describe('getBaseDomain', () => {
    it('should extract base domain from URL', () => {
      const result = getBaseDomain('https://www.example.com/path/to/page?query=1');
      expect(result).toBe('https://www.example.com');
    });

    it('should handle URLs with ports', () => {
      const result = getBaseDomain('http://example.com:8080/path');
      expect(result).toBe('http://example.com:8080');
    });

    it('should handle invalid URLs gracefully', () => {
      const result = getBaseDomain('invalid-url');
      expect(result).toBe('');
    });
  });
});