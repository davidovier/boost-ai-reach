import { extractRequestMetadata } from "./event-logger.ts";

// Generate correlation ID for request tracing
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract correlation ID from headers or generate new one
export function getCorrelationId(req: Request): string {
  const existingId = req.headers.get('x-correlation-id') || 
                    req.headers.get('x-request-id') ||
                    req.headers.get('x-trace-id');
  
  return existingId || generateCorrelationId();
}

// Patterns to identify and mask sensitive data
const SENSITIVE_PATTERNS = [
  // API Keys
  { pattern: /sk-[a-zA-Z0-9]{48}/g, replacement: 'sk-***MASKED***' },
  { pattern: /pk-[a-zA-Z0-9]{48}/g, replacement: 'pk-***MASKED***' },
  { pattern: /Bearer\s+[a-zA-Z0-9\-_.]{20,}/gi, replacement: 'Bearer ***MASKED***' },
  
  // Common API key patterns
  { pattern: /api[_-]?key["']?\s*[:=]\s*["']?[a-zA-Z0-9\-_.]{20,}["']?/gi, replacement: 'api_key="***MASKED***"' },
  { pattern: /token["']?\s*[:=]\s*["']?[a-zA-Z0-9\-_.]{20,}["']?/gi, replacement: 'token="***MASKED***"' },
  { pattern: /secret["']?\s*[:=]\s*["']?[a-zA-Z0-9\-_.]{20,}["']?/gi, replacement: 'secret="***MASKED***"' },
  
  // JWT tokens
  { pattern: /eyJ[a-zA-Z0-9\-_.]{20,}/g, replacement: 'eyJ***MASKED***' },
  
  // Stripe keys
  { pattern: /sk_live_[a-zA-Z0-9]{24}/g, replacement: 'sk_live_***MASKED***' },
  { pattern: /sk_test_[a-zA-Z0-9]{24}/g, replacement: 'sk_test_***MASKED***' },
  { pattern: /pk_live_[a-zA-Z0-9]{24}/g, replacement: 'pk_live_***MASKED***' },
  { pattern: /pk_test_[a-zA-Z0-9]{24}/g, replacement: 'pk_test_***MASKED***' },
  
  // OpenAI API keys
  { pattern: /sk-proj-[a-zA-Z0-9\-_]{48}/g, replacement: 'sk-proj-***MASKED***' },
  
  // Common password patterns
  { pattern: /password["']?\s*[:=]\s*["']?[^\s"',;}{]{6,}["']?/gi, replacement: 'password="***MASKED***"' },
  { pattern: /pass["']?\s*[:=]\s*["']?[^\s"',;}{]{6,}["']?/gi, replacement: 'pass="***MASKED***"' },
  
  // UUIDs that might be session tokens
  { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, replacement: (match: string) => {
    // Only mask if it appears in sensitive contexts
    const context = match.toLowerCase();
    if (context.includes('session') || context.includes('token') || context.includes('auth')) {
      return '***UUID-MASKED***';
    }
    return match; // Keep regular UUIDs (like user IDs, record IDs)
  }}
];

// Mask sensitive data in strings
export function maskSensitiveData(data: any): any {
  if (typeof data === 'string') {
    let maskedData = data;
    
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      if (typeof replacement === 'function') {
        maskedData = maskedData.replace(pattern, replacement);
      } else {
        maskedData = maskedData.replace(pattern, replacement);
      }
    }
    
    return maskedData;
  } else if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  } else if (data !== null && typeof data === 'object') {
    const maskedObj: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Mask sensitive field names
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') || 
          lowerKey.includes('secret') || 
          lowerKey.includes('token') ||
          lowerKey.includes('key') ||
          lowerKey.includes('auth')) {
        maskedObj[key] = '***MASKED***';
      } else {
        maskedObj[key] = maskSensitiveData(value);
      }
    }
    
    return maskedObj;
  }
  
  return data;
}

// Secure logger interface
export interface LogContext {
  correlationId: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
}

export interface LogMetadata {
  [key: string]: any;
}

export class SecureLogger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  private formatLog(level: string, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level: level.toUpperCase(),
      correlationId: this.context.correlationId,
      message: maskSensitiveData(message),
      ...this.context,
      ...(metadata && { metadata: maskSensitiveData(metadata) })
    };

    return JSON.stringify(baseLog);
  }

  info(message: string, metadata?: LogMetadata): void {
    console.log(this.formatLog('info', message, metadata));
  }

  warn(message: string, metadata?: LogMetadata): void {
    console.warn(this.formatLog('warn', message, metadata));
  }

  error(message: string, error?: Error | any, metadata?: LogMetadata): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: maskSensitiveData(error.message),
      stack: error.stack ? maskSensitiveData(error.stack) : undefined
    } : maskSensitiveData(error);

    const logMetadata = {
      ...metadata,
      ...(error && { error: errorData })
    };

    console.error(this.formatLog('error', message, logMetadata));
  }

  debug(message: string, metadata?: LogMetadata): void {
    console.debug(this.formatLog('debug', message, metadata));
  }

  // Log HTTP request start
  logRequestStart(method: string, url: string, headers?: Record<string, string>): void {
    this.info('Request started', {
      method,
      url: maskSensitiveData(url),
      headers: headers ? maskSensitiveData(headers) : undefined
    });
  }

  // Log HTTP request completion
  logRequestEnd(method: string, url: string, status: number, duration?: number): void {
    this.info('Request completed', {
      method,
      url: maskSensitiveData(url),
      status,
      ...(duration && { durationMs: duration })
    });
  }

  // Log database operations
  logDbOperation(operation: string, table: string, conditions?: any, result?: any): void {
    this.info(`Database ${operation}`, {
      operation,
      table,
      conditions: conditions ? maskSensitiveData(conditions) : undefined,
      ...(result && { 
        success: !result.error,
        recordCount: result.data?.length || (result.data ? 1 : 0),
        error: result.error ? maskSensitiveData(result.error.message) : undefined
      })
    });
  }

  // Log external API calls
  logExternalApiCall(service: string, endpoint: string, method: string, status?: number): void {
    this.info(`External API call to ${service}`, {
      service,
      endpoint: maskSensitiveData(endpoint),
      method,
      ...(status && { status })
    });
  }

  // Log authentication events
  logAuthEvent(event: string, userId?: string, success: boolean = true): void {
    this.info(`Auth event: ${event}`, {
      event,
      userId,
      success
    });
  }

  // Log rate limiting events
  logRateLimit(identifier: string, endpoint: string, allowed: boolean, remaining?: number): void {
    this.info('Rate limit check', {
      identifier: maskSensitiveData(identifier),
      endpoint,
      allowed,
      ...(remaining !== undefined && { remaining })
    });
  }
}

// Factory function to create logger with request context
export function createSecureLogger(req: Request, additionalContext?: Partial<LogContext>): SecureLogger {
  const correlationId = getCorrelationId(req);
  const url = new URL(req.url);
  
  // Extract IP from headers
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            req.headers.get('cf-connecting-ip') ||
            'unknown';

  const context: LogContext = {
    correlationId,
    endpoint: url.pathname,
    method: req.method,
    ip: maskSensitiveData(ip),
    userAgent: maskSensitiveData(req.headers.get('user-agent') || 'unknown'),
    ...additionalContext
  };

  return new SecureLogger(context);
}

// Middleware to add correlation ID to response headers
export function addCorrelationIdToResponse(response: Response, correlationId: string): Response {
  const headers = new Headers(response.headers);
  headers.set('x-correlation-id', correlationId);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Legacy console.log replacement for gradual migration
export function secureLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
  const maskedMessage = maskSensitiveData(message);
  const maskedData = data ? maskSensitiveData(data) : undefined;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: maskedMessage,
    ...(maskedData && { data: maskedData })
  };

  switch (level) {
    case 'info':
      console.log(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
  }
}