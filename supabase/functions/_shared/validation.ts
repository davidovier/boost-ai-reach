import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// String sanitization utilities
const sanitizeString = (str: string) => str.trim().replace(/[<>]/g, '');
const SanitizedStringSchema = z.string().transform(sanitizeString);

// Common base schemas
export const UUIDSchema = z.string().uuid("Invalid UUID format");
export const EmailSchema = z.string().email("Invalid email format");
export const URLSchema = z.string().url("Invalid URL format");
export const NonEmptyStringSchema = SanitizedStringSchema.min(1, "Field cannot be empty");
export const SafeStringSchema = SanitizedStringSchema.max(10000, "String too long");

// Numeric validation schemas
export const PositiveIntegerSchema = z.coerce.number().int().min(0);
export const LimitSchema = z.coerce.number().int().min(1).max(100).default(20);
export const PageSchema = z.coerce.number().int().min(1).default(1);

// Date schemas
export const DateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Date must be in YYYY-MM-DD format"
);

export const ISODateSchema = z.string().datetime("Invalid ISO date format");

// Enum schemas
export const RoleSchema = z.enum(['user', 'manager', 'admin'], {
  errorMap: () => ({ message: "Role must be 'user', 'manager', or 'admin'" })
});

export const PlanSchema = z.enum(['free', 'pro', 'growth', 'enterprise'], {
  errorMap: () => ({ message: "Plan must be 'free', 'pro', 'growth', or 'enterprise'" })
});

export const TipSeveritySchema = z.enum(['low', 'medium', 'high'], {
  errorMap: () => ({ message: "Severity must be 'low', 'medium', or 'high'" })
});

export const ReportStatusSchema = z.enum(['queued', 'running', 'success', 'failed'], {
  errorMap: () => ({ message: "Status must be 'queued', 'running', 'success', or 'failed'" })
});

export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']);

// Site management schemas
export const CreateSiteSchema = z.object({
  url: URLSchema,
  name: NonEmptyStringSchema.max(255).optional()
});

export const SiteIdSchema = z.object({
  siteId: UUIDSchema
});

// Scan schemas
export const CreateScanSchema = z.object({
  siteId: UUIDSchema.optional(),
  url: URLSchema.optional()
}).refine(
  data => data.siteId || data.url,
  "Either siteId or url must be provided"
);

export const ScanQuerySchema = z.object({
  from: DateStringSchema.optional(),
  to: DateStringSchema.optional(),
  limit: LimitSchema,
  page: PageSchema
});

// Prompt schemas
export const RunPromptSchema = z.object({
  prompt: NonEmptyStringSchema.max(1000, "Prompt must be 1000 characters or less"),
  includeCompetitors: z.boolean().optional().default(false)
});

export const PromptHistoryQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
  from: DateStringSchema.optional(),
  to: DateStringSchema.optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional().default(100)
});

// Competitor schemas
export const AddCompetitorSchema = z.object({
  domain: z.string()
    .min(1, "Domain cannot be empty")
    .max(255, "Domain must be 255 characters or less")
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  notes: SafeStringSchema.max(1000, "Notes must be 1000 characters or less").optional()
});

export const CompetitorIdSchema = z.object({
  competitorId: UUIDSchema
});

export const CompetitorCompareQuerySchema = z.object({
  domains: z.array(z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)).min(1).max(5),
  includeMetrics: z.boolean().optional().default(true)
});

// Report schemas
export const GenerateReportSchema = z.object({
  siteId: UUIDSchema,
  periodStart: DateStringSchema.optional(),
  periodEnd: DateStringSchema.optional(),
  format: z.enum(['pdf', 'json']).optional().default('pdf')
});

export const ReportIdSchema = z.object({
  reportId: UUIDSchema
});

export const ReportQuerySchema = z.object({
  status: ReportStatusSchema.optional(),
  from: DateStringSchema.optional(),
  to: DateStringSchema.optional(),
  limit: LimitSchema,
  page: PageSchema
});

// Admin schemas
export const AdminAnalyticsQuerySchema = z.object({
  from: DateStringSchema,
  to: DateStringSchema,
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily')
}).refine(
  data => new Date(data.from) <= new Date(data.to),
  "From date must be before or equal to to date"
);

export const UserRoleUpdateSchema = z.object({
  role: RoleSchema
});

export const UserIdParamSchema = z.object({
  userId: UUIDSchema
});

export const OverrideUsageSchema = z.object({
  userId: UUIDSchema.optional(),
  resetAll: z.boolean().optional().default(false),
  scanCount: PositiveIntegerSchema.optional(),
  promptCount: PositiveIntegerSchema.optional(),
  competitorCount: PositiveIntegerSchema.optional(),
  reportCount: PositiveIntegerSchema.optional()
}).refine(
  data => data.userId || data.resetAll,
  "Either userId or resetAll must be provided"
);

export const AdminUsersQuerySchema = z.object({
  role: RoleSchema.optional(),
  plan: PlanSchema.optional(),
  search: SafeStringSchema.optional(),
  limit: LimitSchema,
  page: PageSchema
});

export const AuditLogsQuerySchema = z.object({
  page: PageSchema,
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  action: SafeStringSchema.optional(),
  userId: UUIDSchema.optional(),
  from: DateStringSchema.optional(),
  to: DateStringSchema.optional()
});

export const FeatureConfigUpdateSchema = z.object({
  role: RoleSchema.optional(),
  plan: PlanSchema.optional(),
  config: z.record(z.any()),
  featureFlags: z.record(z.boolean()).optional()
}).refine(
  data => data.role || data.plan,
  "Either role or plan must be specified"
);

// Billing schemas  
export const CreateCheckoutSchema = z.object({
  priceId: NonEmptyStringSchema.max(100, "Price ID too long"),
  successUrl: URLSchema,
  cancelUrl: URLSchema,
  quantity: PositiveIntegerSchema.optional().default(1)
});

export const StripeWebhookSchema = z.object({
  type: NonEmptyStringSchema,
  data: z.record(z.any()),
  id: NonEmptyStringSchema
});

// Profile update schemas
export const UpdateProfileSchema = z.object({
  name: SafeStringSchema.max(255, "Name must be 255 characters or less").optional(),
  email: EmailSchema.optional()
});

// Pagination schemas
export const PaginationQuerySchema = z.object({
  page: PageSchema,
  limit: LimitSchema
});

// Database backup schemas
export const BackupQuerySchema = z.object({
  table: SafeStringSchema.optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
  compress: z.boolean().optional().default(false)
});

// Health check schema
export const HealthQuerySchema = z.object({
  deep: z.boolean().optional().default(false)
});

// Generic JSON schema for flexible payloads
export const JsonSchema = z.record(z.any());

// File upload schemas
export const FileUploadSchema = z.object({
  filename: NonEmptyStringSchema.max(255),
  contentType: NonEmptyStringSchema.max(100),
  size: PositiveIntegerSchema.max(10 * 1024 * 1024) // 10MB max
});

// Validation helper functions
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details: z.ZodError;
} {
  try {
    const result = schema.safeParse(body);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessages = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return {
        success: false,
        error: `Validation failed: ${errorMessages}`,
        details: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON or malformed request body',
      details: error as z.ZodError
    };
  }
}

export function validateQueryParams<T>(schema: z.ZodSchema<T>, params: Record<string, string>): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details: z.ZodError;
} {
  try {
    const result = schema.safeParse(params);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessages = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return {
        success: false,
        error: `Query validation failed: ${errorMessages}`,
        details: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Invalid query parameters',
      details: error as z.ZodError
    };
  }
}

export function validatePathParams<T>(schema: z.ZodSchema<T>, params: Record<string, string>): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details: z.ZodError;
} {
  try {
    const result = schema.safeParse(params);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessages = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return {
        success: false,
        error: `Path parameter validation failed: ${errorMessages}`,
        details: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Invalid path parameters',
      details: error as z.ZodError
    };
  }
}

// Security helper for request validation
export function validateRequest(req: Request): {
  success: true;
  method: string;
  url: URL;
} | {
  success: false;
  error: string;
} {
  try {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();
    
    // Basic security checks
    if (url.pathname.includes('..') || url.pathname.includes('//')) {
      return { success: false, error: 'Invalid path traversal detected' };
    }
    
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(method)) {
      return { success: false, error: 'Unsupported HTTP method' };
    }
    
    return { success: true, method, url };
  } catch (error) {
    return { success: false, error: 'Malformed request URL' };
  }
}

// Error response helper
export function createValidationErrorResponse(
  error: string, 
  corsHeaders: Record<string, string>,
  details?: z.ZodError
): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation Error',
      message: error,
      timestamp: new Date().toISOString(),
      ...(details && { validation_errors: details.errors })
    }),
    {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Generic success response helper
export function createSuccessResponse(
  data: any,
  corsHeaders: Record<string, string>,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Generic error response helper
export function createErrorResponse(
  error: string,
  corsHeaders: Record<string, string>,
  status: number = 500
): Response {
  return new Response(
    JSON.stringify({
      error: 'Server Error',
      message: error,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}