"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Settings, LogOut, LayoutDashboard, MapPin, Map, ShieldAlert, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import RealtimeNotifications from '@/components/RealtimeNotifications';

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
        width: '280px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '900', 
            color: 'var(--primary)', 
            letterSpacing: '-0.5px' 
          }}>
            VoiceFirst
          </h2>
          <div style={{ 
            marginTop: '4px',
            fontSize: '11px', 
            textTransform: 'uppercase', 
            color: 'var(--text-muted)', 
            letterSpacing: '1.5px', 
            fontWeight: '700',
            opacity: 0.8
          }}>
            {user.role} PANEL
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link href="/dashboard" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text)', borderRadius: '12px', transition: 'all 0.2s', fontWeight: '500' }}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/branches" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text)', borderRadius: '12px', transition: 'all 0.2s', fontWeight: '500' }}>
            <Map size={20} /> Branches
          </Link>
          <Link href="/touchpoints" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text)', borderRadius: '12px', transition: 'all 0.2s', fontWeight: '500' }}>
            <MapPin size={20} /> Touchpoints
          </Link>
          <Link href="/cases" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text)', borderRadius: '12px', transition: 'all 0.2s', fontWeight: '500' }}>
            <ShieldAlert size={20} /> Internal Cases
          </Link>
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <Link href="/staff" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text)', borderRadius: '12px', transition: 'all 0.2s', fontWeight: '500' }}>
              <Users size={20} /> Team Members
            </Link>
          )}
          {(user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'CX') && (
            <Link href="/feedbacks" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text)', borderRadius: '12px', transition: 'all 0.2s', fontWeight: '500' }}>
              <MessageSquare size={20} /> Feedbacks
            </Link>
          )}
          <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />
          <Link href="/settings" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-muted)', borderRadius: '12px', transition: 'all 0.2s', fontWeight: '500' }}>
            <Settings size={20} /> Settings
          </Link>
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: 'auto' }}>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Internal Staff
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px', 
              background: 'var(--surface-hover)', 
              color: 'var(--danger)', 
              borderRadius: '12px',
              border: '1px solid var(--border)',
              fontWeight: '600'
            }}
          >
            <LogOut size={18} /> Logout
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
