import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, LogOut, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>
          <DollarSign size={20} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Plan vs Actual Tracker
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Enterprise Spending & Variance Analytics</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-secondary btn-sm" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.email}</div>
            <button className="btn btn-danger btn-sm" onClick={logout} style={{ padding: '4px 10px' }} title="Sign Out">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
