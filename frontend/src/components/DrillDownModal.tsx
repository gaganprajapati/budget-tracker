import React from 'react';
import { X, Receipt } from 'lucide-react';

interface ActualEntry {
  id: string;
  category_id: string;
  month: string;
  amount: number;
  note: string | null;
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  month: string;
  actualEntries: ActualEntry[];
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  month,
  actualEntries,
}) => {
  if (!isOpen) return null;

  const totalAmount = actualEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '600px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt color="var(--accent-primary)" />
              {categoryName} - {month}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Underlying Logged Actual Entries</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {actualEntries.length === 0 ? (
          <div className="badge badge-missing" style={{ width: '100%', padding: '16px', borderRadius: '8px' }}>
            No actual entries logged for this period (evaluated as $0 spend).
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '10px 14px' }}>Note / Description</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                {actualEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 14px', fontSize: '0.9rem' }}>{entry.note || '—'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-success)' }}>
                      ${Number(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', fontWeight: 700 }}>
              <span>Total Actual Spend:</span>
              <span style={{ color: 'var(--accent-success)' }}>
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
};
