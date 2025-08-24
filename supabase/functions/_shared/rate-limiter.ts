import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  requestCount?: number;
  maxRequests?: number;
  windowStart?: Date;
}

/**
 * Rate limiter using sliding window algorithm
 * @param supabase - Supabase client instance
 * @param identifier - User ID or IP address
 * @param config - Rate limit configuration
 * @returns Promise with rate limit result
 */
export async function checkRateLimit(
  supabase: any,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const windowStartTime = new Date(Date.now() - (config.windowMinutes * 60 * 1000));
    
    // Clean up old records first (optional optimization)
    await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStartTime.toISOString());

    // Get current rate limit record
    const { data: existing, error: selectError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', config.endpoint)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Rate limit check error:', selectError);
      // On error, allow the request (fail open)
      return { allowed: true };
    }

    const now = new Date();
    
    if (!existing) {
      // First request - create new record
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint: config.endpoint,
          request_count: 1,
          window_start: now.toISOString()
        });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
        return { allowed: true }; // Fail open
      }

      return {
        allowed: true,
        requestCount: 1,
        maxRequests: config.maxRequests,
        windowStart: now
      };
    }

    const windowStart = new Date(existing.window_start);
    const windowAge = (now.getTime() - windowStart.getTime()) / 1000 / 60; // minutes

    if (windowAge >= config.windowMinutes) {
      // Window expired, reset counter
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Rate limit reset error:', updateError);
        return { allowed: true }; // Fail open
      }

      return {
        allowed: true,
        requestCount: 1,
        maxRequests: config.maxRequests,
        windowStart: now
      };
    }

    // Within the window - check if limit exceeded
    if (existing.request_count >= config.maxRequests) {
      const remainingWindowTime = (config.windowMinutes * 60) - (windowAge * 60);
      
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(remainingWindowTime),
        requestCount: existing.request_count,
        maxRequests: config.maxRequests,
        windowStart: windowStart
      };
    }

    // Increment counter
    const { error: incrementError } = await supabase
      .from('rate_limits')
      .update({
        request_count: existing.request_count + 1,
        updated_at: now.toISOString()
      })
      .eq('id', existing.id);

    if (incrementError) {
      console.error('Rate limit increment error:', incrementError);
      return { allowed: true }; // Fail open
    }

    return {
      allowed: true,
      requestCount: existing.request_count + 1,
      maxRequests: config.maxRequests,
      windowStart: windowStart
    };

  } catch (error) {
    console.error('Rate limiter error:', error);
    return { allowed: true }; // Fail open on errors
  }
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(req: Request): string {
  // Try different headers in order of preference
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback - this might not be the real IP in production
  return req.headers.get('host') || 'unknown';
}

/**
 * Create rate limit response with proper headers
 */
export function createRateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>): Response {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': result.maxRequests?.toString() || '0',
    'X-RateLimit-Remaining': Math.max(0, (result.maxRequests || 0) - (result.requestCount || 0)).toString(),
  };

  if (result.retryAfterSeconds) {
    headers['Retry-After'] = result.retryAfterSeconds.toString();
  }

  if (result.windowStart) {
    headers['X-RateLimit-Reset'] = Math.floor((result.windowStart.getTime() + (60 * 60 * 1000)) / 1000).toString();
  }

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${result.retryAfterSeconds} seconds.`,
      retryAfter: result.retryAfterSeconds
    }),
    {
      status: 429,
      headers
    }
  );
}

// Common rate limit configurations
export const RATE_LIMITS = {
  SCANS_PER_USER: { maxRequests: 10, windowMinutes: 60, endpoint: 'scans' },
  PROMPTS_PER_USER: { maxRequests: 20, windowMinutes: 60, endpoint: 'prompts' },
  ADMIN_PER_IP: { maxRequests: 100, windowMinutes: 60, endpoint: 'admin' },
  ADMIN_HEAVY_PER_IP: { maxRequests: 10, windowMinutes: 60, endpoint: 'admin-heavy' }, // For analytics, exports
} as const;