import { getDbClient } from '../context/requestContext.js';
import { Category } from '../types/index.js';

export interface ICategoryRepository {
  getCategoriesByUser(userId: string): Promise<Category[]>;
  createCategory(userId: string, name: string, color?: string): Promise<Category>;
  updateCategory(userId: string, id: string, name: string, color?: string): Promise<Category>;
  deleteCategory(userId: string, id: string): Promise<void>;
  findByName(userId: string, name: string): Promise<Category | null>;
}

export class CategoryRepository implements ICategoryRepository {
  public async getCategoriesByUser(userId: string): Promise<Category[]> {
    const db = getDbClient();
    const { data, error } = await db
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (data || []) as Category[];
  }

  public async createCategory(userId: string, name: string, color: string = '#4F46E5'): Promise<Category> {
    const db = getDbClient();
    const { data, error } = await db
      .from('categories')
      .insert({ user_id: userId, name: name.trim(), color })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category '${name}': ${error.message}`);
    }

    return data as Category;
  }

  public async updateCategory(userId: string, id: string, name: string, color?: string): Promise<Category> {
    const db = getDbClient();
    const updateData: { name: string; color?: string; updated_at: string } = {
      name: name.trim(),
      updated_at: new Date().toISOString(),
    };
    if (color) {
      updateData.color = color;
    }

    const { data, error } = await db
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data as Category;
  }

  public async deleteCategory(userId: string, id: string): Promise<void> {
    const db = getDbClient();
    const { error } = await db
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  public async findByName(userId: string, name: string): Promise<Category | null> {
    const db = getDbClient();
    const { data, error } = await db
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', name.trim())
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find category by name: ${error.message}`);
    }

    return data as Category | null;
  }
}

export const categoryRepository = new CategoryRepository();
