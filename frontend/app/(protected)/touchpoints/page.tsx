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
                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} placeholder="e.g. Lobby Concierge Terminal" />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Category</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}>
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
                    onChange={e => setFormData({ ...formData, branchId: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, staffId: e.target.value })}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, padding: '24px' }} onClick={() => setShowQrModal(null)}>
          {/* SCREEN MODAL */}
          <div 
            className="no-print" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              background: 'var(--surface)', 
              padding: '48px', 
              borderRadius: '32px', 
              border: '1px solid var(--border)', 
              width: '100%', 
              maxWidth: '440px', 
              textAlign: 'center', 
              position: 'relative', 
              boxShadow: '0 50px 100px -20px rgba(0,0,0,0.4)',
            }}
          >
            <button onClick={() => setShowQrModal(null)} style={{ position: 'absolute', top: '32px', right: '32px', background: 'var(--surface-hover)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex' }}><X size={20} /></button>
            <div style={{ width: '64px', height: '64px', background: 'rgba(99,102,241,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <QrCode size={32} color="var(--primary)" />
            </div>
            
            <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', color: 'var(--text)', letterSpacing: '-1px' }}>Native Deployment</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '40px' }}>{showQrModal.name} &bull; {showQrModal.branch?.name}</p>

            <a 
              href={`${window.location.origin}/feedback?t=${showQrModal.token}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                background: 'white', 
                padding: '24px', 
                borderRadius: '24px', 
                display: 'inline-block', 
                marginBottom: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                textDecoration: 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <QRCodeSVG 
                value={`${window.location.origin}/feedback?t=${showQrModal.token}`} 
                size={220}
                bgColor="#ffffff"
                fgColor="#0f172a" 
                level="H"
              />
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Click to Preview Link
              </div>
            </a>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                onClick={() => window.print()}
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  borderRadius: '16px', 
                  fontWeight: '800', 
                  border: 'none',
                  cursor: 'pointer', 
                  fontSize: '15px', 
                  boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <Plus size={18} /> Print Terminal Standee
              </button>
            </div>
          </div>

          {/* PRINT VIEW (Hidden on screen) */}
          <div className="print-only">
            <div className="print-badge">Help Us Craft Perfection</div>
            <h1>Your feedback is the compass that guides our growth.</h1>
            <div className="print-loc">{showQrModal.name} &bull; {showQrModal.branch?.name}</div>
            
            <div className="print-qr-box">
              <QRCodeSVG 
                value={`${window.location.origin}/feedback?t=${showQrModal.token}`} 
                size={550}
                bgColor="#ffffff"
                fgColor="#000000" 
                level="H"
              />
            </div>
            
            <div className="print-cta">SCAN TO SHARE YOUR EXPERIENCE</div>
            <div className="print-brand">SECURED BY VOICEFIRST SYSTEM</div>
          </div>

          <style jsx global>{`
            .print-only { display: none; }
            
            @media print {
              @page { margin: 0; size: auto; }
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
              .print-only { 
                display: flex !important; 
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                position: fixed !important;
                inset: 0 !important;
                background: white !important;
                text-align: center !important;
                padding: 40px !important;
              }
              .print-badge {
                font-size: 20px;
                font-weight: 800;
                color: #6366f1;
                margin-bottom: 24px;
                letter-spacing: 2px;
                text-transform: uppercase;
              }
              .print-only h1 { 
                font-size: 52px; 
                color: #0f172a; 
                margin: 0; 
                max-width: 800px;
                line-height: 1.1;
                font-weight: 900;
              }
              .print-loc { font-size: 24px; color: #64748b; margin-top: 16px; font-weight: 500; }
              .print-qr-box {
                margin: 60px 0;
                padding: 32px;
                border: 2px solid #f1f5f9;
                border-radius: 48px;
              }
              .print-cta {
                font-size: 32px;
                font-weight: 900;
                color: #0f172a;
                letter-spacing: 4px;
              }
              .print-brand {
                font-size: 14px;
                font-weight: 800;
                color: #cbd5e1;
                margin-top: 80px;
                letter-spacing: 6px;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
