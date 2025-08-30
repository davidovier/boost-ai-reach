import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must be less than 254 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'URL must use HTTP or HTTPS protocol'
  );

// Website-specific schemas
export const websiteSchema = z.object({
  url: urlSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

// User profile schemas
export const userProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema,
  role: z.enum(['user', 'manager', 'admin']),
  plan: z.enum(['free', 'pro', 'max']),
  timezone: z.string().max(50, 'Timezone must be less than 50 characters'),
  language: z.enum(['en', 'es', 'fr', 'de']),
  email_notifications: z.boolean(),
  usage_notifications: z.boolean(),
  marketing_notifications: z.boolean(),
});

// AI prompt validation
export const promptSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(500, 'Prompt must be less than 500 characters')
    .refine((prompt) => prompt.trim().length >= 10, 'Prompt cannot be only whitespace'),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().max(100, 'Search query must be less than 100 characters'),
  filter: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().min(1).max(1000).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Admin schemas
export const bulkUserUpdateSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user must be selected').max(100, 'Cannot update more than 100 users at once'),
  updates: z.object({
    role: z.enum(['user', 'manager', 'admin']).optional(),
    plan: z.enum(['free', 'pro', 'max']).optional(),
  }).refine((data) => Object.keys(data).length > 0, 'At least one field must be updated'),
});

// Utility functions for validation
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => err.message),
      };
    }
    return {
      success: false,
      errors: ['Validation failed'],
    };
  }
};

// React hook for form validation
export const useValidation = <T>(schema: z.ZodSchema<T>) => {
  const validate = (data: unknown) => validateInput(schema, data);
  
  const validateField = (fieldName: keyof T, value: unknown) => {
    try {
      const fieldSchema = schema.pick({ [fieldName]: true } as any);
      fieldSchema.parse({ [fieldName]: value });
      return { success: true, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors[0]?.message || 'Invalid input',
        };
      }
      return { success: false, error: 'Validation failed' };
    }
  };

  return { validate, validateField };
};

// Sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL');
  }
};

export default {
  emailSchema,
  passwordSchema,
  nameSchema,
  urlSchema,
  websiteSchema,
  userProfileSchema,
  promptSchema,
  searchSchema,
  bulkUserUpdateSchema,
  validateInput,
  useValidation,
  sanitizeInput,
  sanitizeUrl,
};