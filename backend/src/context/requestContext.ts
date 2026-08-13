import { AsyncLocalStorage } from 'node:async_hooks';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.js';

export interface RequestContext {
  userId: string;
  userEmail: string;
  token: string;
  supabase: SupabaseClient;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Retrieves the current request context for the active async call stack.
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Returns the per-request authenticated Supabase client from AsyncLocalStorage if available,
 * falling back to the default supabase client if executed outside of an HTTP request context (e.g. CLI tests).
 */
export function getDbClient(): SupabaseClient {
  const ctx = requestContextStorage.getStore();
  return ctx?.supabase || supabase;
}
