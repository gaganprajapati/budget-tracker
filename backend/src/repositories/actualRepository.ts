import { supabase } from '../config/supabase.js';
import { Actual } from '../types/index.js';

export interface IActualRepository {
  getActualsByUser(userId: string, startDate?: string, endDate?: string): Promise<Actual[]>;
  createActual(userId: string, categoryId: string, month: string, amount: number, note?: string): Promise<Actual>;
  updateActual(userId: string, id: string, amount: number, note?: string): Promise<Actual>;
  deleteActual(userId: string, id: string): Promise<void>;
  bulkInsertActuals(actuals: Array<{ user_id: string; category_id: string; month: string; amount: number; note?: string }>): Promise<Actual[]>;
}

export class ActualRepository implements IActualRepository {
  public async getActualsByUser(userId: string, startDate?: string, endDate?: string): Promise<Actual[]> {
    let query = supabase.from('actuals').select('*').eq('user_id', userId);

    if (startDate) {
      query = query.gte('month', startDate);
    }
    if (endDate) {
      query = query.lte('month', endDate);
    }

    const { data, error } = await query.order('month', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch actual spend entries: ${error.message}`);
    }

    return (data || []) as Actual[];
  }

  public async createActual(userId: string, categoryId: string, month: string, amount: number, note?: string): Promise<Actual> {
    const { data, error } = await supabase
      .from('actuals')
      .insert({
        user_id: userId,
        category_id: categoryId,
        month,
        amount,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log actual spend entry: ${error.message}`);
    }

    return data as Actual;
  }

  public async updateActual(userId: string, id: string, amount: number, note?: string): Promise<Actual> {
    const { data, error } = await supabase
      .from('actuals')
      .update({
        amount,
        note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update actual spend entry: ${error.message}`);
    }

    return data as Actual;
  }

  public async deleteActual(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('actuals').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete actual spend entry: ${error.message}`);
    }
  }

  public async bulkInsertActuals(
    actuals: Array<{ user_id: string; category_id: string; month: string; amount: number; note?: string }>
  ): Promise<Actual[]> {
    const { data, error } = await supabase.from('actuals').insert(actuals).select();

    if (error) {
      throw new Error(`Failed to batch import actual spend entries: ${error.message}`);
    }

    return (data || []) as Actual[];
  }
}

export const actualRepository = new ActualRepository();
