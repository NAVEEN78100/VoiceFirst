"use client";

import React, { useState } from 'react';
import styles from './login.module.css';
import { Mail, Lock, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const { login, verify2FA, loginState, logout } = useAuth();
  
  // Credentials state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2FA state
  const [code, setCode] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login({ email, password });
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginState.state !== 'REQUIRES_2FA' || !code) return;
    await verify2FA(loginState.tempToken, loginState.method, code);
  };

  const isLoading = loginState.state === 'LOADING';
  const errorMsg = 'message' in loginState ? loginState.message : null;

  return (
    <div className={styles.container}>
      <div className={styles.orb} />
      
      <div className={`${styles.card} animate-slide-up`}>
        <div className={styles.header}>
          <h1 className={styles.logo}>VoiceFirst</h1>
          <p className={styles.subtitle}>
            {loginState.state === 'REQUIRES_2FA' 
              ? 'Security Verification' 
              : 'Secure Internal Operations Console'}
          </p>
        </div>

        {errorMsg && (
          <div className={`${styles.errorBox} animate-fade-in`}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loginState.state !== 'REQUIRES_2FA' ? (
          /* --- LOGIN FORM --- */
          <form onSubmit={handleLoginSubmit} className="animate-fade-in">
            <div className={styles.formGroup}>
              <label className={styles.label}>Corporate Email</label>
              <div className={styles.inputIconWrapper}>
                <Mail size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@voicefirst.com"
                  className={styles.iconInput}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputIconWrapper}>
                <Lock size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={styles.iconInput}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={styles.submitBtn}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Authenticate Access'}
            </button>
          </form>
        ) : (
          /* --- 2FA VERIFICATION FORM --- */
          <form onSubmit={handle2FASubmit} className="animate-fade-in">
            <div style={{ textAlign: 'center' }}>
              <div className={styles.twoFactorMethodBadge}>
                {loginState.method === 'EMAIL' ? 'Email OTP Sent' : 'Authenticator App'}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Verification Code</label>
              <div className={styles.inputIconWrapper}>
                <Shield size={18} />
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                  placeholder={loginState.method === 'EMAIL' ? '6-digit OTP' : 'Authenticator Code'}
                  className={styles.iconInput}
                  autoComplete="one-time-code"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading || code.length < 4} className={styles.submitBtn}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify Identity'}
            </button>

            <button type="button" onClick={logout} className={styles.backBtn}>
              Cancel & Return to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
