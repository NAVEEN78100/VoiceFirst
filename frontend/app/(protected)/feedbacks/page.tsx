"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { api } from '@/lib/api';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Calendar, 
  Star, 
  Monitor, 
  Smartphone, 
  Globe, 
  MapPin, 
  Map,
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

// --- Types ---

interface Feedback {
  id: string;
  rating: number;
  comment?: string;
  phone?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  createdAt: string;
  branch: { name: string };
  touchpoint: { name: string, type: string };
  case?: { id: string, status: string, priority: string };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Components ---

const StatusIndicator = ({ hasCase }: { hasCase: boolean }) => (
  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${hasCase ? 'bg-orange-500 text-white' : 'bg-green-500/10 text-green-700 border border-green-500/20'}`}>
    {hasCase ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
    {hasCase ? 'Case Opened' : 'No Case'}
  </div>
);

const MetadataBadge = ({ icon: Icon, label }: { icon: any, label?: string }) => (
  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] bg-[var(--surface-hover)] px-2 py-1 rounded-md border border-[var(--border)]">
    <Icon size={10} />
    <span>{label || 'Unknown'}</span>
  </div>
);

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star 
        key={s} 
        size={12} 
        className={s <= rating ? 'fill-orange-400 text-orange-400' : 'text-[var(--border)]'} 
      />
    ))}
  </div>
);

// --- Main Page ---

export default function FeedbackExplorerPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [caseFilter, setCaseFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        rating: ratingFilter === 'ALL' ? undefined : ratingFilter,
        hasCase: caseFilter === 'ALL' ? undefined : caseFilter,
      };
      
      const res: any = await api.get('/feedback/explorer', { params });
      if (res.success && res.data) {
        setFeedbacks(res.data.items || []);
        setMeta(res.data.meta || null);
      } else {
        setFeedbacks([]);
        setMeta(null);
      }
    } catch (err) {
      console.error("Failed to load feedbacks", err);
      setFeedbacks([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, ratingFilter, caseFilter]);

  useEffect(() => {
    if (user) {
      const delayDebounceSelector = setTimeout(() => {
        fetchFeedbacks();
      }, 500);
      return () => clearTimeout(delayDebounceSelector);
    }
  }, [user, fetchFeedbacks]);

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Feedback Explorer</h1>
            <p className="text-[var(--text-muted)] flex items-center gap-2">
              <Info size={16} />
              Analyze individual pulse responses and technical metadata.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input 
                  type="text" 
                  placeholder="Search comments or phone..."
                  className="pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none w-64"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
             </div>
             
             <div className="flex items-center bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)]">
               <button 
                  onClick={() => { setRatingFilter('ALL'); setPage(1); }}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${ratingFilter === 'ALL' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'}`}
                >
                  ALL
                </button>
                {[5, 4, 3, 2, 1].map(r => (
                  <button 
                    key={r} 
                    onClick={() => { setRatingFilter(r); setPage(1); }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${ratingFilter === r ? 'bg-orange-500 text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'}`}
                  >
                    {r} <Star size={10} className={ratingFilter === r ? 'fill-white' : ''} />
                  </button>
                ))}
             </div>

             <select 
               className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
               value={caseFilter}
               onChange={(e) => { setCaseFilter(e.target.value as any); setPage(1); }}
             >
               <option value="ALL">All Status</option>
               <option value="true">Case Created</option>
               <option value="false">No Case</option>
             </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-24 bg-[var(--surface)] border border-[var(--border)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {feedbacks.map((f, index) => (
            <motion.div
              key={f.id}
              layoutId={f.id}
              onClick={() => setSelectedFeedback(f)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--primary)] transition-all cursor-pointer hover:shadow-lg hover:shadow-[var(--primary)]/5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                 {/* Rating & Status */}
                 <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                       <span className={`text-xl font-black ${f.rating <= 2 ? 'text-red-500' : f.rating === 3 ? 'text-orange-400' : 'text-green-500'}`}>
                         {f.rating}.0
                       </span>
                       <StarRating rating={f.rating} />
                    </div>
                    <StatusIndicator hasCase={!!f.case} />
                 </div>

                 {/* Content */}
                 <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                       <span className="text-xs font-bold px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-md">
                         {f.touchpoint?.name}
                       </span>
                       <span className="text-[10px] text-[var(--text-muted)] font-medium">
                         at {f.branch?.name}
                       </span>
                       <span className="text-[10px] text-[var(--text-muted)] border-l border-[var(--border)] pl-2">
                         {format(parseISO(f.createdAt), 'MMM d, h:mm a')}
                       </span>
                    </div>

                    <p className="text-sm text-[var(--text)] line-clamp-2 italic leading-relaxed">
                      "{f.comment || 'No comment provided'}"
                    </p>

                    <div className="flex flex-wrap gap-2">
                       {f.country && (
                         <MetadataBadge icon={MapPin} label={`${f.city || ''}${f.city ? ', ' : ''}${f.country}`} />
                       )}
                       {f.deviceType && (
                         <MetadataBadge icon={f.deviceType === 'mobile' ? Smartphone : Monitor} label={f.deviceType} />
                       )}
                       {f.browser && (
                         <MetadataBadge icon={Globe} label={f.browser} />
                       )}
                    </div>
                 </div>

                 <div className="flex items-center justify-end">
                    <div className="p-2 rounded-full group-hover:bg-[var(--primary)] group-hover:text-white transition-colors text-[var(--text-muted)]">
                       <ExternalLink size={18} />
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}

          {feedbacks.length === 0 && (
            <div className="py-20 text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl">
               <p className="text-[var(--text-muted)]">No feedback entries found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--surface-hover)] transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold">
                Page {page} of {meta.totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--surface-hover)] transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeedback(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              layoutId={selectedFeedback.id}
              className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-[32px] overflow-hidden shadow-2xl shadow-red-500/10"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <h2 className="text-2xl font-bold">Feedback Details</h2>
                         <StatusIndicator hasCase={!!selectedFeedback.case} />
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">Submitted on {format(parseISO(selectedFeedback.createdAt), 'PPPP p')}</p>
                   </div>
                   <button 
                     onClick={() => setSelectedFeedback(null)}
                     className="p-2 hover:bg-[var(--surface-hover)] rounded-full transition-colors"
                   >
                     <ChevronLeft size={24} />
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Source Information</h3>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                               <MapPin size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-bold">{selectedFeedback.touchpoint.name}</p>
                               <p className="text-[10px] text-[var(--text-muted)]">Touchpoint Type: {selectedFeedback.touchpoint.type}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--secondary)]/10 text-[var(--secondary)]">
                               <Map size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-bold">{selectedFeedback.branch.name}</p>
                               <p className="text-[10px] text-[var(--text-muted)]">Branch Location</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Technical Metadata</h3>
                      <div className="grid grid-cols-2 gap-3">
                         <MetadataBadge icon={Globe} label={selectedFeedback.browser} />
                         <MetadataBadge icon={Monitor} label={selectedFeedback.os} />
                         <MetadataBadge icon={Smartphone} label={selectedFeedback.deviceType} />
                         <MetadataBadge icon={ShieldCheck} label={selectedFeedback.ipAddress} />
                         <MetadataBadge icon={MapPin} label={selectedFeedback.city} />
                         <MetadataBadge icon={MapPin} label={selectedFeedback.country} />
                      </div>
                   </div>
                </div>

                <div className="space-y-4 bg-[var(--surface-hover)] p-6 rounded-2xl border border-[var(--border)]">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Customer Response</h3>
                      <div className="flex items-center gap-1 text-orange-400 font-bold">
                         <Star size={14} className="fill-current" />
                         <span>{selectedFeedback.rating}.0 Rating</span>
                      </div>
                   </div>
                   <p className="text-[var(--text)] text-lg leading-relaxed font-medium italic">
                     "{selectedFeedback.comment || 'The customer did not provide a written comment.'}"
                   </p>
                   {selectedFeedback.phone && (
                     <div className="flex items-center gap-2 pt-2 text-xs font-bold text-[var(--primary)]">
                        <Smartphone size={14} />
                        Follow-up requested at {selectedFeedback.phone}
                     </div>
                   )}
                </div>

                {selectedFeedback.case && (
                  <div className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                     <div className="flex items-center gap-4">
                        <ShieldAlert className="text-orange-500" />
                        <div>
                           <p className="text-sm font-bold text-orange-600">Active Service Recovery Case</p>
                           <p className="text-xs text-orange-500/80">Priority: {selectedFeedback.case.priority} | Status: {selectedFeedback.case.status}</p>
                        </div>
                     </div>
                     <button className="text-[10px] font-black uppercase tracking-tighter px-3 py-1 bg-orange-500 text-white rounded-lg">
                        View Case
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
