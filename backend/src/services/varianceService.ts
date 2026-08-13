import { Plan, Actual, Category, ReportRow, ReportSummary } from '../types/index.js';

export interface VarianceCalculationInput {
  categories: Category[];
  plans: Plan[];
  actuals: Actual[];
  lockedMonths: Set<string>;
}

export class VarianceService {
  public calculateReportSummary(input: VarianceCalculationInput): ReportSummary {
    const { categories, plans, actuals, lockedMonths } = input;

    const actualTotalsMap = new Map<string, number>();
    for (const actual of actuals) {
      const key = `${actual.category_id}:${actual.month}`;
      const current = actualTotalsMap.get(key) || 0;
      actualTotalsMap.set(key, current + actual.amount);
    }

    const categoryMap = new Map<string, Category>();
    for (const category of categories) {
      categoryMap.set(category.id, category);
    }

    const rows: ReportRow[] = [];

    for (const plan of plans) {
      const category = categoryMap.get(plan.category_id);
      const categoryName = category ? category.name : 'Unknown Category';
      const categoryColor = category ? category.color : '#6B7280';
      const key = `${plan.category_id}:${plan.month}`;

      const hasLoggedActual = actualTotalsMap.has(key);
      const actualAmount = actualTotalsMap.get(key) || 0;
      const planAmount = Number(plan.target_amount);

      const variance = actualAmount - planAmount;
      
      let variancePercentage: number | null = null;
      if (planAmount > 0) {
        variancePercentage = Number((((actualAmount - planAmount) / planAmount) * 100).toFixed(2));
      }

      rows.push({
        category_id: plan.category_id,
        category_name: categoryName,
        category_color: categoryColor,
        month: plan.month,
        plan_amount: planAmount,
        actual_amount: actualAmount,
        variance,
        variance_percentage: variancePercentage,
        is_missing_actual: !hasLoggedActual,
        is_locked: lockedMonths.has(plan.month),
      });
    }

    rows.sort((a, b) => {
      if (a.month !== b.month) {
        return a.month.localeCompare(b.month);
      }
      return a.category_name.localeCompare(b.category_name);
    });

    let totalPlan = 0;
    let totalActual = 0;

    for (const row of rows) {
      totalPlan += row.plan_amount;
      totalActual += row.actual_amount;
    }

    const totalVariance = totalActual - totalPlan;
    let totalVariancePercentage: number | null = null;
    if (totalPlan > 0) {
      totalVariancePercentage = Number((((totalActual - totalPlan) / totalPlan) * 100).toFixed(2));
    }

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

export const varianceService = new VarianceService();
