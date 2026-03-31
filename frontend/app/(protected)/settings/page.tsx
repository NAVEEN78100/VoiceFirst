"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Settings, Shield, Bell, User as UserIcon, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import Image from 'next/image';

export default function SettingsPage() {
  const { user, reloadUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'PROFILE' | '2FA'>('PROFILE');
  
  // 2FA Setup State
  const [setupStep, setSetupStep] = useState<'IDLE' | 'QR' | 'RECOVERY'>('IDLE');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!user) return null;

  const init2FASetup = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res: any = await api.post('/2fa/setup', { method: 'TOTP' });
      // The backend actually returns { secret, qrCode, message }
      setQrCodeDataUrl(res.data.qrCode);
      setSetupStep('QR');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (totpCode.length < 6) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res: any = await api.post('/2fa/verify-totp-setup', { code: totpCode });
      setRecoveryCodes(res.data.recoveryCodes);
      setSetupStep('RECOVERY');
      await reloadUser();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    const password = prompt('SECURITY CHECK: Enter your Account Password to disable 2FA:');
    if (!password) return;
    
    setLoading(true);
    try {
      await api.post('/2fa/disable', { password });
      await reloadUser();
      alert('2FA has been successfully disabled.');
    } catch (err: any) {
      alert(err.message || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Security & Preferences</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and multifactor layers.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '40px' }}>
        
        {/* Navigation Sidebar */}
        <aside>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <button 
                onClick={() => setActiveTab('PROFILE')}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '12px', 
                  background: activeTab === 'PROFILE' ? 'var(--surface-hover)' : 'transparent', 
                  color: activeTab === 'PROFILE' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '12px', border: 'none', borderRadius: '8px' 
                }}
              >
                <UserIcon size={18} /> Profile Info
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('2FA')}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '12px', 
                  background: activeTab === '2FA' ? 'var(--surface-hover)' : 'transparent', 
                  color: activeTab === '2FA' ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '12px', border: 'none', borderRadius: '8px' 
                }}
              >
                <Shield size={18} /> 2FA Setup
              </button>
            </li>
            <li style={{ padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', opacity: 0.5, cursor: 'not-allowed' }}>
              <Bell size={18} /> Notifications
            </li>
          </ul>
        </aside>

        {/* Dynamic Content Panel */}
        <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', minHeight: '400px' }}>
          
          {/* PROFILE TAB */}
          {activeTab === 'PROFILE' && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '20px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                User Identification
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Email Address</label>
                  <input type="text" value={user.email} disabled style={{ background: 'var(--background)' }} />
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Network Privilege</label>
                    <input type="text" value={user.role} disabled style={{ background: 'var(--background)', color: 'var(--primary)', fontWeight: 'bold' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2FA SETUP TAB */}
          {activeTab === '2FA' && (
            <div className="animate-fade-in">
              <h2 style={{ fontSize: '20px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Multi-Factor Authentication
                {user.twoFactorEnabled ? (
                  <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Active
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={14} /> Inactive
                  </span>
                )}
              </h2>

              {/* IS ENABLED STATE */}
              {user.twoFactorEnabled && (
                <div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                    Your account is currently protected by TOTP Multi-Factor Authentication. 
                    Tokens generated by your authenticator app are required every time you login on a new session.
                  </p>
                  <button 
                    onClick={disable2FA}
                    disabled={loading}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Shield size={18} />}
                    Disable Protection
                  </button>
                </div>
              )}

              {/* NOT ENABLED - IDLE */}
              {!user.twoFactorEnabled && setupStep === 'IDLE' && (
                <div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                    Enhance your account security by requiring an Authenticator App (e.g. Google Authenticator or Authy) code to log in.
                  </p>
                  <button onClick={init2FASetup} disabled={loading} style={{ background: 'var(--primary)', color: 'white' }}>
                    {loading ? 'Initializing...' : 'Setup Authenticator App'}
                  </button>
                </div>
              )}

              {/* NOT ENABLED - QR GENERATED */}
              {!user.twoFactorEnabled && setupStep === 'QR' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>1. Scan this QR Code with your Authenticator App.</p>
                  
                  <div style={{ background: 'white', padding: '16px', borderRadius: '8px', width: 'fit-content', alignSelf: 'center', margin: '16px 0' }}>
                    <img src={qrCodeDataUrl} alt="2FA QR Code" width={200} height={200} />
                  </div>

                  <p style={{ color: 'var(--text-muted)' }}>2. Enter the 6-digit code to verify synchronization.</p>
                  
                  {errorMsg && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{errorMsg}</p>}
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input 
                      type="text" 
                      maxLength={6} 
                      placeholder="000000" 
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center', flex: 1 }}
                    />
                    <button 
                      onClick={verifyAndEnable2FA} 
                      disabled={totpCode.length < 6 || loading}
                      style={{ background: 'var(--secondary)', color: 'white', minWidth: '120px' }}
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              )}

              {/* NOT ENABLED - WAIT, IT JUST GOT ENABLED, SHOW RECOVERY CODES */}
              {user.twoFactorEnabled && setupStep === 'RECOVERY' && (
                <div className="animate-fade-in" style={{ background: 'var(--background)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h3 style={{ color: 'var(--secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} /> Setup Complete
                  </h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    Save these emergency recovery codes in a secure password manager. Each code can only be used once if you lose access to your authenticator.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--surface)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace' }}>
                    {recoveryCodes.map((code, idx) => (
                      <div key={idx} style={{ color: 'var(--text)', fontSize: '16px', letterSpacing: '1px' }}>
                        {code}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setSetupStep('IDLE')}
                    style={{ marginTop: '24px', width: '100%', background: 'var(--surface-hover)', outline: '1px solid var(--border)' }}
                  >
                    I have saved these codes securely
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
