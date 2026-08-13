import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { planRepository } from '../repositories/planRepository.js';
import { UpsertPlanSchema } from '../validators/schemas.js';

export async function getPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  try {
    const plans = await planRepository.getPlansByUser(req.user!.id, startDate, endDate);
    res.status(200).json({ success: true, data: plans });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch target plans';
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message } });
  }
}

export async function upsertPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parseResult = UpsertPlanSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parseResult.error.errors[0].message },
    });
    return;
  }

  const { category_id, month, target_amount } = parseResult.data;

  try {
    const plan = await planRepository.upsertPlan(req.user!.id, category_id, month, target_amount);
    res.status(200).json({ success: true, data: plan });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save spending target plan';
    res.status(400).json({ success: false, error: { code: 'UPSERT_FAILED', message } });
  }
}

export async function deletePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    await planRepository.deletePlan(req.user!.id, id);
    res.status(200).json({ success: true, message: 'Spending plan target deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete spending plan target';
    res.status(400).json({ success: false, error: { code: 'DELETE_FAILED', message } });
  }
}
