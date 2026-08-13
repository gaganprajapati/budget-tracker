import { describe, it, expect } from 'vitest';
import { env } from '../src/config/env.config.js';

describe('Environment Fail-Fast Configuration', () => {
  it('should load environment configuration object with publishable and secret keys', () => {
    expect(env).toBeDefined();
    expect(typeof env.PORT).toBe('number');
    expect(env.SUPABASE_URL).toBeDefined();
    expect(env.SUPABASE_PUBLISHABLE_KEY).toBeDefined();
    expect(env.SUPABASE_SECRET_KEY).toBeDefined();
  });
});
