/**
 * Shared caching utilities for Supabase Edge Functions
 * Provides in-memory caching with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: number;

  constructor(cleanupIntervalMs: number = 5 * 60 * 1000) {
    this.cleanupInterval = cleanupIntervalMs;
    this.startCleanup();
  }

  private startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const globalCache = new MemoryCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  VERY_SHORT: 1 * 60 * 1000,      // 1 minute
  SHORT: 5 * 60 * 1000,           // 5 minutes  
  MEDIUM: 15 * 60 * 1000,         // 15 minutes
  LONG: 60 * 60 * 1000,           // 1 hour
  VERY_LONG: 4 * 60 * 60 * 1000,  // 4 hours
} as const;

/**
 * Get data from cache
 */
export function getCached<T>(key: string): T | null {
  return globalCache.get<T>(key);
}

/**
 * Set data in cache with TTL
 */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
  globalCache.set(key, data, ttlMs);
}

/**
 * Check if key exists in cache
 */
export function hasCache(key: string): boolean {
  return globalCache.has(key);
}

/**
 * Delete key from cache
 */
export function deleteCache(key: string): void {
  globalCache.delete(key);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: globalCache.size(),
    cleanup_interval: globalCache['cleanupInterval']
  };
}

/**
 * Create cache key with user context
 */
export function createUserCacheKey(userId: string, operation: string, params?: Record<string, any>): string {
  const paramString = params ? `_${JSON.stringify(params)}` : '';
  return `user_${userId}_${operation}${paramString}`;
}

/**
 * Create cache key for admin operations
 */
export function createAdminCacheKey(operation: string, params?: Record<string, any>): string {
  const paramString = params ? `_${JSON.stringify(params)}` : '';
  return `admin_${operation}${paramString}`;
}

/**
 * Wrapper function for caching async operations
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetchFn: () => Promise<T>
): Promise<{ data: T; cached: boolean; cacheTimestamp?: number }> {
  // Check cache first
  const cached = getCached<T>(key);
  if (cached !== null) {
    const entry = globalCache['cache'].get(key);
    return {
      data: cached,
      cached: true,
      cacheTimestamp: entry?.timestamp
    };
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the result
  setCache(key, data, ttlMs);
  
  return {
    data,
    cached: false,
    cacheTimestamp: Date.now()
  };
}

/**
 * HTTP Cache headers for client-side caching
 */
export function getCacheHeaders(maxAgeSeconds: number, sMaxAgeSeconds?: number) {
  const headers: Record<string, string> = {
    'Cache-Control': `public, max-age=${maxAgeSeconds}`,
    'Vary': 'Authorization'
  };
  
  if (sMaxAgeSeconds) {
    headers['Cache-Control'] += `, s-maxage=${sMaxAgeSeconds}`;
  }
  
  return headers;
}

/**
 * No-cache headers for sensitive endpoints
 */
export function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}