import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import { Tag, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color: string;
}

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#6366F1');
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; color: string }) => {
      return await apiClient.post('/categories', payload);
    },
    onSuccess: () => {
      setName('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; color: string }) => {
      return await apiClient.put(`/categories/${payload.id}`, { name: payload.name, color: payload.color });
    },
    onSuccess: () => {
      setEditingId(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, color });
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    updateMutation.mutate({ id, name: editName, color: editColor });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Spending Categories</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage your organization's expenditure classification tags</p>
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
            <Plus size={18} color="var(--accent-primary)" />
            Add New Category
          </h3>

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Marketing, Payroll, Tools"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Badge Tag Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={createMutation.isPending}>
              <Plus size={16} />
              {createMutation.isPending ? 'Adding...' : 'Add Category'}
            </button>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} color="var(--accent-success)" />
            Active Categories ({categories.length})
          </h3>

          {isLoading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No categories created yet. Use the form to add one.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                  }}
                >
                  {editingId === cat.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button className="btn btn-success btn-sm" onClick={() => handleUpdate(cat.id)}>
                        <Check size={16} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: cat.color, display: 'inline-block' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cat.name}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(cat)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(cat.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
