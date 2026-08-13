import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { planRepository } from '../repositories/planRepository.js';
import { actualRepository } from '../repositories/actualRepository.js';
import { lockRepository } from '../repositories/lockRepository.js';
import { varianceService } from '../services/varianceService.js';

export async function getReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  let startDate = req.query.startDate as string | undefined;
  let endDate = req.query.endDate as string | undefined;
  const fiscalYearRaw = req.query.fiscalYear as string | undefined;

  // Handle Fiscal Year selection if provided (e.g. FY 2026 -> 2026-01 to 2026-12)
  if (fiscalYearRaw) {
    const fyInt = parseInt(fiscalYearRaw, 10);
    if (!isNaN(fyInt)) {
      startDate = `${fyInt}-01`;
      endDate = `${fyInt}-12`;
    }
  }

  try {
    const [categories, plans, actuals, locks] = await Promise.all([
      categoryRepository.getCategoriesByUser(userId),
      planRepository.getPlansByUser(userId, startDate, endDate),
      actualRepository.getActualsByUser(userId, startDate, endDate),
      lockRepository.getUserLocks(userId),
    ]);

    const lockedMonthsSet = new Set<string>(locks.map((l) => l.month));

    const summary = varianceService.calculateReportSummary({
      categories,
      plans,
      actuals,
      lockedMonths: lockedMonthsSet,
    });

    res.status(200).json({
      success: true,
      data: {
        filter: {
          startDate: startDate || null,
          endDate: endDate || null,
          fiscalYear: fiscalYearRaw || null,
        },
        report: summary,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate financial report';
    res.status(500).json({ success: false, error: { code: 'REPORT_FAILED', message } });
  }
}
