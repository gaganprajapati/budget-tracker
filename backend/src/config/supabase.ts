import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.config.js';


// Client for user-authenticated queries using modern Publishable Key
export const supabase: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);

// Admin client for backend operations (e.g. JWT token validation) using modern Secret Key
export const supabaseAdmin: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);

/**
 * Creates a Per-Request Authenticated Supabase Client populated with the user's JWT Bearer token.
 * This ensures PostgreSQL Row Level Security (RLS) policies (auth.uid() = user_id) are enforced natively.
 */
export function getAuthenticatedSupabaseClient(token: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

