import { describe, it, expect } from 'vitest';
import { VarianceService } from '../src/services/varianceService.js';
import { Category, Plan, Actual } from '../src/types/index.js';

describe('VarianceService Domain Calculations', () => {
  const varianceService = new VarianceService();

  const mockCategories: Category[] = [
    {
      id: 'cat-marketing',
      user_id: 'user-1',
      name: 'Marketing',
      color: '#6366F1',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'cat-payroll',
      user_id: 'user-1',
      name: 'Payroll',
      color: '#10B981',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  it('should correctly calculate variances for the assignment sample dataset', () => {
    const plans: Plan[] = [
      { id: 'p1', user_id: 'user-1', category_id: 'cat-marketing', month: '2026-01', target_amount: 5000, created_at: '', updated_at: '' },
      { id: 'p2', user_id: 'user-1', category_id: 'cat-payroll', month: '2026-01', target_amount: 20000, created_at: '', updated_at: '' },
      { id: 'p3', user_id: 'user-1', category_id: 'cat-marketing', month: '2026-02', target_amount: 5000, created_at: '', updated_at: '' },
      { id: 'p4', user_id: 'user-1', category_id: 'cat-payroll', month: '2026-02', target_amount: 20000, created_at: '', updated_at: '' },
    ];

    const actuals: Actual[] = [
      { id: 'a1', user_id: 'user-1', category_id: 'cat-marketing', month: '2026-01', amount: 4800, note: null, created_at: '', updated_at: '' },
      { id: 'a2', user_id: 'user-1', category_id: 'cat-payroll', month: '2026-01', amount: 20500, note: null, created_at: '', updated_at: '' },
      { id: 'a3', user_id: 'user-1', category_id: 'cat-payroll', month: '2026-02', amount: 19800, note: null, created_at: '', updated_at: '' },
    ];

    const summary = varianceService.calculateReportSummary({
      categories: mockCategories,
      plans,
      actuals,
      lockedMonths: new Set<string>(['2026-02']),
    });

    expect(summary.rows).toHaveLength(4);

    // Row 1: Marketing 2026-01
    const row1 = summary.rows.find((r) => r.category_id === 'cat-marketing' && r.month === '2026-01');
    expect(row1).toBeDefined();
    expect(row1?.plan_amount).toBe(5000);
    expect(row1?.actual_amount).toBe(4800);
    expect(row1?.variance).toBe(-200);
    expect(row1?.variance_percentage).toBe(-4.00);

    // Row 3: Marketing 2026-02 (Missing Actual Entry)
    const row3 = summary.rows.find((r) => r.category_id === 'cat-marketing' && r.month === '2026-02');
    expect(row3).toBeDefined();
    expect(row3?.plan_amount).toBe(5000);
    expect(row3?.actual_amount).toBe(0);
    expect(row3?.variance).toBe(-5000);
    expect(row3?.variance_percentage).toBe(-100.00);
    expect(row3?.is_missing_actual).toBe(true);
    expect(row3?.is_locked).toBe(true);
  });

  it('should handle zero plan targets safely by returning variance_percentage = null', () => {
    const plans: Plan[] = [
      { id: 'p1', user_id: 'user-1', category_id: 'cat-marketing', month: '2026-03', target_amount: 0, created_at: '', updated_at: '' },
    ];
    const actuals: Actual[] = [
      { id: 'a1', user_id: 'user-1', category_id: 'cat-marketing', month: '2026-03', amount: 1500, note: null, created_at: '', updated_at: '' },
    ];

    const summary = varianceService.calculateReportSummary({
      categories: mockCategories,
      plans,
      actuals,
      lockedMonths: new Set<string>(),
    });

    const row = summary.rows[0];
    expect(row.plan_amount).toBe(0);
    expect(row.actual_amount).toBe(1500);
    expect(row.variance).toBe(1500);
    expect(row.variance_percentage).toBeNull();
  });
});
