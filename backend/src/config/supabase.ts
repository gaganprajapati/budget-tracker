import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.config.js';

console.log('Supabase URL:', env.SUPABASE_URL);
console.log('Supabase Publishable Key:', env.SUPABASE_PUBLISHABLE_KEY);

// Client for user-authenticated queries using modern Publishable Key
export const supabase: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);

// Admin client for backend operations (e.g. JWT token validation) using modern Secret Key
export const supabaseAdmin: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
