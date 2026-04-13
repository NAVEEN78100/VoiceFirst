"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { api } from '@/lib/api';
import { 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  TrendingDown,
  Activity,
  LayoutDashboard,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

// --- Types ---
interface BranchStats {
  branchName: string;
  avgRating: number;
  feedbackCount: number;
  openCases: number;
  resolvedPercentage: number;
}

interface DashboardSummary {
  totalFeedback: number;
  averageRating: number;
  lowRatingCount: number;
  lowRatingPercentage: number;
  totalOpenCases: number;
  ratingDistribution: { rating: number; count: number }[];
  casesByStatus: { status: string; count: number }[];
  branchComparison?: BranchStats[];
}

interface TrendData {
  date: string;
  avgRating: number;
  count: number;
}

// --- Components ---

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => {
  const colorStyles: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', glow: 'bg-blue-200' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-600', glow: 'bg-amber-200' },
    red: { bg: 'bg-rose-50', text: 'text-rose-700', glow: 'bg-rose-300' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', glow: 'bg-emerald-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', glow: 'bg-orange-200' }
  };
  const style = colorStyles[color] || colorStyles.blue;
  
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] relative overflow-hidden group"
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-[var(--text-muted)] text-sm font-semibold mb-1 tracking-tight">{title}</h3>
          <p className="text-4xl font-black tracking-tighter text-[var(--text)]">{value}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {trend !== undefined && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(trend)}%
              </span>
            )}
            <span className="text-[11px] text-[var(--text-muted)] font-medium leading-none">{subtitle}</span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl ${style.bg} ${style.text} group-hover:scale-110 transition-transform duration-500 ease-out shadow-sm`}>
          <Icon size={24} />
        </div>
      </div>
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full ${style.glow} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />
    </motion.div>
  );
};

const ChartCard = ({ title, children, icon: Icon, className = "", subtitle }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] overflow-hidden shadow-sm shadow-slate-200/50 ${className}`}
  >
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-50 text-[var(--primary)] border border-slate-100 shadow-sm">
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      <button className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
        <ArrowUpRight size={20} />
      </button>
    </div>
    <div className="h-[300px] w-full">
      {children}
    </div>
  </motion.div>
);

const BranchLeaderboard = ({ data }: { data: BranchStats[] }) => (
  <div className="space-y-4">
    {data.map((branch, idx) => (
      <motion.div 
        key={branch.branchName}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.1 }}
        className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[var(--primary)] transition-all cursor-default group"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
            {idx + 1}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">{branch.branchName}</h4>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Users size={10} /> {branch.feedbackCount} feedback
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <ShieldAlert size={10} /> {branch.openCases} open
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[var(--primary)]">
            <span className="text-lg font-black">{branch.avgRating.toFixed(1)}</span>
            <Star size={12} fill="currentColor" />
          </div>
          <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${branch.resolvedPercentage}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

// --- Main Dashboard ---

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePreset, setTimePreset] = useState('last_7_days');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [sumRes, trendRes] = await Promise.all([
          api.get<any>('/dashboard/summary', { params: { preset: timePreset } }),
          api.get<any>('/dashboard/performance-trend', { params: { preset: timePreset } })
        ]);
        
        if (sumRes && (sumRes as any).data) setSummary((sumRes as any).data);
        if (trendRes && (trendRes as any).data) setTrend((trendRes as any).data);
      } catch (err: any) {
        console.error("Dashboard data load failed", err?.message || err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboard();
  }, [user, timePreset]);

  if (!user) return null;

  const PIE_COLORS = {
    'OPEN': 'var(--primary)',
    'IN_PROGRESS': 'var(--secondary)',
    'RESOLVED': '#10b981',
    'CLOSED': '#64748b',
  };

  const getPercentageColor = (pct: number) => {
    if (pct > 20) return 'red';
    if (pct > 10) return 'yellow';
    return 'green';
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-12">
      {/* Top Banner Alert (Urgent Presence) */}
      <AnimatePresence>
        {summary && summary.lowRatingCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 border border-rose-100 p-4 rounded-3xl flex items-center justify-between group overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center animate-pulse">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="text-rose-900 font-bold text-sm">Action Required</h4>
                <p className="text-rose-700 text-xs">There are {summary.lowRatingCount} critical feedback submissions that need immediate service recovery.</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-rose-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors flex items-center gap-2">
              Review Alerts <ChevronRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
              <Zap size={14} fill="currentColor" />
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-600">Executive Control Room</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900">Intelligence Dashboard</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            {user.role === 'ADMIN' ? 'Global Multi-Branch Operations Overview' : `Insights for ${user.branchId || 'Active Branch'}`}
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-xl">
          {['today', 'last_7_days', 'last_30_days'].map((p) => (
            <button
              key={p}
              onClick={() => setTimePreset(p)}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                timePreset === p 
                ? 'bg-slate-900 text-white shadow-xl' 
                : 'hover:bg-slate-50 text-slate-500'
              }`}
            >
              {p.split('_').join(' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-40 rounded-[2rem] bg-white animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Global Submissions"
              value={(summary?.totalFeedback ?? 0).toLocaleString()}
              subtitle="All touchpoints"
              icon={TrendingUp}
              color="blue"
            />
            <StatCard 
              title="Experience Index"
              value={(summary?.averageRating ?? 0).toFixed(1)}
              subtitle="Avg. Member Rating"
              icon={Star}
              color="yellow"
            />
            <StatCard 
              title="Critical Sentiment"
              value={summary?.lowRatingCount ?? 0}
              subtitle={`${summary?.lowRatingPercentage ?? 0}% Needs Recovery`}
              icon={AlertCircle}
              color={getPercentageColor(summary?.lowRatingPercentage || 0)}
            />
            <StatCard 
              title="Unresolved Cases"
              value={summary?.totalOpenCases ?? 0}
              subtitle="Awaiting Staff Action"
              icon={HelpCircle}
              color={summary?.totalOpenCases && summary.totalOpenCases > 0 ? "orange" : "green"}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Trends Area Chart */}
            <ChartCard title="Performance Trend" icon={TrendingUp} className="lg:col-span-8" subtitle="Daily satisfaction analytics over time">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                    tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#fff', borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgRating" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorAvg)" 
                    name="Rating"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Branch Leaderboard */}
            <ChartCard title="Top Branch Performance" icon={Zap} className="lg:col-span-4" subtitle="Ranked by member satisfaction">
              {summary?.branchComparison ? (
                <BranchLeaderboard data={summary.branchComparison} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Activity size={40} className="mb-2 opacity-20" />
                  <p className="text-xs font-medium italic">Leaderboard available for Admin</p>
                </div>
              )}
            </ChartCard>

            {/* Rating Distribution BarChart */}
            <ChartCard title="Sentiment Breakdown" icon={LayoutDashboard} className="lg:col-span-6" subtitle="Review count per star rating">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...(summary?.ratingDistribution || [])].sort((a,b)=>a.rating-b.rating)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="rating" 
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ background: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40}>
                    {summary?.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.rating <= 2 ? '#f43f5e' : '#3b82f6'} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Case Status Breakdown */}
            <ChartCard title="Resolution Efficiency" icon={CheckCircle2} className="lg:col-span-6" subtitle="Current status of critical recovery cases">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary?.casesByStatus || []}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={10}
                    dataKey="count"
                    nameKey="status"
                    stroke="none"
                  >
                    {summary?.casesByStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={(PIE_COLORS as any)[entry.status] || '#e2e8f0'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    formatter={(value) => <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

          </div>
        </div>
      )}
    </div>
  );
}
