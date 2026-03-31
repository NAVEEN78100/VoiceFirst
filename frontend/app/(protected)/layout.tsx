"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Settings, LogOut, LayoutDashboard, MapPin, Map, ShieldAlert, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Synchronizing Identity...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--text)', background: 'linear-gradient(to right, #6366f1, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            VoiceFirst Hub
          </h2>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: 'bold' }}>
            {user.role} Privilege
          </span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: 'var(--text)', borderRadius: '8px', transition: 'background 0.2s' }}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/branches" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: 'var(--text)', borderRadius: '8px', transition: 'background 0.2s' }}>
            <Map size={18} /> Branches
          </Link>
          <Link href="/touchpoints" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: 'var(--text)', borderRadius: '8px', transition: 'background 0.2s' }}>
            <MapPin size={18} /> Touchpoints
          </Link>
          <Link href="/cases" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: 'var(--text)', borderRadius: '8px', transition: 'background 0.2s', borderLeft: '3px solid #ef4444' }}>
            <ShieldAlert size={18} color="#ef4444" /> Internal Cases
          </Link>
          {(user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'CX') && (
            <Link href="/feedbacks" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: 'var(--text)', borderRadius: '8px', transition: 'background 0.2s' }}>
              <MessageSquare size={18} /> Feedbacks
            </Link>
          )}
          <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', color: 'var(--text-muted)', borderRadius: '8px', transition: 'background 0.2s' }}>
            <Settings size={18} /> Settings
          </Link>
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: 'auto' }}>
          <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {user.email}
          </div>
          <button 
            onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}
          >
            <LogOut size={18} /> Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px', position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
