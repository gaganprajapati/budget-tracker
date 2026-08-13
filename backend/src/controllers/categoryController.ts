import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { CreateCategorySchema } from '../validators/schemas.js';

export async function getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const categories = await categoryRepository.getCategoriesByUser(req.user!.id);
    res.status(200).json({ success: true, data: categories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch categories';
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message } });
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parseResult = CreateCategorySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parseResult.error.errors[0].message },
    });
    return;
  }

  const { name, color } = parseResult.data;

  try {
    const category = await categoryRepository.createCategory(req.user!.id, name, color);
    res.status(201).json({ success: true, data: category });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create category';
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message } });
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = CreateCategorySchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: parseResult.error.errors[0].message },
    });
    return;
  }

  const { name, color } = parseResult.data;

  try {
    const updated = await categoryRepository.updateCategory(req.user!.id, id, name, color);
    res.status(200).json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message } });
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    await categoryRepository.deleteCategory(req.user!.id, id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category';
    res.status(400).json({ success: false, error: { code: 'DELETE_FAILED', message } });
  }
}
