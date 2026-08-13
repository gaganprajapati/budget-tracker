import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { Lock, Unlock, ShieldAlert, Calendar } from 'lucide-react';

interface PeriodLock {
  id: string;
  month: string;
  locked_at: string;
}

export const LocksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [monthToLock, setMonthToLock] = useState('2026-01');
  const [quarterYear, setQuarterYear] = useState(2026);
  const [quarterNum, setQuarterNum] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { data: locks = [], isLoading } = useQuery<PeriodLock[]>({
    queryKey: ['locks'],
    queryFn: async () => (await apiClient.get('/locks')).data.data,
  });

  const lockMonthMutation = useMutation({
    mutationFn: async (month: string) => {
      return await apiClient.post('/locks/month', { month });
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['locks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to lock period.');
    },
  });

  const unlockMonthMutation = useMutation({
    mutationFn: async (month: string) => {
      return await apiClient.delete(`/locks/month/${month}`);
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['locks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to unlock period.');
    },
  });

  const lockQuarterMutation = useMutation({
    mutationFn: async (payload: { year: number; quarter: number }) => {
      return await apiClient.post('/locks/quarter', payload);
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['locks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to lock quarter.');
    },
  });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Period Locking Management</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Lock monthly or quarterly financial periods to prevent modifications to plans and actuals.
        </p>
      </div>

      {error && (
        <div className="badge badge-missing" style={{ padding: '12px 18px', marginBottom: '20px', borderRadius: '8px', width: '100%' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent-warning)" />
            Lock Individual Month
          </h3>
          <div className="form-group">
            <label className="form-label">Select Month to Lock</label>
            <input
              type="month"
              className="form-input"
              value={monthToLock}
              onChange={(e) => setMonthToLock(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            onClick={() => lockMonthMutation.mutate(monthToLock)}
            disabled={lockMonthMutation.isPending}
          >
            <Lock size={16} />
            {lockMonthMutation.isPending ? 'Locking...' : `Lock Period ${monthToLock}`}
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="var(--accent-primary)" />
            Bulk Lock Entire Quarter
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-input"
                value={quarterYear}
                onChange={(e) => setQuarterYear(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quarter</label>
              <select className="form-select" value={quarterNum} onChange={(e) => setQuarterNum(Number(e.target.value))}>
                <option value={1}>Q1 (Jan - Mar)</option>
                <option value={2}>Q2 (Apr - Jun)</option>
                <option value={3}>Q3 (Jul - Sep)</option>
                <option value={4}>Q4 (Oct - Dec)</option>
              </select>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px' }}
            onClick={() => lockQuarterMutation.mutate({ year: quarterYear, quarter: quarterNum })}
            disabled={lockQuarterMutation.isPending}
          >
            <Lock size={16} />
            {lockQuarterMutation.isPending ? 'Locking Quarter...' : `Lock Q${quarterNum} ${quarterYear}`}
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18} color="var(--accent-warning)" />
          Currently Locked Periods ({locks.length})
        </h3>

        {isLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading locked periods...</p>
        ) : locks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No periods locked. All target and actual months are currently open for editing.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 16px' }}>Locked Month</th>
                <th style={{ padding: '12px 16px' }}>Lock Timestamp</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {locks.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--accent-warning)' }}>
                    <span className="badge badge-locked">{l.month}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(l.locked_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => unlockMonthMutation.mutate(l.month)}
                      disabled={unlockMonthMutation.isPending}
                    >
                      <Unlock size={14} /> Unlock Period
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
