import { Plan, Actual, Category, ReportRow, ReportSummary } from '../types/index.js';

export interface VarianceCalculationInput {
  categories: Category[];
  plans: Plan[];
  actuals: Actual[];
  lockedMonths: Set<string>;
}

export interface IVarianceService {
  calculateReportSummary(input: VarianceCalculationInput): ReportSummary;
}

export class VarianceService implements IVarianceService {
  /**
   * Calculates the percentage variance: ((Actual - Plan) / Plan) * 100.
   * Returns null if target plan is 0 to avoid division by zero (NaN/Infinity).
   */
  private calculateVariancePercentage(actual: number, plan: number): number | null {
    if (plan <= 0) {
      return null;
    }
    return Number((((actual - plan) / plan) * 100).toFixed(2));
  }

  public calculateReportSummary(input: VarianceCalculationInput): ReportSummary {
    const { categories, plans, actuals, lockedMonths } = input;

    // 1. Build lookup map for Categories
    const categoryMap = new Map<string, Category>();
    for (const category of categories) {
      categoryMap.set(category.id, category);
    }

    // 2. Build lookup map for Plans: key = `${category_id}:${month}`
    const planMap = new Map<string, Plan>();
    for (const plan of plans) {
      planMap.set(`${plan.category_id}:${plan.month}`, plan);
    }

    // 3. Aggregate Actual spend totals per category/month
    const actualTotalsMap = new Map<string, number>();
    const actualEntryLoggedSet = new Set<string>();

    for (const actual of actuals) {
      const key = `${actual.category_id}:${actual.month}`;
      actualEntryLoggedSet.add(key);
      const current = actualTotalsMap.get(key) || 0;
      actualTotalsMap.set(key, current + actual.amount);
    }

    // 4. Collect all unique (category_id, month) keys across both Plans AND Actuals
    const allKeys = new Set<string>([
      ...Array.from(planMap.keys()),
      ...Array.from(actualTotalsMap.keys()),
    ]);

    const rows: ReportRow[] = [];

    for (const key of allKeys) {
      const [categoryId, month] = key.split(':');
      const category = categoryMap.get(categoryId);
      const categoryName = category ? category.name : 'Unknown Category';
      const categoryColor = category ? category.color : '#6B7280';

      const planObj = planMap.get(key);
      const planAmount = planObj ? Number(planObj.target_amount) : 0;
      const actualAmount = actualTotalsMap.get(key) || 0;
      const hasLoggedActual = actualEntryLoggedSet.has(key);

      const variance = actualAmount - planAmount;
      const variancePercentage = this.calculateVariancePercentage(actualAmount, planAmount);

      rows.push({
        category_id: categoryId,
        category_name: categoryName,
        category_color: categoryColor,
        month,
        plan_amount: planAmount,
        actual_amount: actualAmount,
        variance: Number(variance.toFixed(2)),
        variance_percentage: variancePercentage,
        is_missing_actual: !hasLoggedActual,
        is_locked: lockedMonths.has(month),
      });
    }

    // 5. Sort rows chronologically by month, then alphabetically by category name
    rows.sort((a, b) => {
      if (a.month !== b.month) {
        return a.month.localeCompare(b.month);
      }
      return a.category_name.localeCompare(b.category_name);
    });

    // 6. Aggregate grand totals
    let totalPlan = 0;
    let totalActual = 0;

    for (const row of rows) {
      totalPlan += row.plan_amount;
      totalActual += row.actual_amount;
    }

    const totalVariance = totalActual - totalPlan;
    const totalVariancePercentage = this.calculateVariancePercentage(totalActual, totalPlan);

    return {
      rows,
      totals: {
        total_plan: Number(totalPlan.toFixed(2)),
        total_actual: Number(totalActual.toFixed(2)),
        total_variance: Number(totalVariance.toFixed(2)),
        total_variance_percentage: totalVariancePercentage,
      },
    };
  }
}

export const varianceService: IVarianceService = new VarianceService();
