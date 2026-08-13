import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.config.js';


// Client for user-authenticated queries using modern Publishable Key
export const supabase: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);

// Admin client for backend operations (e.g. JWT token validation) using modern Secret Key
export const supabaseAdmin: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
