import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header. Token required.',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token.',
        },
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email || '',
    };

    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication verification failed';
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message,
      },
    });
  }
}
