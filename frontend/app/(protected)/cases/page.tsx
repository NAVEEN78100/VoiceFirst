"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { api } from '@/lib/api';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  MoreVertical, 
  Phone, 
  Search,
  MessageSquare,
  ArrowRight,
  X,
  Smartphone,
  Globe,
  Calendar,
  CalendarClock,
  MapPin,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

// --- Types ---

export enum CaseStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum CasePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

interface Case {
  id: string;
  feedbackId: string;
  branchId: string;
  touchpointId: string;
  rating: number;
  priority: CasePriority;
  status: CaseStatus;
  canContact: boolean;
  notes?: string;
  createdAt: string;
  feedback: {
    comment?: string;
    issueTopic?: string;
    phone?: string;
    ipAddress?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    createdAt?: string;
    touchpoint: { name: string; type?: string; };
  };
}

// --- Components ---

const StatusPill = ({ status }: { status: CaseStatus }) => {
  const styles: any = {
    [CaseStatus.NEW]: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    [CaseStatus.ACKNOWLEDGED]: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    [CaseStatus.IN_PROGRESS]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    [CaseStatus.RESOLVED]: 'bg-green-500/10 text-green-500 border-green-500/20',
    [CaseStatus.CLOSED]: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const PriorityPill = ({ priority }: { priority: CasePriority }) => {
  const styles: any = {
    [CasePriority.CRITICAL]: 'bg-red-500 text-white shadow-lg shadow-red-500/20',
    [CasePriority.HIGH]: 'bg-orange-500 text-white',
    [CasePriority.MEDIUM]: 'bg-slate-500 text-white',
    [CasePriority.LOW]: 'bg-[var(--text-muted)] text-white',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${styles[priority]}`}>
      {priority}
    </span>
  );
};

// --- Main Page ---

export default function CasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/cases');
        setCases(Array.isArray(res.data) ? res.data : (res as any));
      } catch (err) {
        console.error("Failed to load cases", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchCases();
  }, [user]);

  const filteredCases = cases.filter(c => {
    const tpName = c.feedback?.touchpoint?.name || '';
    const comment = c.feedback?.comment || '';
    const matchesSearch = tpName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (id: string, currentStatus: CaseStatus) => {
    const transitionMap: Record<CaseStatus, CaseStatus | null> = {
      [CaseStatus.NEW]: CaseStatus.ACKNOWLEDGED,
      [CaseStatus.ACKNOWLEDGED]: CaseStatus.IN_PROGRESS,
      [CaseStatus.IN_PROGRESS]: CaseStatus.RESOLVED,
      [CaseStatus.RESOLVED]: CaseStatus.CLOSED,
      [CaseStatus.CLOSED]: null,
    };

    const nextStatus = transitionMap[currentStatus];
    if (!nextStatus) return;

    try {
      await api.patch(`/cases/${id}`, { status: nextStatus, notes: `Promoted from ${currentStatus} via dashboard.` });
      setCases(cases.map(c => c.id === id ? { ...c, status: nextStatus } : c));
    } catch (err: any) {
      alert(err.message || "Invalid state transition");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Service Recovery</h1>
          <p className="text-[var(--text-muted)] flex items-center gap-2">
            <Clock size={16} />
            Manage and resolve automated follow-up assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search by touchpoint..."
              className="pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] overflow-x-auto">
             {['ALL', ...Object.values(CaseStatus)].map(s => (
               <button 
                 key={s} 
                 onClick={() => setStatusFilter(s as any)}
                 className={`px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all whitespace-nowrap ${statusFilter === s ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'}`}
               >
                 {s}
               </button>
             ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 bg-[var(--surface)] border border-[var(--border)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredCases.map((c, index) => (
              <motion.div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--primary)]/50 transition-all hover:shadow-xl hover:shadow-[var(--primary)]/5 cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Left: Metadata */}
                  <div className="min-w-[140px] flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2">
                     <PriorityPill priority={c.priority} />
                     <StatusPill status={c.status} />
                  </div>

                  {/* Center: Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                      <span className="text-[var(--primary)]">#{index + 1}</span>
                      {c.feedback.touchpoint.name}
                      <span className="text-[var(--text-muted)] font-normal text-xs px-2 border-l border-[var(--border)]">
                        {format(parseISO(c.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    
                    {c.feedback.issueTopic && (
                      <div className="text-xs font-bold text-[var(--text-muted)] mt-1 bg-[var(--surface-hover)] inline-block px-2 py-0.5 rounded-md border border-[var(--border)]">
                        Topic: {c.feedback.issueTopic}
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                       <MessageSquare size={16} className="text-[var(--text-muted)] mt-1 flex-shrink-0" />
                       <p className="text-sm text-[var(--text-muted)] italic leading-relaxed line-clamp-2">
                          "{c.feedback.comment || 'No comment provided'}"
                       </p>
                    </div>

                    {c.canContact && (
                       <div className="flex items-center gap-2 pt-1">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--secondary)]/10 text-[var(--secondary)] text-[10px] font-bold">
                             <Phone size={10} />
                             {c.feedback.phone}
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)]">Customer authorized follow-up</span>
                       </div>
                    )}
                    
                    {/* Phase 4: Recovery Delta Reporting */}
                    {(c.recoveryDelta !== undefined && c.recoveryDelta !== null) && (
                      <div className="mt-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                          <div className="bg-white p-1 rounded-md shadow-sm text-[var(--primary)] border border-red-100">
                             Follow-Up Rating: {c.followUpRating} / 5
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-0.5">Recovery Delta</span>
                           <span className={`text-sm font-black flex items-center gap-1 ${c.recoveryDelta > 0 ? 'text-green-600' : c.recoveryDelta < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                             {c.recoveryDelta > 0 ? '+' : ''}{c.recoveryDelta}
                             {c.recoveryDelta > 0 ? <TrendingUp size={14} /> : c.recoveryDelta < 0 ? <TrendingDown size={14} /> : null}
                           </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 lg:border-l border-[var(--border)] lg:pl-6">
                     <div className="flex flex-col items-center">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-tighter mb-1">Impact</span>
                        <div className="flex items-center gap-1 text-[var(--danger)]">
                           <AlertCircle size={14} />
                           <span className="font-black text-lg">{c.rating}</span>
                        </div>
                     </div>
                     
                     {c.status !== CaseStatus.CLOSED && (
                       <button 
                         onClick={(e) => { e.stopPropagation(); updateStatus(c.id, c.status); }}
                         className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[var(--primary)]/20 active:scale-95"
                       >
                         {c.status === CaseStatus.RESOLVED ? 'Close Case' : 'Progress'}
                         <ArrowRight size={14} />
                       </button>
                     )}

                     <button 
                       onClick={(e) => e.stopPropagation()} 
                       className="p-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-muted)] border border-transparent hover:border-[var(--border)]"
                     >
                        <MoreVertical size={18} />
                     </button>
                  </div>
                </div>

                {/* Staggered load animation gradient */}
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && filteredCases.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl">
              <div className="p-6 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)]">
                 <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Clean Slate!</h3>
                <p className="text-[var(--text-muted)]">No open cases match your current filters.</p>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Detailed Modal */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCase(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--surface-hover)]/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[var(--text)] tracking-tight">Case Details</h2>
                    <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 uppercase tracking-widest">
                      {selectedCase.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Status & Priority Row */}
                <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-[var(--border)]">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Current Status</span>
                    <StatusPill status={selectedCase.status} />
                  </div>
                  <div className="w-px h-8 bg-[var(--border)] mx-2" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Priority</span>
                    <PriorityPill priority={selectedCase.priority} />
                  </div>
                  <div className="w-px h-8 bg-[var(--border)] mx-2" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Customer Rating</span>
                    <div className="flex items-center gap-1.5">
                       <AlertCircle size={16} className="text-[var(--danger)]" />
                       <span className="font-black text-[var(--danger)] text-lg leading-none">{selectedCase.rating}/5</span>
                    </div>
                  </div>
                </div>

                {/* Deep Context */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-[var(--text-muted)] group">
                         <CalendarClock size={16} className="group-hover:text-[var(--primary)] transition-colors" />
                         <span className="text-xs font-bold uppercase tracking-wider">Timestamp</span>
                       </div>
                       <p className="text-sm font-semibold text-[var(--text)] pl-6">
                         {format(parseISO(selectedCase.feedback.createdAt || selectedCase.createdAt), 'PPPP p')}
                       </p>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-[var(--text-muted)] group">
                         <MessageSquare size={16} className="group-hover:text-[var(--primary)] transition-colors" />
                         <span className="text-xs font-bold uppercase tracking-wider">Issue Topic</span>
                       </div>
                       <p className="text-sm font-semibold text-[var(--text)] pl-6">
                         {selectedCase.feedback.issueTopic || <span className="text-[var(--text-muted)] italic">General Feedback</span>}
                       </p>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-[var(--text-muted)] group">
                         <Phone size={16} className="group-hover:text-[var(--primary)] transition-colors" />
                         <span className="text-xs font-bold uppercase tracking-wider">Contact Info</span>
                       </div>
                       {selectedCase.feedback.phone ? (
                         <div className="pl-6">
                           <a href={`tel:${selectedCase.feedback.phone}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors rounded-lg text-sm font-bold">
                             {selectedCase.feedback.phone}
                           </a>
                           {selectedCase.canContact && <p className="text-[10px] text-[var(--success)] font-bold mt-1.5">✓ Authorized for callback</p>}
                         </div>
                       ) : (
                         <p className="text-sm font-semibold text-[var(--text-muted)] pl-6 italic">Anonymous Submission</p>
                       )}
                    </div>
                  </div>

                  {/* Right Column (Metadata) */}
                  <div className="space-y-6 bg-[var(--surface-hover)]/30 rounded-2xl p-5 border border-[var(--border)]">
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border)] pb-2 mb-4">Technical Metadata</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-muted)] flex items-center gap-2"><Globe size={14} /> IP Address</span>
                        <span className="font-mono text-[var(--text)]">{selectedCase.feedback.ipAddress || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-muted)] flex items-center gap-2"><Smartphone size={14} /> Device / OS</span>
                        <span className="font-semibold text-[var(--text)]">{selectedCase.feedback.deviceType || 'Desktop'} / {selectedCase.feedback.os || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-muted)] flex items-center gap-2"><MapIcon size={14} /> Source Node</span>
                        <span className="font-bold text-[var(--primary)] px-2 py-0.5 bg-[var(--primary)]/10 rounded-md text-xs">{selectedCase.feedback.touchpoint.name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment Section (Full Width) */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2 text-[var(--text-muted)] pl-1">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Detailed Customer Statement</span>
                  </div>
                  <div className="bg-[var(--surface-hover)]/50 border border-[var(--border)] rounded-2xl p-6 relative">
                    <div className="absolute top-4 left-4 text-[var(--border)] opacity-50 text-4xl font-serif">"</div>
                    <p className="relative z-10 text-[var(--text)] leading-relaxed italic text-[15px] pl-6 min-h-[60px]">
                      {selectedCase.feedback.comment || 'The customer did not provide a written statement for this incident.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-[var(--border)] bg-[var(--surface-hover)]/50 flex flex-wrap justify-between items-center gap-4">
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  Assigned Branch: <span className="text-[var(--text)] font-bold">{selectedCase.branchId}</span>
                </p>
                {selectedCase.status !== CaseStatus.CLOSED && (
                  <button 
                    onClick={() => {
                      updateStatus(selectedCase.id, selectedCase.status);
                      setSelectedCase(null);
                    }}
                    className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all"
                  >
                    {selectedCase.status === CaseStatus.RESOLVED ? 'Close Case Final' : 'Progress Case State'}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
