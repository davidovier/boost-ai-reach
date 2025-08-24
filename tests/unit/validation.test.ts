import { describe, it, expect } from 'vitest';

// Import validation functions and schemas
const { 
  validateRequestBody, 
  validateQueryParams,
  validatePathParams,
  CreateScanSchema,
  RunPromptSchema,
  UserRoleUpdateSchema,
  AnalyticsQuerySchema,
  AuditLogsQuerySchema,
  OverrideUsageSchema,
  AddCompetitorSchema,
  createValidationErrorResponse
} = await import('../supabase/functions/_shared/validation.ts');

describe('Validation Schemas', () => {
  describe('CreateScanSchema', () => {
    it('should validate scan creation with siteId', () => {
      const validData = { siteId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = validateRequestBody(CreateScanSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.siteId).toBe(validData.siteId);
      }
    });

    it('should validate scan creation with URL', () => {
      const validData = { url: 'https://example.com' };
      const result = validateRequestBody(CreateScanSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe(validData.url);
      }
    });

    it('should reject when neither siteId nor url provided', () => {
      const invalidData = {};
      const result = validateRequestBody(CreateScanSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Either siteId or url must be provided');
      }
    });

    it('should reject invalid UUID for siteId', () => {
      const invalidData = { siteId: 'not-a-uuid' };
      const result = validateRequestBody(CreateScanSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid UUID format');
      }
    });

    it('should reject invalid URL', () => {
      const invalidData = { url: 'not-a-url' };
      const result = validateRequestBody(CreateScanSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid URL format');
      }
    });
  });

  describe('RunPromptSchema', () => {
    it('should validate valid prompt request', () => {
      const validData = { 
        prompt: 'What is the best CRM software?',
        includeCompetitors: true 
      };
      const result = validateRequestBody(RunPromptSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toBe(validData.prompt);
        expect(result.data.includeCompetitors).toBe(true);
      }
    });

    it('should use default value for includeCompetitors', () => {
      const validData = { prompt: 'Test prompt' };
      const result = validateRequestBody(RunPromptSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeCompetitors).toBe(false);
      }
    });

    it('should reject empty prompt', () => {
      const invalidData = { prompt: '' };
      const result = validateRequestBody(RunPromptSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Field cannot be empty');
      }
    });

    it('should reject prompt that is too long', () => {
      const invalidData = { prompt: 'a'.repeat(1001) };
      const result = validateRequestBody(RunPromptSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('1000 characters or less');
      }
    });
  });

  describe('UserRoleUpdateSchema', () => {
    it('should validate valid role update', () => {
      const validData = { role: 'admin' };
      const result = validateRequestBody(UserRoleUpdateSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('admin');
      }
    });

    it('should reject invalid role', () => {
      const invalidData = { role: 'superuser' };
      const result = validateRequestBody(UserRoleUpdateSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be \'user\', \'manager\', or \'admin\'');
      }
    });
  });

  describe('AnalyticsQuerySchema', () => {
    it('should validate valid date range', () => {
      const validData = { from: '2024-01-01', to: '2024-01-31' };
      const result = validateQueryParams(AnalyticsQuerySchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.from).toBe('2024-01-01');
        expect(result.data.to).toBe('2024-01-31');
      }
    });

    it('should reject invalid date format', () => {
      const invalidData = { from: '01/01/2024', to: '2024-01-31' };
      const result = validateQueryParams(AnalyticsQuerySchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('YYYY-MM-DD format');
      }
    });

    it('should reject when from date is after to date', () => {
      const invalidData = { from: '2024-02-01', to: '2024-01-31' };
      const result = validateQueryParams(AnalyticsQuerySchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('From date must be before or equal to to date');
      }
    });
  });

  describe('OverrideUsageSchema', () => {
    it('should validate usage override with userId', () => {
      const validData = { 
        userId: '550e8400-e29b-41d4-a716-446655440000',
        scanCount: 5,
        promptCount: 10
      };
      const result = validateRequestBody(OverrideUsageSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe(validData.userId);
        expect(result.data.scanCount).toBe(5);
        expect(result.data.promptCount).toBe(10);
      }
    });

    it('should validate reset all option', () => {
      const validData = { resetAll: true };
      const result = validateRequestBody(OverrideUsageSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resetAll).toBe(true);
      }
    });

    it('should reject when neither userId nor resetAll provided', () => {
      const invalidData = { scanCount: 5 };
      const result = validateRequestBody(OverrideUsageSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Either userId or resetAll must be provided');
      }
    });

    it('should reject negative usage counts', () => {
      const invalidData = { 
        userId: '550e8400-e29b-41d4-a716-446655440000',
        scanCount: -1 
      };
      const result = validateRequestBody(OverrideUsageSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Number must be greater than or equal to 0');
      }
    });
  });

  describe('AddCompetitorSchema', () => {
    it('should validate valid competitor data', () => {
      const validData = { 
        domain: 'competitor.com',
        notes: 'Main competitor in our space'
      };
      const result = validateRequestBody(AddCompetitorSchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.domain).toBe('competitor.com');
        expect(result.data.notes).toBe('Main competitor in our space');
      }
    });

    it('should reject invalid domain format', () => {
      const invalidData = { domain: 'not-a-domain' };
      const result = validateRequestBody(AddCompetitorSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid domain format');
      }
    });

    it('should reject notes that are too long', () => {
      const invalidData = { 
        domain: 'competitor.com',
        notes: 'a'.repeat(1001)
      };
      const result = validateRequestBody(AddCompetitorSchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('1000 characters or less');
      }
    });
  });

  describe('AuditLogsQuerySchema', () => {
    it('should validate with default values', () => {
      const validData = {};
      const result = validateQueryParams(AuditLogsQuerySchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should validate with all optional parameters', () => {
      const validData = {
        page: '2',
        limit: '25',
        action: 'role_change',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        from: '2024-01-01',
        to: '2024-01-31'
      };
      const result = validateQueryParams(AuditLogsQuerySchema, validData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
        expect(result.data.action).toBe('role_change');
        expect(result.data.userId).toBe(validData.userId);
      }
    });

    it('should reject invalid page number', () => {
      const invalidData = { page: '0' };
      const result = validateQueryParams(AuditLogsQuerySchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Number must be greater than or equal to 1');
      }
    });

    it('should reject limit exceeding maximum', () => {
      const invalidData = { limit: '101' };
      const result = validateQueryParams(AuditLogsQuerySchema, invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Number must be less than or equal to 100');
      }
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('createValidationErrorResponse', () => {
    it('should create proper 400 error response', async () => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      };

      const response = createValidationErrorResponse(
        'Test validation error',
        corsHeaders
      );

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const body = await response.json();
      expect(body.error).toBe('Validation Error');
      expect(body.message).toBe('Test validation error');
    });
  });
});