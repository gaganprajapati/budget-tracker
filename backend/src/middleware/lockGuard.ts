import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';
import { lockRepository } from '../repositories/lockRepository.js';

export function lockGuard(monthParamExtractor?: (req: AuthenticatedRequest) => string | undefined) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    let targetMonth: string | undefined;

    if (monthParamExtractor) {
      targetMonth = monthParamExtractor(req);
    } else {
      targetMonth = (req.body?.month as string | undefined) || 
                    (req.params?.month as string | undefined) || 
                    (req.query?.month as string | undefined);
    }

    if (!targetMonth) {
      next();
      return;
    }

    try {
      const isLocked = await lockRepository.isMonthLocked(req.user.id, targetMonth);

      if (isLocked) {
        res.status(423).json({
          success: false,
          error: {
            code: 'PERIOD_LOCKED',
            message: `Period ${targetMonth} is locked and read-only. Edit operations are rejected by server policy.`,
          },
        });
        return;
      }

      next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lock status verification failed';
      res.status(500).json({
        success: false,
        error: { code: 'LOCK_CHECK_ERROR', message },
      });
    }
  };
}
