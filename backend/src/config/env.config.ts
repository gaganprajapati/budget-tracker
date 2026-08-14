import 'dotenv/config';


export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY: string;
  FRONTEND_URL: string;
}

function loadAndValidateEnvironment(): EnvironmentConfig {
  const isTest = process.env.NODE_ENV === 'test';

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  const missingKeys: string[] = [];

  if (!supabaseUrl) missingKeys.push('SUPABASE_URL');
  if (!supabasePublishableKey) missingKeys.push('SUPABASE_PUBLISHABLE_KEY');
  if (!supabaseSecretKey) missingKeys.push('SUPABASE_SECRET_KEY');

  // Fail-Fast Strategy: Immediately throw error on startup if required keys are missing in non-test mode
  if (missingKeys.length > 0 && !isTest) {
    throw new Error(
      `❌ [FATAL CONFIG ERROR] Fail-Fast: Missing required environment variables:\n` +
      `   ${missingKeys.join(', ')}\n\n` +
      `   Please ensure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY are set in .env.`
    );
  }

  return {
    PORT: parseInt(process.env.PORT || '5001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    SUPABASE_URL: supabaseUrl || 'https://placeholder.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey || 'placeholder-publishable-key',
    SUPABASE_SECRET_KEY: supabaseSecretKey || 'placeholder-secret-key',
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://budget-tracker-ui-theta.vercel.app',
  };
}


export const env: EnvironmentConfig = loadAndValidateEnvironment();
