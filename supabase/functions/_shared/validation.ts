import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Common base schemas
export const UUIDSchema = z.string().uuid("Invalid UUID format");
export const EmailSchema = z.string().email("Invalid email format");
export const URLSchema = z.string().url("Invalid URL format");
export const NonEmptyStringSchema = z.string().min(1, "Field cannot be empty");

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

// Site management schemas
export const CreateSiteSchema = z.object({
  url: URLSchema,
  name: z.string().optional()
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

// Prompt schemas
export const RunPromptSchema = z.object({
  prompt: NonEmptyStringSchema.max(1000, "Prompt must be 1000 characters or less"),
  includeCompetitors: z.boolean().optional().default(false)
});

// Competitor schemas
export const AddCompetitorSchema = z.object({
  domain: z.string()
    .min(1, "Domain cannot be empty")
    .max(255, "Domain must be 255 characters or less")
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").optional()
});

export const CompetitorIdSchema = z.object({
  competitorId: UUIDSchema
});

// Report schemas
export const GenerateReportSchema = z.object({
  siteId: UUIDSchema,
  periodStart: DateStringSchema.optional(),
  periodEnd: DateStringSchema.optional()
});

export const ReportIdSchema = z.object({
  reportId: UUIDSchema
});

// Admin schemas
export const UserRoleUpdateSchema = z.object({
  role: RoleSchema
});

export const UserIdParamSchema = z.object({
  userId: UUIDSchema
});

export const OverrideUsageSchema = z.object({
  userId: UUIDSchema.optional(),
  resetAll: z.boolean().optional().default(false),
  scanCount: z.number().min(0).optional(),
  promptCount: z.number().min(0).optional(),
  competitorCount: z.number().min(0).optional(),
  reportCount: z.number().min(0).optional()
}).refine(
  data => data.userId || data.resetAll,
  "Either userId or resetAll must be provided"
);

export const AnalyticsQuerySchema = z.object({
  from: DateStringSchema,
  to: DateStringSchema
}).refine(
  data => new Date(data.from) <= new Date(data.to),
  "From date must be before or equal to to date"
);

export const AuditLogsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  action: z.string().optional(),
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
  priceId: NonEmptyStringSchema,
  successUrl: URLSchema,
  cancelUrl: URLSchema
});

// Profile update schemas
export const UpdateProfileSchema = z.object({
  name: z.string().max(255, "Name must be 255 characters or less").optional(),
  email: EmailSchema.optional()
});

// Pagination schemas
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20)
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