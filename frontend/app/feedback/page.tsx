"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Star, MessageSquare, Phone, Send, CheckCircle2, AlertCircle, Loader2, List, Tag, Share, ArrowRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'Account services',
  'Transfers / Payments',
  'Cards / ATM / POS',
  'Customer support / Assistance',
  'Digital services (App / USSD / Online)',
  'Other'
];

const ISSUE_TAGS = [
  'Service quality',
  'Waiting time',
  'Staff interaction',
  'ATM / Device issue',
  'Other'
];

function FeedbackForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const messageToken = searchParams.get('m');
  const caseId = searchParams.get('c');

  // Multi-step State
  const [step, setStep] = useState(1);
  
  // Form Data
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [serviceCategory, setServiceCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [comment, setComment] = useState('');
  const [wantsFollowUp, setWantsFollowUp] = useState<boolean | null>(null);
  const [phone, setPhone] = useState('');

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [touchpointInfo, setTouchpointInfo] = useState<{ name: string, branch?: { name: string } } | null>(null);
  const [toastData, setToastData] = useState<{title: string, msg: string} | null>(null);

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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (rating === 0) {
        setErrorMessage("Please select a rating.");
        return;
      }
      if (!serviceCategory) {
        setErrorMessage("Please select a service category.");
        return;
      }
      setErrorMessage("");
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating <= 2 && wantsFollowUp === true && (!phone || phone.trim().length < 8)) {
      setErrorMessage("Please provide a valid phone number for follow-up.");
      return;
    }

    if (!token) {
      setErrorMessage("Invalid feedback link. No touchpoint identified.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response: any = await api.post('/feedback', {
        rating,
        issueTopic: serviceCategory, // Legacy fallback
        serviceCategory, // New BRD schema
        issueTags: selectedTags.join(', '), // New BRD schema
        followUpRequested: wantsFollowUp || false, // New BRD schema
        trackType: phone ? 'IDENTIFIED' : 'ANONYMOUS', // New BRD schema
        channel: 'QR', // New BRD schema
        comment: comment.trim() ? comment.trim() : undefined,
        phone: phone.trim() ? phone.trim() : undefined,
        touchpointToken: token,
        messageToken: messageToken || undefined,
        caseId: caseId || undefined,
      });
      
      setStatus('SUCCESS');
      setStep(3);
      
      if (response && response.perkPointsAwarded > 0) {
        setToastData({
          title: "🎉 Points Earned!",
          msg: `You earned ${response.perkPointsAwarded} Perk Points for your feedback! (Total: ${response.totalPerkPoints})`
        });
        setTimeout(() => setToastData(null), 6000);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || "Submission failed. Please try again.");
      setStatus('ERROR');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "Poor Experience";
      case 2: return "Needs Improvement";
      case 3: return "Average Service";
      case 4: return "Very Good";
      case 5: return "Outstanding";
      default: return "";
    }
  };

  // --- RENDERING ---

  if (step === 3) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          textAlign: 'center', padding: '60px 32px', background: 'white',
          borderRadius: '32px', border: '1px solid var(--border)', maxWidth: '460px', margin: '40px auto',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ display: 'inline-flex', background: 'var(--surface-hover)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
          <CheckCircle2 size={56} color="var(--primary)" />
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '16px', color: 'var(--text)' }}>
          {rating <= 2 ? "We Hear You." : rating === 3 ? "Thank You!" : "We're Thrilled!"}
        </h1>
        
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '16px', marginBottom: '40px' }}>
          {rating <= 2 
            ? "We apologize for the inconvenience. Your concern has been instantly escalated to management for urgent review." 
            : rating === 3 
            ? "We appreciate your time. Your feedback will help us improve our services further." 
            : "Thank you for the fantastic rating! It's our pleasure to serve you."}
        </p>

        {rating >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ marginBottom: '32px', padding: '24px', background: 'var(--surface-hover)', borderRadius: '24px' }}
          >
            <p style={{ fontWeight: '700', marginBottom: '16px', fontSize: '15px' }}>Help us spread the word?</p>
            <button style={{ width: '100%', background: 'white', color: 'var(--text)', border: '1px solid var(--border)', padding: '16px', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Share size={18} /> Share on Google Reviews
            </button>
          </motion.div>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px' }}
        >
          Submit Another Response
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px', position: 'relative', zIndex: 1 }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px', marginBottom: '4px' }}>
          AFRILAND FIRST BANK
        </h1>
        {touchpointInfo && (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>
            {touchpointInfo.branch?.name} — {touchpointInfo.name}
          </div>
        )}
      </header>

      <div style={{ 
        background: 'white', border: '1px solid var(--border)', borderRadius: '32px', padding: '40px 32px',
        boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Progress Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: 'var(--surface-hover)' }}>
          <motion.div 
            initial={{ width: '50%' }}
            animate={{ width: step === 1 ? '50%' : '100%' }}
            style={{ height: '100%', background: 'var(--primary)', borderRadius: '0 4px 4px 0' }}
          />
        </div>

        {step > 1 && (
          <button 
            onClick={() => setStep(1)} type="button"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', marginBottom: '24px', fontSize: '13px' }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}

        {/* STEP 1: RATING & CATEGORIES */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', textAlign: 'center', marginBottom: '32px' }}>How was your experience?</h2>
            
            {/* 5-Star Rating */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s} type="button"
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(s)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <Star 
                    size={42} 
                    fill={(hoveredRating || rating) >= s ? '#F59E0B' : 'var(--surface-hover)'} 
                    color={(hoveredRating || rating) >= s ? '#F59E0B' : 'var(--surface-hover)'}
                    style={{ transition: 'all 0.2s' }}
                  />
                </button>
              ))}
            </div>
            
            <div style={{ textAlign: 'center', height: '24px', marginBottom: '40px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px' }}>
               {getRatingLabel(hoveredRating || rating)}
            </div>

            <AnimatePresence>
              {rating > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  {/* Service Category */}
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '800' }}>
                      SERVICE CATEGORY
                    </label>
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      style={{ 
                        width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--surface)', 
                        border: '2px solid', borderColor: serviceCategory ? 'var(--primary)' : 'var(--surface-hover)', 
                        color: 'var(--text)', outline: 'none', fontSize: '15px', fontWeight: '600',
                        appearance: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>Select the service received...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Issue Tags (Chips) */}
                  <div style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '800' }}>
                      WHAT STOOD OUT? (Optional)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {ISSUE_TAGS.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag} type="button" onClick={() => toggleTag(tag)}
                            style={{
                              padding: '10px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid',
                              cursor: 'pointer', transition: 'all 0.2s',
                              background: isSelected ? 'var(--primary-glow)' : 'var(--surface)',
                              borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                              color: isSelected ? 'var(--primary)' : 'var(--text-muted)'
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleNext} type="button"
                    style={{ 
                      width: '100%', padding: '20px', borderRadius: '20px', background: 'var(--text)', color: 'white', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    CONTINUE <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* STEP 2: DETAILS & FOLLOW-UP */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Any additional details?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Your feedback helps us improve.</p>

            <div style={{ marginBottom: '32px' }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what happened (Optional)"
                style={{ 
                  width: '100%', height: '120px', padding: '20px', borderRadius: '20px', background: 'var(--surface-hover)', 
                  border: 'none', color: 'var(--text)', resize: 'none', outline: 'none', fontSize: '15px', fontWeight: '500'
                }}
              />
            </div>

            {/* CONDITIONAL FOLLOW-UP FOR 1-2 STARS */}
            {rating <= 2 && (
              <div style={{ marginBottom: '40px', padding: '24px', background: 'var(--primary-glow)', borderRadius: '20px', border: '1px solid rgba(200, 16, 46, 0.2)' }}>
                <p style={{ fontWeight: '800', color: 'var(--primary)', marginBottom: '16px', fontSize: '15px' }}>
                  Would you like us to follow up on this issue?
                </p>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: wantsFollowUp ? '24px' : '0' }}>
                  <button type="button" onClick={() => setWantsFollowUp(true)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid', borderColor: wantsFollowUp === true ? 'var(--primary)' : 'rgba(200, 16, 46, 0.2)', background: wantsFollowUp === true ? 'var(--primary)' : 'white', color: wantsFollowUp === true ? 'white' : 'var(--primary)', fontWeight: '800', cursor: 'pointer' }}>
                    Yes, contact me
                  </button>
                  <button type="button" onClick={() => { setWantsFollowUp(false); setPhone(''); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid', borderColor: wantsFollowUp === false ? 'var(--text-muted)' : 'var(--border)', background: wantsFollowUp === false ? 'var(--text-muted)' : 'white', color: wantsFollowUp === false ? 'white' : 'var(--text-muted)', fontWeight: '800', cursor: 'pointer' }}>
                    No, just sharing
                  </button>
                </div>

                <AnimatePresence>
                  {wantsFollowUp && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--primary)', marginBottom: '12px', fontWeight: '800' }}>
                        <Phone size={14} /> PHONE NUMBER
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter mobile number"
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(200, 16, 46, 0.3)', outline: 'none', fontSize: '15px', fontWeight: '600' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {errorMessage && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', marginBottom: '24px' }}>
                <AlertCircle size={16} /> {errorMessage}
              </div>
            )}

            <button
              onClick={handleSubmit} type="button" disabled={submitting}
              style={{ width: '100%', padding: '20px', borderRadius: '20px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {submitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
            </button>
          </motion.div>
        )}
      </div>

      <footer style={{ marginTop: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.6 }}>
          SECURE CONNECTION &bull; AFRILAND FIRST BANK
        </p>
      </footer>
      
      {/* Perk Points Toast Notification */}
      <AnimatePresence>
        {toastData && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            style={{ 
              position: 'fixed', bottom: '40px', left: '50%', zIndex: 9999,
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '16px 24px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '16px',
              minWidth: '320px'
            }}
          >
            <div style={{ background: 'rgba(200, 16, 46, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '50%' }}>
              <Star size={24} fill="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '15px', color: 'var(--text)' }}>{toastData.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{toastData.msg}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>Loading interface...</div>}>
        <FeedbackForm />
      </Suspense>
    </main>
  );
}
