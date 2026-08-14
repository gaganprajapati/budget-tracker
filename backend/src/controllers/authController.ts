import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.config.js';
import { AuthSignupSchema, AuthLoginSchema } from '../validators/schemas.js';

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parseResult = AuthSignupSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parseResult.error.errors[0].message },
    });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const redirectTo = `${env.FRONTEND_URL}/login`;
    console.log("redirectTo>>>>", redirectTo)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });


    if (error) {
      console.error("Error in signup:", error);
      res.status(400).json({
        success: false,
        error: { code: 'SIGNUP_FAILED', message: error.message },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        session: data.session,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signup error';
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message } });
  }
}



export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parseResult = AuthLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parseResult.error.errors[0].message },
    });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: error.message },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        token: data.session?.access_token,
        session: data.session,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login error';
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message } });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }

  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
}

export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  await supabase.auth.signOut();
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}
