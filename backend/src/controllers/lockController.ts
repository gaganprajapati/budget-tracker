import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { lockRepository } from '../repositories/lockRepository.js';
import { LockPeriodSchema, LockQuarterSchema } from '../validators/schemas.js';

export async function getLocks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const locks = await lockRepository.getUserLocks(req.user!.id);
    res.status(200).json({ success: true, data: locks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch period locks';
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message } });
  }
}

export async function lockMonth(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parseResult = LockPeriodSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parseResult.error.errors[0].message },
    });
    return;
  }

  const { month } = parseResult.data;

  try {
    const lock = await lockRepository.lockMonth(req.user!.id, month);
    res.status(200).json({ success: true, message: `Period ${month} locked successfully`, data: lock });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to lock period';
    res.status(400).json({ success: false, error: { code: 'LOCK_FAILED', message } });
  }
}

export async function unlockMonth(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { month } = req.params;

  if (!month) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Month parameter is required' },
    });
    return;
  }

  try {
    await lockRepository.unlockMonth(req.user!.id, month);
    res.status(200).json({ success: true, message: `Period ${month} unlocked successfully` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to unlock period';
    res.status(400).json({ success: false, error: { code: 'UNLOCK_FAILED', message } });
  }
}

export async function lockQuarter(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parseResult = LockQuarterSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parseResult.error.errors[0].message },
    });
    return;
  }

  const { year, quarter } = parseResult.data;

  try {
    const locks = await lockRepository.lockQuarter(req.user!.id, year, quarter);
    res.status(200).json({
      success: true,
      message: `Quarter Q${quarter} ${year} locked successfully`,
      data: locks,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to lock quarter';
    res.status(400).json({ success: false, error: { code: 'QUARTER_LOCK_FAILED', message } });
  }
}
