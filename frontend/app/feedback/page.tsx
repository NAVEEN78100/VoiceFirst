"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Star, MessageSquare, Phone, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function FeedbackForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const messageToken = searchParams.get('m');
  const caseId = searchParams.get('c');

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a rating before submitting.");
      setStatus('ERROR');
      return;
    }

    if (!token) {
      setErrorMessage("Invalid feedback link. No touchpoint identified.");
      setStatus('ERROR');
      return;
    }

    setSubmitting(true);
    setStatus('IDLE');

    try {
      await api.post('/feedback', {
        rating,
        comment: comment || undefined,
        phone: phone || undefined,
        touchpointToken: token,
        messageToken: messageToken || undefined,
        caseId: caseId || undefined,
      });
      setStatus('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
      setStatus('ERROR');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'SUCCESS') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '60px 20px' }}
      >
        <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
          <CheckCircle2 size={64} color="#10b981" />
        </div>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text)' }}>Thank You!</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6', fontSize: '18px' }}>
          Your feedback has been recorded securely. It helps us improve our service every day.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setRating(0);
            setComment('');
            setPhone('');
            setStatus('IDLE');
          }}
          style={{ marginTop: '40px', padding: '12px 32px', background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Submit another response
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          VoiceFirst
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>How was your experience today?</p>
      </header>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <form onSubmit={handleSubmit}>
          {/* Rating Stars */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Your Rating
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.8 }}
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(s)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <Star 
                    size={40} 
                    fill={(hoveredRating || rating) >= s ? '#f59e0b' : 'transparent'} 
                    color={(hoveredRating || rating) >= s ? '#f59e0b' : 'var(--border)'}
                    style={{ transition: 'fill 0.2s, color 0.2s' }}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <MessageSquare size={16} /> Tell us more (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could we do better?"
              style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', resize: 'none', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <Phone size={16} /> Phone number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 890"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Only required for follow-up on critical issues.</p>
          </div>

          <AnimatePresence>
            {status === 'ERROR' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}
              >
                <AlertCircle size={18} /> {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={submitting}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
              color: 'white', 
              border: 'none', 
              fontWeight: 'bold', 
              fontSize: '16px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              opacity: submitting || !token ? 0.7 : 1,
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)'
            }}
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {submitting ? 'Submitting...' : 'Send Feedback'}
          </button>
        </form>
      </div>

      <footer style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        &copy; 2026 VoiceFirst Architecture &bull; All Rights Reserved
      </footer>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
        <FeedbackForm />
      </Suspense>
    </main>
  );
}
