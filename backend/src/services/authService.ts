import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, getAuthenticatedSupabaseClient } from '../config/supabase.js';

export interface UserSession {
  id: string;
  email: string;
}

export interface IAuthService {
  verifyToken(token: string): Promise<UserSession>;
  getAuthenticatedClient(token: string): SupabaseClient;
}

export class SupabaseAuthService implements IAuthService {
  public async verifyToken(token: string): Promise<UserSession> {
    let { data: { user }, error } = await supabase.auth.getUser(token);

    // Handle clock skew / time drift race condition between server and Supabase Auth ("JWT issued at future")
    if (error && error.message.toLowerCase().includes('future')) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const retryResult = await supabase.auth.getUser(token);
      user = retryResult.data.user;
      error = retryResult.error;
    }

    if (error || !user) {
      throw new Error(error?.message || 'Invalid or expired authentication token.');
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  }


  public getAuthenticatedClient(token: string): SupabaseClient {
    return getAuthenticatedSupabaseClient(token);
  }
}

export const authService: IAuthService = new SupabaseAuthService();
