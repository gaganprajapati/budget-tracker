import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { actualRepository } from '../repositories/actualRepository.js';
import { csvImportService } from '../services/csvImportService.js';
import { CreateActualSchema } from '../validators/schemas.js';

export async function getActuals(req: AuthenticatedRequest, res: Response): Promise<void> {
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  try {
    const actuals = await actualRepository.getActualsByUser(req.user!.id, startDate, endDate);
    res.status(200).json({ success: true, data: actuals });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch actual spend entries';
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message } });
  }
}

export async function createActual(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parseResult = CreateActualSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parseResult.error.errors[0].message },
    });
    return;
  }

  const { category_id, month, amount, note } = parseResult.data;

  try {
    const actual = await actualRepository.createActual(req.user!.id, category_id, month, amount, note || undefined);
    res.status(201).json({ success: true, data: actual });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to log actual spend entry';
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message } });
  }
}

export async function updateActual(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { amount, note } = req.body;

  if (typeof amount !== 'number' || amount < 0) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Amount must be a non-negative number' },
    });
    return;
  }

  try {
    const updated = await actualRepository.updateActual(req.user!.id, id, amount, note);
    res.status(200).json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update actual spend entry';
    res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message } });
  }
}

export async function deleteActual(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    await actualRepository.deleteActual(req.user!.id, id);
    res.status(200).json({ success: true, message: 'Actual spend entry deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete actual spend entry';
    res.status(400).json({ success: false, error: { code: 'DELETE_FAILED', message } });
  }
}

export async function previewCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { csvContent } = req.body;

  if (!csvContent || typeof csvContent !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'csvContent string parameter is required' },
    });
    return;
  }

  try {
    const parseSummary = csvImportService.parseAndValidateCsv(csvContent);
    res.status(200).json({ success: true, data: parseSummary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse CSV payload';
    res.status(400).json({ success: false, error: { code: 'CSV_PARSE_FAILED', message } });
  }
}

export async function importCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { csvContent } = req.body;

  if (!csvContent || typeof csvContent !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'csvContent string parameter is required' },
    });
    return;
  }

  try {
    const parseSummary = csvImportService.parseAndValidateCsv(csvContent);

    if (parseSummary.validRows.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_VALID_ROWS', message: 'CSV contains no valid rows to import.' },
        details: parseSummary.invalidRows,
      });
      return;
    }

    const inserted = await csvImportService.commitCsvImport(req.user!.id, parseSummary.validRows);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} actual spend entries.`,
      data: {
        importedCount: inserted.length,
        skippedCount: parseSummary.invalidRows.length,
        invalidRows: parseSummary.invalidRows,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'CSV import execution failed';
    res.status(400).json({ success: false, error: { code: 'IMPORT_FAILED', message } });
  }
}
