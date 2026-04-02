"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { Network, Plus, QrCode, User as UserIcon, Loader2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StaffUser {
  id: string;
  email: string;
}

interface Touchpoint {
  id: string;
  name: string;
  type: string;
  token: string;
  isActive: boolean;
  branch: { name: string; id: string };
  staff?: { email: string; id: string } | null;
}

export default function TouchpointsPage() {
  const { user } = useAuth();
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [branches, setBranches] = useState<{ id: string, name: string }[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<Touchpoint | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'BRANCH_DESK',
    branchId: user?.branchId || '',
    staffId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/touchpoints');
      setTouchpoints(res.data || []);
      
      if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
        const branchRes: any = await api.get('/branches');
        setBranches(branchRes.data || []);
        
        const staffRes: any = await api.get('/users');
        // Filter to only show people with STAFF role if possible, or all accessible
        setStaffList(staffRes.data || []);

        if (user?.role === 'ADMIN' && branchRes.data?.length > 0) {
           setFormData(f => ({ ...f, branchId: branchRes.data[0].id }));
        }
      }
    } catch (error: any) {
      console.error('Touchpoints Fetch Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.branchId) return;
    setSubmitting(true);
    try {
      await api.post('/touchpoints', formData);
      setShowDeployModal(false);
      setFormData({ name: '', type: 'BRANCH_DESK', branchId: user?.branchId || (branches.length > 0 ? branches[0].id : ''), staffId: '' });
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Deployment failed");
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
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-1px' }}>
            <Network size={32} color="var(--primary)" /> Touchpoints
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Feedback collection interfaces natively tracked and deployed across physical branches.</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button 
            onClick={() => setShowDeployModal(true)}
            style={{ 
              padding: '12px 24px', 
              background: 'var(--primary)', 
              color: 'white', 
              borderRadius: '12px', 
              fontWeight: '700', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              border: 'none', 
              cursor: 'pointer', 
              boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={18} /> Deploy New
          </button>
        )}
      </header>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              <th style={{ padding: '20px' }}>Identity & Scope</th>
              <th style={{ padding: '20px' }}>Mapping Node</th>
              <th style={{ padding: '20px' }}>Status Constraints</th>
              <th style={{ padding: '20px', textAlign: 'right' }}>QR Action</th>
            </tr>
          </thead>
          <tbody>
            {touchpoints.map(point => (
              <tr key={point.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: '15px' }}>{point.name}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.2)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      {point.type}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    <div style={{ color: 'var(--text)', fontWeight: 500, marginBottom: '4px' }}>{point.branch?.name}</div>
                    {point.staff && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <UserIcon size={12} /> {point.staff.email}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: point.isActive ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: point.isActive ? 'var(--secondary)' : 'var(--text-muted)', boxShadow: point.isActive ? '0 0 10px var(--secondary)' : 'none' }} />
                    {point.isActive ? 'Actively Collecting' : 'Standby'}
                  </div>
                </td>
                <td style={{ padding: '20px', textAlign: 'right' }}>
                  <button onClick={() => setShowQrModal(point)} style={{ padding: '8px 16px', background: 'var(--surface-hover)', color: 'var(--text)', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', transition: 'background 0.2s', fontSize: '13px', fontWeight: 500 }}>
                    <QrCode size={16} /> Print Native Code
                  </button>
                </td>
              </tr>
            ))}
            {touchpoints.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Network size={48} opacity={0.2} style={{ margin: '0 auto 16px' }} />
                  No Touchpoints have been statically provisioned under your authority scope.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDeployModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: '32px', border: '1px solid var(--border)', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
              <Plus color="var(--primary)" /> New Touchpoint
            </h2>
            <form onSubmit={handleDeploy}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Identifier Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} placeholder="e.g. Lobby Concierge Terminal" />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Category</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}>
                    <option value="BRANCH_DESK">Branch General Desk</option>
                    <option value="STAFF">Dedicated Staff Link</option>
                    <option value="ATM">ATM Kiosk</option>
                    <option value="OTHER">Other Custom Panel</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Assigned Branch</label>
                  <select 
                    value={formData.branchId} 
                    onChange={e => setFormData({...formData, branchId: e.target.value})} 
                    disabled={user?.role === 'MANAGER'}
                    style={{ width: '100%', padding: '12px', background: user?.role === 'MANAGER' ? 'var(--surface-hover)' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                  >
                    <option value="" disabled>Select physical node</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Lead Staff Member (Optional)</label>
                <select 
                  value={formData.staffId} 
                  onChange={e => setFormData({...formData, staffId: e.target.value})} 
                  style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                >
                  <option value="">No specific assignment</option>
                  {staffList.filter(s => !formData.branchId || (s as any).branchId === formData.branchId).map(s => (
                    <option key={s.id} value={s.id}>{s.email}</option>
                  ))}
                  {/* Show all if filtering would result in 0? Or just show all? */}
                  {staffList.length === 0 && <option disabled>No local staff found</option>}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setShowDeployModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Registering...' : 'Deploy Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Deep Aesthetic QR Code Presentation Modal */}
      {showQrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }} onClick={() => setShowQrModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', padding: '48px', borderRadius: '40px', border: '1px solid var(--border)', width: '100%', maxWidth: '440px', textAlign: 'center', position: 'relative', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setShowQrModal(null)} style={{ position: 'absolute', top: '32px', right: '32px', background: 'var(--surface-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}><X size={20} /></button>
            <QrCode size={48} color="var(--primary)" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--text)' }}>Feedback Interface</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '40px' }}>{showQrModal.name} &bull; {showQrModal.type}</p>

            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'inline-block', marginBottom: '32px' }}>
              <QRCodeSVG 
                value={`${window.location.origin}/feedback?t=${showQrModal.token}`} 
                size={220}
                bgColor="#ffffff"
                fgColor="#0f172a" 
                level="Q"
              />
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '4px' }}>Secure UUID Endpoint</div>
              <code style={{ color: 'var(--text)', fontSize: '12px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {showQrModal.token}
              </code>
            </div>
            
            <a 
              href={`/feedback?t=${showQrModal.token}`} 
              target="_blank"
              style={{ display: 'block', marginTop: '16px', color: 'var(--primary)', fontSize: '12px', textDecoration: 'underline' }}
            >
              QA Preview: Open Feedback Page in New Tab
            </a>
            
            <button style={{ marginTop: '24px', width: '100%', padding: '16px', background: 'transparent', border: '1px dashed var(--primary)', color: 'var(--primary)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
              Print Terminal Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
