import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Create a Supabase client with the public anon key
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create a Supabase admin client with the service role key for server-side operations
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Storage bucket constants
export const STORAGE_BUCKET = 'resumes';