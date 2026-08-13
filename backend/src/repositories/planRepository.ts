import { supabase } from '../config/supabase.js';
import { Plan } from '../types/index.js';

export interface IPlanRepository {
  getPlansByUser(userId: string, startDate?: string, endDate?: string): Promise<Plan[]>;
  upsertPlan(userId: string, categoryId: string, month: string, targetAmount: number): Promise<Plan>;
  deletePlan(userId: string, id: string): Promise<void>;
}

export class PlanRepository implements IPlanRepository {
  public async getPlansByUser(userId: string, startDate?: string, endDate?: string): Promise<Plan[]> {
    let query = supabase.from('plans').select('*').eq('user_id', userId);

    if (startDate) {
      query = query.gte('month', startDate);
    }
    if (endDate) {
      query = query.lte('month', endDate);
    }

    const { data, error } = await query.order('month', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch spending target plans: ${error.message}`);
    }

    return (data || []) as Plan[];
  }

  public async upsertPlan(userId: string, categoryId: string, month: string, targetAmount: number): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .upsert(
        {
          user_id: userId,
          category_id: categoryId,
          month,
          target_amount: targetAmount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category_id,month' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert spending plan for ${month}: ${error.message}`);
    }

    return data as Plan;
  }

  public async deletePlan(userId: string, id: string): Promise<void> {
    const { error } = await supabase.from('plans').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete spending plan: ${error.message}`);
    }
  }
}

export const planRepository = new PlanRepository();
