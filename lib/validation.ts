import { z } from 'zod';

// Environment validation
export const envSchema = z.object({
  PLANT_ID_API_KEY: z.string().min(1),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().min(1),
  GOOGLE_KNOWLEDGE_GRAPH_API_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GCV_MAX_DAY: z.string().transform(Number).pipe(z.number().positive()),
  PLANT_MAX_DAY: z.string().transform(Number).pipe(z.number().positive()),
  MAX_IMAGE_MB: z.string().transform(Number).pipe(z.number().positive()),
});

// API request validation
export const recognizeRequestSchema = z.object({
  hint: z.enum(['auto', 'flower', 'bug', 'animal']).default('auto'),
});

export const collectRequestSchema = z.object({
  userId: z.string().min(1), // Changed from UUID to any non-empty string for profile IDs
  result: z.object({
    category: z.enum(['flower', 'bug', 'animal', 'mysterious']),
    canonicalName: z.string(),
    commonName: z.string().optional(),
    rank: z.enum(['species', 'genus', 'family']).optional(),
    confidence: z.number().min(0).max(1),
    provider: z.enum(['plantid', 'gcv', 'inaturalist']),
    gbifKey: z.number().optional(),
    capturedImageUrl: z.string().optional(),
    wiki: z.object({
      summary: z.string().optional(),
      imageUrl: z.string().url().optional(),
    }).optional(),
    ui: z.object({
      colorChips: z.array(z.string()).optional(),
      funFacts: z.array(z.string()).optional(),
    }).optional(),
  }),
});

export const factsRequestSchema = z.object({
  canonicalName: z.string(),
  gbifKey: z.string().transform(Number).pipe(z.number()).optional(),
});

// Validate environment variables
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    // During build time, return a mock object
    if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_URL) {
      return {
        PLANT_ID_API_KEY: 'placeholder',
        GOOGLE_APPLICATION_CREDENTIALS_JSON: '{"type":"service_account"}',
        GOOGLE_KNOWLEDGE_GRAPH_API_KEY: 'placeholder',
        SUPABASE_URL: 'https://placeholder.supabase.co',
        SUPABASE_ANON_KEY: 'placeholder',
        SUPABASE_SERVICE_ROLE_KEY: 'placeholder',
        GCV_MAX_DAY: 300,
        PLANT_MAX_DAY: 200,
        MAX_IMAGE_MB: 2,
      };
    }
    throw new Error('Invalid environment configuration');
  }
}
