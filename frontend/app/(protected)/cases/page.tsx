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
  Map as MapIcon,
  Image as ImageIcon,
  Send,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ChevronRight,
  Star,
  ArrowUpRight
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
  resolutionNotes?: string;
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
    mediaUrl?: string;
    touchpoint: { name: string; type?: string; };
  };
}

// --- Components ---

const StatusPill = ({ status }: { status: CaseStatus }) => {
  const styles: any = {
    [CaseStatus.NEW]: 'bg-rose-500/10 text-rose-600 border-rose-200',
    [CaseStatus.ACKNOWLEDGED]: 'bg-blue-500/10 text-blue-600 border-blue-200',
    [CaseStatus.IN_PROGRESS]: 'bg-amber-500/10 text-amber-600 border-amber-200',
    [CaseStatus.RESOLVED]: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    [CaseStatus.CLOSED]: 'bg-slate-500/10 text-slate-600 border-slate-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const PriorityPill = ({ priority }: { priority: CasePriority }) => {
  const styles: any = {
    [CasePriority.CRITICAL]: 'bg-rose-600 text-white shadow-lg shadow-rose-200',
    [CasePriority.HIGH]: 'bg-amber-600 text-white shadow-lg shadow-amber-100',
    [CasePriority.MEDIUM]: 'bg-slate-700 text-white',
    [CasePriority.LOW]: 'bg-slate-400 text-white',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${styles[priority]}`}>
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
  const [resNote, setResNote] = useState('');
  const [sendingRes, setSendingRes] = useState(false);

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
      await api.patch(`/cases/${id}`, { status: nextStatus });
      setCases(cases.map(c => c.id === id ? { ...c, status: nextStatus } : c));
      if (selectedCase?.id === id) setSelectedCase({ ...selectedCase, status: nextStatus });
    } catch (err: any) {
      alert(err.message || "Invalid state transition");
    }
  };

  const submitResolution = async () => {
    if (!selectedCase || !resNote) return;
    setSendingRes(true);
    try {
      await api.patch(`/cases/${selectedCase.id}`, { 
        status: CaseStatus.RESOLVED, 
        resolutionNotes: resNote 
      });
      setCases(cases.map(c => c.id === selectedCase.id ? { ...c, status: CaseStatus.RESOLVED, resolutionNotes: resNote } : c));
      setSelectedCase({ ...selectedCase, status: CaseStatus.RESOLVED, resolutionNotes: resNote });
      setResNote('');
      // Success feedback
    } catch (err: any) {
      console.error(err);
    } finally {
      setSendingRes(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                <ShieldCheck size={14} fill="currentColor" />
             </div>
             <span className="text-[10px] font-black tracking-widest uppercase text-rose-600">Service Recovery Protocol</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Incident Control</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            Managing and resolving automated member follow-up assignments.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search incidents..."
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none w-full transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto">
             {['ALL', ...Object.values(CaseStatus)].map(s => (
               <button 
                 key={s} 
                 onClick={() => setStatusFilter(s as any)}
                 className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all whitespace-nowrap uppercase tracking-wider ${statusFilter === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 {s}
               </button>
             ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 bg-white border border-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {filteredCases.map((c, index) => (
              <motion.div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:border-blue-300 transition-all hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] cursor-pointer overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-8 relative z-10">
                  {/* Left: Indicator Side */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-center gap-4 lg:w-32 lg:border-r border-slate-100 pr-4">
                     <PriorityPill priority={c.priority} />
                     <StatusPill status={c.status} />
                     <div className="hidden lg:block w-px h-8 bg-slate-100 my-2" />
                     <div className="flex items-center gap-1.5 text-rose-600">
                        <Star size={16} fill="currentColor" />
                        <span className="text-xl font-black">{c.rating}</span>
                     </div>
                  </div>

                  {/* Center: Intelligence */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-xl text-white">
                           <MapIcon size={14} />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-slate-800 tracking-tight">{c.feedback.touchpoint.name}</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             {format(parseISO(c.createdAt), 'MMMM d, yyyy • h:mm a')}
                           </p>
                        </div>
                      </div>
                      
                      {c.feedback.mediaUrl && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                           <ImageIcon size={14} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Photo Evidence</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 relative group-hover:bg-blue-50/30 transition-colors">
                       <MessageSquare size={16} className="text-slate-300 absolute top-4 right-4" />
                       <p className="text-sm text-slate-600 font-medium leading-relaxed italic pr-8">
                          "{c.feedback.comment || 'Detailed statement not provided by member'}"
                       </p>
                    </div>

                    {c.canContact && (
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                             <Phone size={12} /> {c.feedback.phone}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">Direct WhatsApp Recovery Enabled</span>
                       </div>
                    )}
                  </div>

                  {/* Right: Actions Side */}
                  <div className="flex items-center gap-4 lg:pl-4">
                     <button className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
                        <ArrowUpRight size={20} />
                     </button>
                     <button className="h-12 flex-1 lg:flex-none px-8 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95">
                        Manage Case
                     </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && filteredCases.length === 0 && (
            <div className="py-24 text-center space-y-4 bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                 <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Total Resolution Efficiency</h3>
                <p className="text-slate-400 font-medium">No open cases currently match your workspace filters.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* High-End Detail Modal */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCase(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-default transition-all"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
            >
              {/* Modal Body: Split Layout */}
              <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                 
                 {/* Left Panel: Intelligence & Evidence */}
                 <div className="flex-1 overflow-y-auto p-10 space-y-10 border-r border-slate-100">
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Incident Context</p>
                          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">"{selectedCase.feedback.issueTopic || 'General Operation'}"</h2>
                          <div className="flex items-center gap-2 mt-4">
                             <MapPin size={14} className="text-slate-400" />
                             <span className="text-sm font-bold text-slate-600">{selectedCase.feedback.touchpoint.name}</span>
                          </div>
                       </div>
                       <div className="text-center bg-rose-50 p-4 rounded-3xl border border-rose-100">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Impact</span>
                          <span className="text-3xl font-black text-rose-600">{selectedCase.rating}.0</span>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                          <ImageIcon size={14} /> Evidence Gallery
                       </h4>
                       <div className="grid grid-cols-2 gap-4">
                          {selectedCase.feedback.mediaUrl ? (
                             <img 
                                src={selectedCase.feedback.mediaUrl} 
                                className="w-full aspect-video object-cover rounded-[2rem] border border-slate-100 shadow-sm"
                                alt="Feedback Evidence"
                             />
                          ) : (
                             <div className="w-full aspect-video bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                                <ImageIcon size={32} className="mb-2 opacity-50" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">No visual evidence</span>
                             </div>
                          )}
                          <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col justify-between">
                             <Zap size={24} className="text-blue-400" />
                             <div>
                                <p className="text-xs font-bold text-slate-400 leading-relaxed mb-2 uppercase tracking-wide">Member Statement</p>
                                <p className="text-sm font-medium italic opacity-90 leading-relaxed">
                                   "{selectedCase.feedback.comment || 'Member chose not to provide details.'}"
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Digital Fingerprint</h4>
                          <div className="space-y-3">
                             <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">Device</span>
                                <span className="text-slate-700">{selectedCase.feedback.deviceType} / {selectedCase.feedback.os}</span>
                             </div>
                             <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">Network</span>
                                <span className="text-slate-700">{selectedCase.feedback.ipAddress}</span>
                             </div>
                             <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">Software</span>
                                <span className="text-slate-700">{selectedCase.feedback.browser}</span>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Follow-up Info</h4>
                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                             {selectedCase.feedback.phone ? (
                                <div className="space-y-1">
                                   <p className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                                      <Phone size={12} /> {selectedCase.feedback.phone}
                                   </p>
                                   <p className="text-[10px] font-bold text-blue-600">Member requested recovery follow-up via WhatsApp</p>
                                </div>
                             ) : (
                                <p className="text-xs font-bold text-slate-400 italic">No contact provided</p>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Right Panel: Action & Resolution */}
                 <div className="w-full lg:w-[400px] bg-slate-50/50 p-10 flex flex-col justify-between">
                    <div className="space-y-10">
                       <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-slate-900">Resolution Center</h3>
                          <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                             <X size={20} />
                          </button>
                       </div>

                       <div className="space-y-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Current State</label>
                             <div className="grid grid-cols-1 gap-2">
                                {Object.values(CaseStatus).map((s) => (
                                   <button 
                                      key={s}
                                      onClick={() => updateStatus(selectedCase.id, selectedCase.status)}
                                      className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${selectedCase.status === s ? 'bg-white border-slate-900 shadow-xl' : 'bg-transparent border-slate-200 opacity-50'}`}
                                   >
                                      <span className={`text-[11px] font-black uppercase tracking-widest ${selectedCase.status === s ? 'text-slate-900' : 'text-slate-400'}`}>{s.replace('_', ' ')}</span>
                                      {selectedCase.status === s && <CheckCircle2 size={16} className="text-slate-900" />}
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Resolution Protocol</label>
                             {selectedCase.status === CaseStatus.RESOLVED || selectedCase.status === CaseStatus.CLOSED ? (
                                <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4">
                                   <div className="flex items-center gap-2 text-emerald-600">
                                      <CheckCircle2 size={16} />
                                      <span className="text-xs font-black uppercase tracking-widest">Successfully Resolved</span>
                                   </div>
                                   <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                      "{selectedCase.resolutionNotes || 'No internal notes recorded'}"
                                   </p>
                                </div>
                             ) : (
                                <div className="space-y-4">
                                   <textarea 
                                      placeholder="Type the resolution findings or message to be sent via WhatsApp..."
                                      className="w-full h-40 bg-white border border-slate-200 rounded-3xl p-6 text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none shadow-sm"
                                      value={resNote}
                                      onChange={(e) => setResNote(e.target.value)}
                                   />
                                   <button 
                                      disabled={!resNote || sendingRes}
                                      onClick={submitResolution}
                                      className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-30 transition-all active:scale-95"
                                   >
                                      {sendingRes ? 'Synchronizing...' : 'Execute Resolution'}
                                      <Send size={16} />
                                   </button>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200">
                       <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest leading-loose">
                          Audit Log: Case manually managed by <br/>
                          <span className="text-slate-900">{user.email}</span>
                       </p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
