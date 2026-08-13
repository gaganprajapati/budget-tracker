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
    const { data: { user }, error } = await supabase.auth.getUser(token);

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
