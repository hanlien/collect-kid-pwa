import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we have the required environment variables
const hasValidConfig = supabaseUrl && supabaseAnonKey && supabaseServiceKey;

// Client-side Supabase client (for browser)
export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Supabase client (for API routes)
export const supabaseAdmin = hasValidConfig
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => hasValidConfig;
