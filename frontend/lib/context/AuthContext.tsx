"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../api';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CX = 'CX',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  branchId?: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginState: LoginState;
  login: (credentials: any) => Promise<void>;
  verify2FA: (tempToken: string, method: string, code: string) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
}

export type LoginState = 
  | { state: 'IDLE' }
  | { state: 'LOADING' }
  | { state: 'REQUIRES_2FA'; tempToken: string; method: string }
  | { state: 'SUCCESS' }
  | { state: 'ERROR'; message: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginState, setLoginState] = useState<LoginState>({ state: 'IDLE' });
  const router = useRouter();
  const pathname = usePathname();

  // Load user on mount seamlessly through cookies
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response: any = await api.get('/users/me');
        setUser(response.data);
      } catch (err) {
        if (pathname.includes('/dashboard') || pathname.includes('/settings')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const login = async (credentials: any) => {
    setLoginState({ state: 'LOADING' });
    try {
      const res: any = await api.post('/auth/login', credentials);
      const data = res.data;

      if (data.requiresTwoFactor) {
        setLoginState({
          state: 'REQUIRES_2FA',
          tempToken: data.tempToken,
          method: data.twoFactorMethod || 'TOTP',
        });
      } else {
        setUser(data.user);
        setLoginState({ state: 'SUCCESS' });
        router.push('/dashboard');
      }
    } catch (err: any) {
      setLoginState({ state: 'ERROR', message: err.message || 'Login failed' });
    }
  };

  const verify2FA = async (tempToken: string, method: string, code: string) => {
    setLoginState({ state: 'LOADING' });
    try {
      const res: any = await api.post('/auth/verify-2fa', { tempToken, method, code });
      const data = res.data;
      
      setUser(data.user);
      setLoginState({ state: 'SUCCESS' });
      router.push('/dashboard');
    } catch (err: any) {
      setLoginState({ 
        state: 'REQUIRES_2FA', 
        tempToken, 
        method, 
        // We'll hijack tempToken or just let login/page.tsx read error.
        // Wait, LoginState type doesn't have `message` on REQUIRES_2FA.
        // Let's just set the error via alert or standard ERROR state, but wait:
        // By setting state back to REQUIRES_2FA, it prevents dropping the UI back to login!
      });
      alert(err.message || 'Verification failed. Try again.');
    }
  };

  const reloadUser = async () => {
    try {
      const response: any = await api.get('/users/me');
      setUser(response.data);
    } catch (err) {
      console.error("Failed to reload user", err);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch(e) {
      console.error(e);
    }
    setUser(null);
    setLoginState({ state: 'IDLE' });
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginState, login, verify2FA, logout, reloadUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
