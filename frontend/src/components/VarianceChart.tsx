import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ReportRow {
  category_name: string;
  month: string;
  plan_amount: number;
  actual_amount: number;
  variance: number;
}

interface VarianceChartProps {
  rows: ReportRow[];
}

export const VarianceChart: React.FC<VarianceChartProps> = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return <p style={{ color: 'var(--text-secondary)' }}>No financial report data available for chart rendering.</p>;
  }

  const chartData = rows.map((r) => ({
    name: `${r.category_name} (${r.month})`,
    Plan: r.plan_amount,
    Actual: r.actual_amount,
    Variance: r.variance,
  }));

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>
        Financial Target vs Actual Visual Comparison
      </h3>
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="name"
              stroke="var(--text-secondary)"
              angle={-25}
              textAnchor="end"
              interval={0}
              style={{ fontSize: '0.8rem' }}
            />
            <YAxis stroke="var(--text-secondary)" tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#ffffff',
              }}
              formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', bottom: '10px' }} />
            <Bar dataKey="Plan" fill="#6366F1" radius={[4, 4, 0, 0]} name="Target Plan ($)" />
            <Bar dataKey="Actual" fill="#10B981" radius={[4, 4, 0, 0]} name="Logged Actual ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
