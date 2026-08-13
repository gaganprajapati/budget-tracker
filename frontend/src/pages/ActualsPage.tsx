import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { CSVImporter } from '../components/CSVImporter';
import { Receipt, Upload, Plus, Trash2, Lock } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Actual {
  id: string;
  category_id: string;
  month: string;
  amount: number;
  note: string | null;
}

interface PeriodLock {
  id: string;
  month: string;
}

export const ActualsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState('2026-01');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await apiClient.get('/categories')).data.data,
  });

  const { data: actuals = [], isLoading: isLoadingActuals } = useQuery<Actual[]>({
    queryKey: ['actuals', selectedMonth],
    queryFn: async () => (await apiClient.get(`/actuals?startDate=${selectedMonth}&endDate=${selectedMonth}`)).data.data,
  });

  const { data: locks = [] } = useQuery<PeriodLock[]>({
    queryKey: ['locks'],
    queryFn: async () => (await apiClient.get('/locks')).data.data,
  });

  const isCurrentMonthLocked = locks.some((l) => l.month === selectedMonth);

  const createMutation = useMutation({
    mutationFn: async (payload: { category_id: string; month: string; amount: number; note?: string }) => {
      return await apiClient.post('/actuals', payload);
    },
    onSuccess: () => {
      setAmount('');
      setNote('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['actuals'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to log actual spend entry.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/actuals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actuals'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || amount === '') return;
    createMutation.mutate({
      category_id: categoryId,
      month: selectedMonth,
      amount: Number(amount),
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Actual Expenditures</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log actual spending entries or import batch CSV files</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setIsCsvModalOpen(true)}>
            <Upload size={16} /> Import CSV
          </button>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} color="var(--accent-success)" />
            Log Spend Entry ({selectedMonth})
          </h3>

          {isCurrentMonthLocked ? (
            <div className="badge badge-locked" style={{ padding: '12px', width: '100%', borderRadius: '8px' }}>
              <Lock size={16} /> Period {selectedMonth} is locked. Modifications are rejected by server policy.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount Spent ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 4800.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Note / Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Q1 Campaign initial spend"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '12px' }} disabled={createMutation.isPending}>
                <Plus size={16} />
                {createMutation.isPending ? 'Logging Entry...' : 'Log Spend Entry'}
              </button>
            </form>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            Logged Entries for {selectedMonth} ({actuals.length})
          </h3>

          {isLoadingActuals ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading actual spend entries...</p>
          ) : actuals.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No spend entries logged for {selectedMonth} yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Note</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount ($)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {actuals.map((a) => {
                  const cat = categories.find((c) => c.id === a.category_id);
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat?.color || '#10B981' }} />
                        {cat?.name || 'Unknown Category'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {a.note || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-success)' }}>
                        ${Number(a.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteMutation.mutate(a.id)}
                          disabled={isCurrentMonthLocked}
                          title={isCurrentMonthLocked ? 'Month is locked' : 'Delete Entry'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CSVImporter
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['actuals'] });
          queryClient.invalidateQueries({ queryKey: ['reports'] });
        }}
      />
    </div>
  );
};
