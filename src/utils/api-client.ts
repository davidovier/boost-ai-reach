import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';
import type { Database } from '@/integrations/supabase/types';

// Enhanced error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Enhanced API client wrapper
class ApiClient {
  private supabase: SupabaseClient<Database>;
  private requestInterceptors: Array<(config: RequestInit) => RequestInit | Promise<RequestInit>> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];
  private errorInterceptors: Array<(error: Error) => void> = [];

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Set up default error handling
    this.addErrorInterceptor(this.defaultErrorHandler.bind(this));
  }

  // Get Supabase client instance
  get client(): SupabaseClient<Database> {
    return this.supabase;
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: (config: RequestInit) => RequestInit | Promise<RequestInit>) {
    this.requestInterceptors.push(interceptor);
    return this;
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.responseInterceptors.push(interceptor);
    return this;
  }

  // Add error interceptor
  addErrorInterceptor(interceptor: (error: Error) => void) {
    this.errorInterceptors.push(interceptor);
    return this;
  }

  // Enhanced fetch wrapper with interceptors
  async request<T>(
    url: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<T> {
    let config = { ...options };

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);

        // Apply response interceptors
        let processedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          processedResponse = await interceptor(processedResponse);
        }

        if (!processedResponse.ok) {
          const errorData = await this.safeJsonParse(processedResponse);
          throw new ApiError(
            errorData?.message || `HTTP ${processedResponse.status}: ${processedResponse.statusText}`,
            processedResponse.status,
            errorData?.code,
            errorData
          );
        }

        const data = await processedResponse.json();
        logger.debug('API Request successful:', { url, method: config.method || 'GET' });
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Handle network errors
        if (!navigator.onLine) {
          lastError = new NetworkError('No internet connection');
        } else if (lastError.message.includes('fetch')) {
          lastError = new NetworkError('Network request failed', lastError);
        }

        // Log error
        logger.error('API Request failed:', { url, method: config.method || 'GET', error: lastError.message, attempt });

        // Apply error interceptors
        this.errorInterceptors.forEach(interceptor => interceptor(lastError));

        // Don't retry on client errors or validation errors
        if (lastError instanceof ApiError && lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }

        // Exponential backoff for retries
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // 1s, 2s, 4s with jitter
          logger.debug(`Retrying request in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // Supabase-specific methods with enhanced error handling
  async query<T>(
    table: string,
    options: {
      select?: string;
      filter?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<T[]> {
    try {
      let query = this.supabase.from(table).select(options.select || '*');

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'string' && value.includes('%')) {
              query = query.like(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Apply ordering
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new ApiError(error.message, 400, error.code, error);
      }

      return data as T[];
    } catch (error) {
      logger.error('Query failed:', { table, options, error });
      throw this.handleSupabaseError(error);
    }
  }

  async insert<T>(table: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new ApiError(error.message, 400, error.code, error);
      }

      return result as T;
    } catch (error) {
      logger.error('Insert failed:', { table, data, error });
      throw this.handleSupabaseError(error);
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new ApiError(error.message, 400, error.code, error);
      }

      return result as T;
    } catch (error) {
      logger.error('Update failed:', { table, id, data, error });
      throw this.handleSupabaseError(error);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new ApiError(error.message, 400, error.code, error);
      }
    } catch (error) {
      logger.error('Delete failed:', { table, id, error });
      throw this.handleSupabaseError(error);
    }
  }

  // File upload with progress tracking
  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options?: {
      onProgress?: (progress: number) => void;
      contentType?: string;
      cacheControl?: string;
    }
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: options?.contentType || file.type,
          cacheControl: options?.cacheControl || '3600',
          upsert: true,
        });

      if (error) {
        throw new ApiError(error.message, 400, 'UPLOAD_ERROR', error);
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      logger.error('File upload failed:', { bucket, path, error });
      throw this.handleSupabaseError(error);
    }
  }

  // Enhanced analytics tracking
  async trackEvent(
    event: string,
    properties?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      await this.insert('analytics_events', {
        event_name: event,
        properties: properties || {},
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Don't throw on analytics errors, just log them
      logger.error('Analytics tracking failed:', { event, properties, error });
    }
  }

  // Utility methods
  private async safeJsonParse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private handleSupabaseError(error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      // Map common Supabase errors to our error types
      if (error.message.includes('duplicate key value')) {
        return new ValidationError('This record already exists');
      }
      if (error.message.includes('foreign key constraint')) {
        return new ValidationError('Referenced record does not exist');
      }
      if (error.message.includes('permission denied')) {
        return new ApiError('Permission denied', 403, 'PERMISSION_DENIED');
      }
      if (error.message.includes('not authenticated')) {
        return new ApiError('Authentication required', 401, 'UNAUTHENTICATED');
      }

      return new ApiError(error.message, 500, 'INTERNAL_ERROR', error);
    }

    return new ApiError('Unknown error occurred', 500, 'UNKNOWN_ERROR');
  }

  private defaultErrorHandler(error: Error): void {
    // Global error handling logic
    if (error instanceof ApiError && error.status === 401) {
      // Redirect to login or refresh token
      logger.error('Authentication error - redirecting to login');
      // Could dispatch a global action here
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Convenience exports
export { apiClient as supabase };
export default apiClient;