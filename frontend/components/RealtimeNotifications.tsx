"use client";

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Info, X } from 'lucide-react';

interface FeedbackEvent {
  feedbackId: string;
  rating: number;
  hasPhone: boolean;
  issueTopic?: string;
  commentPreview?: string;
  submittedAt: string;
}

export default function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<FeedbackEvent[]>([]);

  useEffect(() => {
    // Establish Server-Sent Events Connection
    // URL relative to our defined backend
    const backendHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const sseUrl = `http://${backendHost}:3001/api/v1/events/notifications`;
    
    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as FeedbackEvent;
        // Add to front of list
        setNotifications((prev) => [payload, ...prev].slice(0, 5)); // Keep last 5 max

        // Auto-remove after 8 seconds unless critical
        if (payload.rating > 2) {
          setTimeout(() => {
            setNotifications((prev) => prev.filter(n => n.feedbackId !== payload.feedbackId));
          }, 8000);
        }
      } catch (err) {
        console.error("Failed to parse SSE", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter(n => n.feedbackId !== id));
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      zIndex: 9999,
      maxWidth: '380px'
    }}>
      <AnimatePresence>
        {notifications.map((notif) => {
          const isCritical = notif.rating <= 2;
          
          return (
            <motion.div
              key={notif.feedbackId}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                background: isCritical ? '#fef2f2' : 'var(--surface)',
                border: `1px solid ${isCritical ? '#fecaca' : 'var(--border)'}`,
                boxShadow: isCritical 
                  ? '0 20px 40px -10px rgba(220, 38, 38, 0.25)' 
                  : '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => removeNotification(notif.feedbackId)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isCritical ? '#f87171' : 'var(--text-muted)'
                }}
              >
                <X size={16} />
              </button>

              <div style={{
                background: isCritical ? '#fee2e2' : 'var(--surface-hover)',
                color: isCritical ? '#dc2626' : 'var(--primary)',
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isCritical ? <ShieldAlert size={28} /> : <Info size={28} />}
              </div>
              
              <div style={{ flex: 1, paddingRight: '16px' }}>
                <h4 style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '15px', 
                  fontWeight: '800',
                  color: isCritical ? '#991b1b' : 'var(--text)'
                }}>
                  {isCritical ? 'Critical Incident Logged' : 'New Feedback Received'}
                </h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ 
                    background: isCritical ? '#ef4444' : 'var(--primary)', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: '800' 
                  }}>
                    {notif.rating} Star Rating
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    Topic: {notif.issueTopic || 'General'}
                  </span>
                </div>

                <p style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  color: isCritical ? '#b91c1c' : 'var(--text-muted)',
                  lineHeight: '1.5'
                }}>
                  "{notif.commentPreview}"
                </p>
                
                {isCritical && (
                  <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: '700', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }} /> Immediate Review Required
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
