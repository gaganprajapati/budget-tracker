import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, getAuthenticatedSupabaseClient } from '../config/supabase.js';

export interface UserSession {
  id: string;
  email: string;
}

export interface IAuthService {
  verifyToken(token: string): Promise<UserSession>;
  getAuthenticatedClient(token: string): SupabaseClient;
  invalidateToken(token: string): void;
}

interface CachedSession {
  user: UserSession;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 60 * 1000; // Cache verified token for 60 seconds

export class SupabaseAuthService implements IAuthService {
  public async verifyToken(token: string): Promise<UserSession> {
    const now = Date.now();
    const cached = tokenCache.get(token);

    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    let { data: { user }, error } = await supabase.auth.getUser(token);

    // Handle clock skew / time drift race condition between server and Supabase Auth ("JWT issued at future")
    if (error && error.message.toLowerCase().includes('future')) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const retryResult = await supabase.auth.getUser(token);
      user = retryResult.data.user;
      error = retryResult.error;
    }

    if (error || !user) {
      tokenCache.delete(token);
      throw new Error(error?.message || 'Invalid or expired authentication token.');
    }

    const session: UserSession = {
      id: user.id,
      email: user.email || '',
    };

    tokenCache.set(token, {
      user: session,
      expiresAt: now + CACHE_TTL_MS,
    });

    return session;
  }

  public invalidateToken(token: string): void {
    tokenCache.delete(token);
  }

  public getAuthenticatedClient(token: string): SupabaseClient {
    return getAuthenticatedSupabaseClient(token);
  }
}

export const authService: IAuthService = new SupabaseAuthService();
