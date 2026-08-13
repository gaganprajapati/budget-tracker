import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { authService } from '../services/authService.js';
import { requestContextStorage, RequestContext } from '../context/requestContext.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  token?: string;
  supabase?: SupabaseClient;
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
    const userSession = await authService.verifyToken(token);
    const authenticatedClient = authService.getAuthenticatedClient(token);

    req.user = userSession;
    req.token = token;
    req.supabase = authenticatedClient;

    const context: RequestContext = {
      userId: userSession.id,
      userEmail: userSession.email,
      token,
      supabase: authenticatedClient,
    };

    // Run the remaining async middleware/controller stack within AsyncLocalStorage context
    requestContextStorage.run(context, () => {
      next();
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication verification failed';
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    });
  }
}


