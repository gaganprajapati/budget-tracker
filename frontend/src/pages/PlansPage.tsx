import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { Target, Lock, Plus, Check } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Plan {
  id: string;
  category_id: string;
  month: string;
  target_amount: number;
}

interface PeriodLock {
  id: string;
  month: string;
}

export const PlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState('2026-01');
  const [categoryId, setCategoryId] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get('/categories')).data.data,
  });

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<Plan[]>({
    queryKey: ['plans', selectedMonth],
    queryFn: async () => (await apiClient.get(`/plans?startDate=${selectedMonth}&endDate=${selectedMonth}`)).data.data,
  });

  const { data: locks = [] } = useQuery<PeriodLock[]>({
    queryKey: ['locks'],
    queryFn: async () => (await apiClient.get('/locks')).data.data,
  });

  const isCurrentMonthLocked = locks.some((l) => l.month === selectedMonth);

  const upsertMutation = useMutation({
    mutationFn: async (payload: { category_id: string; month: string; target_amount: number }) => {
      return await apiClient.post('/plans', payload);
    },
    onSuccess: () => {
      setTargetAmount('');
      setError(null);
      setSuccessMessage(`Target plan updated successfully for ${selectedMonth}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to save spending target.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || targetAmount === '') return;
    upsertMutation.mutate({
      category_id: categoryId,
      month: selectedMonth,
      target_amount: Number(targetAmount),
    });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Spending Targets (Plans)</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Set monthly budget allocations per category</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="form-label" style={{ margin: 0 }}>Target Month:</label>
          <input
            type="month"
            className="form-input"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: '180px' }}
          />

          {isCurrentMonthLocked && (
            <span className="badge badge-locked">
              <Lock size={12} /> Locked (Read-Only)
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="badge badge-missing" style={{ padding: '12px 18px', marginBottom: '20px', borderRadius: '8px', width: '100%' }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="badge badge-success" style={{ padding: '12px 18px', marginBottom: '20px', borderRadius: '8px', width: '100%' }}>
          <Check size={16} /> {successMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="var(--accent-primary)" />
            Set Target for {selectedMonth}
          </h3>

          {isCurrentMonthLocked ? (
            <div className="badge badge-locked" style={{ padding: '12px', width: '100%', borderRadius: '8px' }}>
              <Lock size={16} /> Period {selectedMonth} is locked. Modifications are rejected by server policy.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 5000.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={upsertMutation.isPending}>
                <Plus size={16} />
                {upsertMutation.isPending ? 'Saving Target...' : 'Save Target Amount'}
              </button>
            </form>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            Active Targets for {selectedMonth}
          </h3>

          {isLoadingPlans ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading spending targets...</p>
          ) : plans.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No targets set for {selectedMonth} yet. Use the form to assign budget targets.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Month</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Target Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat?.color || '#6366F1' }} />
                        {cat?.name || 'Unknown Category'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{p.month}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        ${Number(p.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
