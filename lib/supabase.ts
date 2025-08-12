import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a Supabase client with the public anon key
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create a Supabase admin client with the service role key for server-side operations only
// This will be null on the client side
export const supabaseAdmin = typeof window === 'undefined' 
  ? (() => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
        return null;
      }
      return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    })()
  : null;

// Storage bucket constants
export const STORAGE_BUCKET = 'resumes';