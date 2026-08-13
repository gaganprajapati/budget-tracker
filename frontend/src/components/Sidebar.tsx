import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Tag, Target, Receipt, Lock } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Variance Report', path: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'Spending Targets', path: '/plans', icon: <Target size={18} /> },
    { label: 'Actual Expenditures', path: '/actuals', icon: <Receipt size={18} /> },
    { label: 'Categories', path: '/categories', icon: <Tag size={18} /> },
    { label: 'Period Locks', path: '/locks', icon: <Lock size={18} /> },
  ];

  return (
    <aside className="glass-panel" style={{ width: '240px', minHeight: 'calc(100vh - 65px)', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none', padding: '20px 12px' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))' : 'transparent',
              boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
