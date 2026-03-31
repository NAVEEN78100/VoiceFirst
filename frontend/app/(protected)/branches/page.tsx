"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { Map, Plus, MapPin, Loader2 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  isActive: boolean;
  _count?: {
    users: number;
    touchpoints: number;
  };
}

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', location: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/branches');
      setBranches(res.data || []);
    } catch (error) {
      console.error('Failed to fetch branches', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBranches();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setSubmitting(true);
    try {
      await api.post('/branches', formData);
      setShowModal(false);
      setFormData({ name: '', code: '', location: '' });
      await fetchBranches();
    } catch (error) {
      alert("Failed to create branch");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Map size={28} color="var(--primary)" /> Branch Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Overview of all physical service locations and registered endpoints.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setShowModal(true)}
            style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={18} /> Provision Branch
          </button>
        )}
      </header>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              <th style={{ padding: '20px' }}>Branch Definition</th>
              <th style={{ padding: '20px' }}>Location Code</th>
              <th style={{ padding: '20px' }}>Metrics</th>
              <th style={{ padding: '20px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(branch => (
              <tr key={branch.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '15px' }}>{branch.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {branch.location || 'No Physical Details'}
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
                    {branch.code || 'N/A'}
                  </span>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                    <div><strong style={{ color: 'var(--text)' }}>{branch._count?.touchpoints || 0}</strong> Touchpoints</div>
                    <div><strong style={{ color: 'var(--text)' }}>{branch._count?.users || 0}</strong> Staff</div>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: branch.isActive ? '#10b981' : 'var(--text-muted)', fontWeight: 500, fontSize: '14px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: branch.isActive ? '#10b981' : 'var(--text-muted)' }} />
                    {branch.isActive ? 'Active Node' : 'Suspended'}
                  </div>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No branches deployed in the network.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Plus color="var(--primary)" /> Configure new node
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Branch Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} placeholder="e.g. Neo-Tokyo Main" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Location Identifer (Optional)</label>
                <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} placeholder="e.g. TOK-01" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Physical Address</label>
                <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} placeholder="City, Region" />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Authenticating...' : 'Deploy Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
