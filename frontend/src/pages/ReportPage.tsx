import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { VarianceChart } from '../components/VarianceChart';
import { DrillDownModal } from '../components/DrillDownModal';
import { Download, Calendar, HelpCircle, Lock, TrendingUp, TrendingDown } from 'lucide-react';

interface ReportRow {
  category_id: string;
  category_name: string;
  category_color: string;
  month: string;
  plan_amount: number;
  actual_amount: number;
  variance: number;
  variance_percentage: number | null;
  is_missing_actual: boolean;
  is_locked: boolean;
}

interface ReportSummaryData {
  rows: ReportRow[];
  totals: {
    total_plan: number;
    total_actual: number;
    total_variance: number;
    total_variance_percentage: number | null;
  };
}

interface ActualEntry {
  id: string;
  category_id: string;
  month: string;
  amount: number;
  note: string | null;
}

export const ReportPage: React.FC = () => {
  const [startDate, setStartDate] = useState('2026-01');
  const [endDate, setEndDate] = useState('2026-03');
  const [fiscalYear, setFiscalYear] = useState<string>('');

  const [selectedDrillDown, setSelectedDrillDown] = useState<{
    isOpen: boolean;
    categoryName: string;
    categoryId: string;
    month: string;
  }>({
    isOpen: false,
    categoryName: '',
    categoryId: '',
    month: '',
  });

  const { data: reportResponse, isLoading } = useQuery({
    queryKey: ['reports', startDate, endDate, fiscalYear],
    queryFn: async () => {
      let url = `/reports?startDate=${startDate}&endDate=${endDate}`;
      if (fiscalYear) {
        url = `/reports?fiscalYear=${fiscalYear}`;
      }
      const res = await apiClient.get(url);
      return res.data.data;
    },
  });

  const { data: actuals = [] } = useQuery<ActualEntry[]>({
    queryKey: ['actuals'],
    queryFn: async () => (await apiClient.get('/actuals')).data.data,
  });

  const reportData: ReportSummaryData | undefined = reportResponse?.report;

  const handleExportCsv = () => {
    if (!reportData || reportData.rows.length === 0) return;

    const headers = ['Month', 'Category', 'Plan Target ($)', 'Actual Spend ($)', 'Variance ($)', 'Variance %'];
    const csvRows = reportData.rows.map((r) => [
      r.month,
      `"${r.category_name}"`,
      r.plan_amount,
      r.actual_amount,
      r.variance,
      r.variance_percentage !== null ? `${r.variance_percentage}%` : 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Plan_vs_Actual_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenDrillDown = (row: ReportRow) => {
    setSelectedDrillDown({
      isOpen: true,
      categoryName: row.category_name,
      categoryId: row.category_id,
      month: row.month,
    });
  };

  const filteredDrillDownEntries = actuals.filter(
    (a) => a.category_id === selectedDrillDown.categoryId && a.month === selectedDrillDown.month
  );

  return (
    <div className="fade-in">
      <div style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Plan vs Actual Report</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Comparing monthly spending targets against logged actual expenditures</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label className="form-label" style={{ margin: 0 }}>Fiscal Year:</label>
            <select
              className="form-select"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              style={{ width: '130px' }}
            >
              <option value="">Custom Range</option>
              <option value="2025">FY 2025</option>
              <option value="2026">FY 2026</option>
              <option value="2027">FY 2027</option>
            </select>
          </div>

          {!fiscalYear && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>From:</label>
                <input
                  type="month"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ width: '160px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>To:</label>
                <input
                  type="month"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '160px' }}
                />
              </div>
            </>
          )}

          <button className="btn btn-secondary" onClick={handleExportCsv} disabled={!reportData || reportData.rows.length === 0}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Generating variance report...</p>
      ) : !reportData || reportData.rows.length === 0 ? (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <Calendar size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Target Plans Logged for Selected Period</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
            Go to <strong>Spending Targets</strong> to set monthly budget allocations for your categories.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Target Plan</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: 'var(--accent-primary)' }}>
                ${reportData.totals.total_plan.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Logged Actual</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: 'var(--accent-success)' }}>
                ${reportData.totals.total_actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Net Variance (Actual - Plan)</div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  marginTop: '6px',
                  color: reportData.totals.total_variance > 0 ? '#ef4444' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {reportData.totals.total_variance > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {reportData.totals.total_variance > 0 ? '+' : ''}
                ${reportData.totals.total_variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Variance %</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px' }}>
                {reportData.totals.total_variance_percentage !== null
                  ? `${reportData.totals.total_variance_percentage > 0 ? '+' : ''}${reportData.totals.total_variance_percentage}%`
                  : '—'}
              </div>
            </div>
          </div>

          <VarianceChart rows={reportData.rows} />

          <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              Detailed Category × Month Variance Breakdown
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 16px' }}>Month</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Plan ($)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actual ($)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Variance ($)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Variance %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleOpenDrillDown(row)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    title="Click row to drill down into actual entries"
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {row.month}
                      {row.is_locked && (
                        <span className="badge badge-locked" style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.65rem' }}>
                          <Lock size={10} /> Locked
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: row.category_color }} />
                      {row.category_name}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                      ${row.plan_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                      ${row.actual_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      {row.is_missing_actual && (
                        <span className="badge badge-missing" style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.65rem' }} title="No entry logged (evaluated as $0)">
                          $0 evaluated
                        </span>
                      )}
                    </td>

                    <td
                      style={{
                        padding: '14px 16px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: row.variance > 0 ? '#ef4444' : row.variance < 0 ? '#10b981' : 'var(--text-primary)',
                      }}
                    >
                      {row.variance > 0 ? '+' : ''}${row.variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>
                      {row.variance_percentage !== null ? (
                        <span style={{ color: row.variance_percentage > 0 ? '#ef4444' : row.variance_percentage < 0 ? '#10b981' : 'var(--text-primary)' }}>
                          {row.variance_percentage > 0 ? '+' : ''}{row.variance_percentage}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }} title="Target plan is zero; percentage variance cannot be calculated">
                          — <HelpCircle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <DrillDownModal
        isOpen={selectedDrillDown.isOpen}
        onClose={() => setSelectedDrillDown((prev) => ({ ...prev, isOpen: false }))}
        categoryName={selectedDrillDown.categoryName}
        month={selectedDrillDown.month}
        actualEntries={filteredDrillDownEntries}
      />
    </div>
  );
};
