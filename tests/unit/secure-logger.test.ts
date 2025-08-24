import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

global.console = mockConsole as any;

// Import functions after mocking
const { 
  maskSensitiveData, 
  generateCorrelationId, 
  getCorrelationId,
  SecureLogger,
  createSecureLogger 
} = await import('../supabase/functions/_shared/secure-logger.ts');

describe('Secure Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('maskSensitiveData', () => {
    it('should mask OpenAI API keys', () => {
      const input = 'API key is sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH';
      const result = maskSensitiveData(input);
      expect(result).toBe('API key is sk-proj-***MASKED***');
    });

    it('should mask Bearer tokens', () => {
      const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = maskSensitiveData(input);
      expect(result).toBe('Authorization: Bearer ***MASKED***');
    });

    it('should mask Stripe keys', () => {
      const input = 'Stripe key: sk_live_1234567890abcdef12345678';
      const result = maskSensitiveData(input);
      expect(result).toBe('Stripe key: sk_live_***MASKED***');
    });

    it('should mask JWT tokens', () => {
      const input = 'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = maskSensitiveData(input);
      expect(result).toBe('Token: eyJ***MASKED***');
    });

    it('should mask api_key field patterns', () => {
      const input = 'api_key="sk-1234567890abcdefghijk"';
      const result = maskSensitiveData(input);
      expect(result).toBe('api_key="***MASKED***"');
    });

    it('should mask password fields', () => {
      const input = 'password: "mySecretPassword123"';
      const result = maskSensitiveData(input);
      expect(result).toBe('password="***MASKED***"');
    });

    it('should mask sensitive data in objects', () => {
      const input = {
        username: 'john',
        password: 'secret123',
        apiKey: 'sk-1234567890abcdef',
        normalField: 'this is fine'
      };
      
      const result = maskSensitiveData(input);
      
      expect(result.username).toBe('john');
      expect(result.password).toBe('***MASKED***');
      expect(result.apiKey).toBe('***MASKED***');
      expect(result.normalField).toBe('this is fine');
    });

    it('should mask sensitive data in nested objects', () => {
      const input = {
        user: {
          name: 'John',
          credentials: {
            token: 'abc123xyz',
            secret: 'very-secret'
          }
        },
        config: {
          apiKey: 'sk-test123456'
        }
      };
      
      const result = maskSensitiveData(input);
      
      expect(result.user.name).toBe('John');
      expect(result.user.credentials.token).toBe('***MASKED***');
      expect(result.user.credentials.secret).toBe('***MASKED***');
      expect(result.config.apiKey).toBe('***MASKED***');
    });

    it('should mask sensitive data in arrays', () => {
      const input = ['normal string', 'api_key=sk-1234567890abcdef', 'another normal string'];
      const result = maskSensitiveData(input);
      
      expect(result[0]).toBe('normal string');
      expect(result[1]).toBe('api_key="***MASKED***"');
      expect(result[2]).toBe('another normal string');
    });

    it('should handle null and undefined values', () => {
      expect(maskSensitiveData(null)).toBe(null);
      expect(maskSensitiveData(undefined)).toBe(undefined);
      expect(maskSensitiveData('')).toBe('');
    });

    it('should preserve regular UUIDs that are not in sensitive contexts', () => {
      const input = 'User ID: 550e8400-e29b-41d4-a716-446655440000';
      const result = maskSensitiveData(input);
      expect(result).toBe('User ID: 550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate a correlation ID with req_ prefix', () => {
      const id = generateCorrelationId();
      expect(id).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });

    it('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('getCorrelationId', () => {
    it('should extract correlation ID from x-correlation-id header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-correlation-id': 'test-correlation-id' }
      });
      
      const id = getCorrelationId(req);
      expect(id).toBe('test-correlation-id');
    });

    it('should extract correlation ID from x-request-id header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-request-id': 'test-request-id' }
      });
      
      const id = getCorrelationId(req);
      expect(id).toBe('test-request-id');
    });

    it('should generate new correlation ID when no header present', () => {
      const req = new Request('http://localhost');
      
      const id = getCorrelationId(req);
      expect(id).toMatch(/^req_\d+_[a-z0-9]{9}$/);
    });
  });

  describe('SecureLogger', () => {
    let logger: any;

    beforeEach(() => {
      const context = {
        correlationId: 'test-correlation-id',
        userId: 'user-123',
        endpoint: '/api/test',
        method: 'POST'
      };
      logger = new SecureLogger(context);
    });

    it('should log info messages with correlation ID', () => {
      logger.info('Test message', { key: 'value' });
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"correlationId":"test-correlation-id"')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
    });

    it('should log error messages with masked sensitive data', () => {
      const error = new Error('API key sk-1234567890abcdef failed');
      logger.error('External API failed', error, { apiKey: 'sk-secret123' });
      
      const logCall = mockConsole.error.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.correlationId).toBe('test-correlation-id');
      expect(logData.message).toBe('External API failed');
      expect(logData.error.message).toContain('***MASKED***');
      expect(logData.metadata.apiKey).toBe('***MASKED***');
    });

    it('should log rate limit events', () => {
      logger.logRateLimit('user-123', '/api/scans', true, 5);
      
      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.message).toBe('Rate limit check');
      expect(logData.metadata.endpoint).toBe('/api/scans');
      expect(logData.metadata.allowed).toBe(true);
      expect(logData.metadata.remaining).toBe(5);
    });

    it('should log database operations', () => {
      const result = { data: [{ id: 1 }, { id: 2 }], error: null };
      logger.logDbOperation('SELECT', 'users', { active: true }, result);
      
      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.message).toBe('Database SELECT');
      expect(logData.metadata.operation).toBe('SELECT');
      expect(logData.metadata.table).toBe('users');
      expect(logData.metadata.recordCount).toBe(2);
      expect(logData.metadata.success).toBe(true);
    });

    it('should log external API calls', () => {
      logger.logExternalApiCall('OpenAI', '/v1/chat/completions', 'POST', 200);
      
      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.message).toBe('External API call to OpenAI');
      expect(logData.metadata.service).toBe('OpenAI');
      expect(logData.metadata.method).toBe('POST');
      expect(logData.metadata.status).toBe(200);
    });

    it('should log authentication events', () => {
      logger.logAuthEvent('login', 'user-123', true);
      
      const logCall = mockConsole.log.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.message).toBe('Auth event: login');
      expect(logData.metadata.event).toBe('login');
      expect(logData.metadata.userId).toBe('user-123');
      expect(logData.metadata.success).toBe(true);
    });
  });

  describe('createSecureLogger', () => {
    it('should create logger with request context', () => {
      const req = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 
          'x-correlation-id': 'test-id',
          'user-agent': 'Test Browser',
          'x-forwarded-for': '192.168.1.1'
        }
      });
      
      const logger = createSecureLogger(req);
      
      expect(logger.context.correlationId).toBe('test-id');
      expect(logger.context.endpoint).toBe('/api/test');
      expect(logger.context.method).toBe('POST');
      expect(logger.context.ip).toBe('192.168.1.1');
    });

    it('should mask sensitive data in context', () => {
      const req = new Request('http://localhost/api/test?token=sk-secret123', {
        headers: { 
          'user-agent': 'Mozilla/5.0 (token=abc123)',
          'x-forwarded-for': '192.168.1.1'
        }
      });
      
      const logger = createSecureLogger(req);
      
      // User agent should be masked if it contains sensitive data
      expect(logger.context.userAgent).not.toContain('abc123');
    });
  });
});