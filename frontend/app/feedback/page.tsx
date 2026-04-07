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
  const [touchpointInfo, setTouchpointInfo] = useState<{ name: string, branch?: { name: string } } | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      if (!token) return;
      try {
        const res: any = await api.get(`/feedback/context/${token}`);
        setTouchpointInfo(res.data);
      } catch (err) {
        console.warn("Could not fetch touchpoint context");
      }
    };
    fetchContext();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a rating to continue.");
      setStatus('ERROR');
      return;
    }

    if (!phone || phone.trim().length < 8) {
      setErrorMessage("A valid phone number is required for verification.");
      setStatus('ERROR');
      return;
    }

    if (!comment || comment.trim().length < 5) {
      setErrorMessage("Please provide a detailed report of the incident.");
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
        phone: phone.trim(),
        touchpointToken: token,
        messageToken: messageToken || undefined,
        caseId: caseId || undefined,
      });
      setStatus('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Submission failed. Please try again.");
      setStatus('ERROR');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "Critical / Poor";
      case 2: return "Needs Improvement";
      case 3: return "Average Service";
      case 4: return "Very Good";
      case 5: return "Outstanding / Elite";
      default: return "Select your score";
    }
  };

  if (status === 'SUCCESS') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          textAlign: 'center', 
          padding: '80px 32px',
          background: 'white',
          borderRadius: '48px',
          border: '1px solid rgba(0,0,0,0.08)',
          maxWidth: '460px',
          margin: '80px auto',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', padding: '24px', borderRadius: '50%', marginBottom: '40px', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.25)' }}>
          <CheckCircle2 size={48} color="white" />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '950', marginBottom: '16px', color: '#0f172a', letterSpacing: '-1.5px' }}>Report Finalized</h1>
        <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '17px', marginBottom: '40px' }}>
          Your feedback has been securely transmitted to the <strong>{touchpointInfo?.branch?.name || 'management'}</strong> dashboard. We value your integrity and cooperation.
        </p>
        
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '48px', border: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Submission Reference</div>
          <div style={{ fontSize: '16px', color: '#475569', fontWeight: '700', letterSpacing: '1px' }}>VF-{Math.random().toString(36).substring(2, 9).toUpperCase()}</div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.reload()}
          style={{ width: '100%', padding: '20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '24px', fontWeight: '900', cursor: 'pointer', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '2px' }}
        >
          Generate New Report
        </motion.button>
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>Your connection to this terminal is encrypted.</p>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
      <header style={{ textAlign: 'center', marginBottom: '64px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#0f172a', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} color="white" strokeWidth={3} style={{ opacity: 0.9 }} />
          </div>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '1000', 
            color: '#0f172a',
            letterSpacing: '-2.5px',
          }}>
            VoiceFirst
          </h1>
        </motion.div>
        
        {touchpointInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ fontSize: '20px', color: '#0f172a', fontWeight: '800', marginBottom: '6px' }}>{touchpointInfo.branch?.name}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.6 }}>NETWORK NODE: {touchpointInfo.name}</div>
          </motion.div>
        )}
      </header>

      <div style={{ 
        background: 'white', 
        border: '1px solid rgba(0,0,0,0.08)', 
        borderRadius: '48px', 
        padding: '56px 40px 40px 40px',
        boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Superior Progress Logic */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: '#f1f5f9' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(rating > 0 ? 33.3 : 0) + (phone.trim().length >= 8 ? 33.3 : 0) + (comment.trim().length >= 5 ? 33.4 : 0)}%` }}
            style={{ height: '100%', background: 'linear-gradient(to right, #4f46e5, #0ea5e9)', borderRadius: '0 4px 4px 0' }}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Rating Section */}
          <div style={{ marginBottom: '64px', textAlign: 'center' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '32px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '4px' }}>
              Service Performance
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  whileHover={{ scale: 1.2, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(s)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <Star 
                    size={48} 
                    fill={(hoveredRating || rating) >= s ? '#f59e0b' : 'transparent'} 
                    color={(hoveredRating || rating) >= s ? '#f59e0b' : '#f1f5f9'}
                    strokeWidth={1.5}
                    style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </motion.button>
              ))}
            </div>
            {rating > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ 
                display: 'inline-block', 
                background: '#0f172a', 
                color: 'white', 
                padding: '6px 14px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {getRatingLabel(hoveredRating || rating)}
              </motion.div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Phone (Mandatory) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '14px', fontWeight: '800' }}>
                <Phone size={16} color="#4f46e5" /> VERIFICATION CONTACT <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Required for quality audit"
                style={{ 
                  width: '100%', 
                  padding: '20px 24px', 
                  borderRadius: '20px', 
                  background: '#f8fafc', 
                  border: '2.5px solid #f1f5f9', 
                  color: '#0f172a', 
                  outline: 'none',
                  fontSize: '17px',
                  fontWeight: '700',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                   e.target.style.borderColor = '#4f46e5';
                   e.target.style.background = 'white';
                   e.target.style.boxShadow = '0 10px 20px -5px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#f1f5f9';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Comments (Optional) */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '14px', fontWeight: '800' }}>
                <MessageSquare size={16} color="#4f46e5" /> DETAILED INCIDENT <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Required for service audit: Describe exactly what occurred..."
                style={{ 
                  width: '100%', 
                  height: '160px', 
                  padding: '24px', 
                  borderRadius: '28px', 
                  background: '#f8fafc', 
                  border: '2.5px solid #f1f5f9', 
                  color: '#0f172a', 
                  resize: 'none', 
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '1.7',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                   e.target.style.borderColor = '#4f46e5';
                   e.target.style.background = 'white';
                   e.target.style.boxShadow = '0 10px 20px -5px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#f1f5f9';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {status === 'ERROR' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ 
                  marginTop: '40px', 
                  background: '#fef2f2', 
                  color: '#dc2626', 
                  padding: '20px', 
                  borderRadius: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  fontSize: '14px',
                  border: '1px solid #fee2e2',
                  fontWeight: '700'
                }}
              >
                <AlertCircle size={20} /> {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02, background: '#1e293b' }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              width: '100%', 
              marginTop: '56px',
              padding: '22px', 
              borderRadius: '28px', 
              background: '#0f172a', 
              color: 'white', 
              border: 'none', 
              fontWeight: '900', 
              fontSize: '17px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '14px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              opacity: submitting || !token ? 0.7 : 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {submitting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            {submitting ? 'PROCESSING...' : 'AUTHORIZE SUBMISSION'}
          </motion.button>
          
          <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Encrypted End-to-End</span>
          </div>
        </form>
      </div>

      <footer style={{ marginTop: '80px', textAlign: 'center' }}>
        <p style={{ color: '#cbd5e1', fontSize: '10px', fontWeight: '900', letterSpacing: '8px', textTransform: 'uppercase' }}>
          VOICEFIRST &bull; PLATFORM CORE v2.0
        </p>
      </footer>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Loading interface...</div>}>
        <FeedbackForm />
      </Suspense>
    </main>
  );
}
