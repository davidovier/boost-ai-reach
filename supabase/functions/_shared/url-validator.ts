/**
 * URL validation and SSRF protection utilities
 */

// Private IP ranges to block for SSRF protection
const PRIVATE_IP_RANGES = [
  // IPv4 Private ranges
  /^10\./,                    // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
  /^192\.168\./,              // 192.168.0.0/16
  /^127\./,                   // 127.0.0.0/8 (localhost)
  /^169\.254\./,              // 169.254.0.0/16 (link-local)
  /^224\./,                   // 224.0.0.0/4 (multicast)
  /^240\./,                   // 240.0.0.0/4 (reserved)
  
  // IPv6 Private ranges
  /^::1$/,                    // ::1 (localhost)
  /^fc00:/,                   // fc00::/7 (unique local)
  /^fe80:/,                   // fe80::/10 (link-local)
  /^ff00:/,                   // ff00::/8 (multicast)
];

// Blocked domains for SSRF protection
const BLOCKED_DOMAINS = [
  'localhost',
  'metadata.google.internal',
  '169.254.169.254', // AWS metadata service
  'metadata.packet.net',
  'metadata.digitalocean.com',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validate and normalize a URL, with SSRF protection
 */
export function validateUrl(urlString: string): ValidationResult {
  try {
    // Basic URL parsing
    const url = new URL(urlString);
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS protocols are allowed'
      };
    }
    
    // Check for blocked domains
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_DOMAINS.includes(hostname)) {
      return {
        valid: false,
        error: 'This domain is not allowed'
      };
    }
    
    // Check for private IP addresses
    if (isPrivateIp(hostname)) {
      return {
        valid: false,
        error: 'Private IP addresses are not allowed'
      };
    }
    
    // Normalize the URL
    const normalizedUrl = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}${url.pathname}${url.search}`;
    
    return {
      valid: true,
      normalizedUrl
    };
    
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Check if a hostname/IP is in a private range
 */
function isPrivateIp(hostname: string): boolean {
  // Check if it's an IP address (IPv4 or IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Regex.test(hostname) || ipv6Regex.test(hostname)) {
    // It's an IP address, check against private ranges
    return PRIVATE_IP_RANGES.some(range => range.test(hostname));
  }
  
  // For domain names, we'll let DNS resolution handle it
  // but we block obvious local domains
  const localDomains = ['localhost', 'local', 'internal'];
  return localDomains.some(domain => hostname.includes(domain));
}

/**
 * Extract base domain from URL for robots.txt and sitemap checks
 */
export function getBaseDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}`;
  } catch {
    return '';
  }
}