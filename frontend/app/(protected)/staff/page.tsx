"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { Users, UserPlus, Mail, Shield, MapPin, Loader2, Save, X, Edit2 } from 'lucide-react';

interface StaffMember {
  id: string;
  email: string;
  role: string;
  branchId: string | null;
  isActive: boolean;
  branch?: { name: string; id: string } | null;
  createdAt: string;
}

const ROLE_STYLES: Record<string, { bg: string, text: string, icon: any }> = {
  ADMIN: { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', icon: Shield },
  MANAGER: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', icon: Shield },
  STAFF: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', icon: Shield },
  CX: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', icon: Shield }
};

interface Branch {
  id: string;
  name: string;
}

export default function StaffPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: '', branchId: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, branchRes] = await Promise.all([
        api.get('/users'),
        api.get('/branches')
      ]);
      setUsers((userRes as any).data || []);
      setBranches((branchRes as any).data || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const startEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setEditForm({ 
      role: member.role, 
      branchId: member.branchId || '' 
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/users/${id}`, editForm);
      setEditingId(null);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Update failed");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={28} color="var(--primary)" /> Team Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Map personnel to physical branches and manage network authority levels.</p>
        </div>
      </header>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              <th style={{ padding: '20px' }}>Member Identity</th>
              <th style={{ padding: '20px' }}>Role & Privilege</th>
              <th style={{ padding: '20px' }}>Mapped Branch</th>
              <th style={{ padding: '20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                <td style={{ padding: '24px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '14px', 
                      background: `linear-gradient(45deg, var(--primary), #818cf8)`, 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                    }}>
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '15px', marginBottom: '2px' }}>{member.email.split('@')[0]}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} opacity={0.6} /> {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '24px 20px' }}>
                  {editingId === member.id ? (
                    <select 
                      value={editForm.role} 
                      onChange={e => setEditForm({...editForm, role: e.target.value})}
                      style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="STAFF">STAFF</option>
                      <option value="CX">CX</option>
                    </select>
                  ) : (
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: ROLE_STYLES[member.role]?.text || 'var(--primary)', 
                      background: ROLE_STYLES[member.role]?.bg || 'var(--surface-hover)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontWeight: '700', 
                      fontSize: '11px',
                      letterSpacing: '0.5px'
                    }}>
                      <Shield size={12} /> {member.role}
                    </div>
                  )}
                </td>
                <td style={{ padding: '20px' }}>
                  {editingId === member.id ? (
                    <select 
                      value={editForm.branchId} 
                      onChange={e => setEditForm({...editForm, branchId: e.target.value})}
                      style={{ padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '13px' }}
                    >
                      <option value="">No branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: member.branch ? 'var(--text)' : 'var(--text-muted)', fontSize: '13px' }}>
                      <MapPin size={14} opacity={0.6} /> {member.branch?.name || 'Unassigned'}
                    </div>
                  )}
                </td>
                <td style={{ padding: '20px', textAlign: 'right' }}>
                  {user?.role === 'ADMIN' && (
                    editingId === member.id ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleUpdate(member.id)} style={{ padding: '6px', background: 'var(--secondary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Save size={16} /></button>
                        <button onClick={cancelEdit} style={{ padding: '6px', background: 'var(--surface-hover)', color: 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(member)} style={{ padding: '6px 12px', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Edit2 size={14} /> Reassign
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
