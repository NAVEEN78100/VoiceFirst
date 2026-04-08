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
  Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

// --- Types ---
interface DashboardSummary {
  totalFeedback: number;
  averageRating: number;
  lowRatingCount: number;
  lowRatingPercentage: number;
  totalOpenCases: number;
  ratingDistribution: { rating: number; count: number }[];
  casesByStatus: { status: string; count: number }[];
}

interface TrendData {
  date: string;
  avgRating: number;
  count: number;
}

// --- Components ---

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => {
  const colorStyles: any = {
    blue: { bg: 'bg-red-50', text: 'text-red-700', glow: 'bg-red-200' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-600', glow: 'bg-amber-200' },
    red: { bg: 'bg-red-50', text: 'text-red-700', glow: 'bg-red-300' },
    green: { bg: 'bg-gray-50', text: 'text-gray-600', glow: 'bg-gray-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', glow: 'bg-orange-200' }
  };
  const style = colorStyles[color] || colorStyles.blue;
  
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] relative overflow-hidden group"
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
            <span className="text-[11px] text-[var(--text-muted)] font-medium">{subtitle}</span>
          </div>
        </div>
        <div className={`p-4 rounded-2xl ${style.bg} ${style.text} group-hover:scale-110 transition-transform duration-500 ease-out shadow-sm`}>
          <Icon size={24} />
        </div>
      </div>
      {/* Subtle Background Glow */}
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full ${style.glow} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />
    </motion.div>
  );
};

const ChartCard = ({ title, children, icon: Icon, className = "" }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-[var(--surface)] p-8 rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm shadow-slate-200/50 ${className}`}
  >
    <div className="flex items-center gap-3 mb-8">
      <div className="p-2.5 rounded-xl bg-slate-50 text-[var(--primary)] border border-slate-100 shadow-sm">
        <Icon size={20} />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">{title}</h2>
    </div>
    <div className="h-[300px] w-full">
      {children}
    </div>
  </motion.div>
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
        
        // Backend wraps all responses in { success: true, data: T }
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

  // Pie Chart Colors
  const PIE_COLORS = {
    'OPEN': 'var(--primary)',
    'IN_PROGRESS': 'var(--secondary)',
    'RESOLVED': '#16a34a',
    'CLOSED': 'var(--text-muted)',
  };

  const getPercentageColor = (pct: number) => {
    if (pct > 20) return 'red';
    if (pct > 10) return 'yellow';
    return 'green';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Operational Analytics</h1>
          <p className="text-[var(--text-muted)] flex items-center gap-2">
            <Activity size={16} className="text-[var(--primary)]" />
            {user.role === 'ADMIN' ? 'Global Multi-Branch Overview' : `Insights for ${user.branchId || 'Active Branch'}`}
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center bg-[var(--surface)] p-1.5 rounded-xl border border-[var(--border)] shadow-sm">
          {['today', 'last_7_days', 'last_30_days', 'this_month'].map((p) => (
            <button
              key={p}
              onClick={() => setTimePreset(p)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                timePreset === p 
                ? 'bg-[var(--primary)] text-white shadow-md' 
                : 'hover:bg-[var(--surface-hover)] text-[var(--text-muted)]'
              }`}
            >
              {p.split('_').join(' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-[var(--surface)] animate-pulse border border-[var(--border)]" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Submissions"
                value={(summary?.totalFeedback ?? 0).toLocaleString()}
                subtitle="Captured responses"
                icon={TrendingUp}
                color="blue"
              />
              <StatCard 
                title="Average Rating"
                value={(summary?.averageRating ?? 0).toFixed(1)}
                subtitle="Customer satisfaction score"
                icon={Star}
                color="yellow"
              />
              <StatCard 
                title="Low Sentiment"
                value={summary?.lowRatingCount ?? 0}
                subtitle={`${summary?.lowRatingPercentage ?? 0}% needs attention`}
                icon={AlertCircle}
                color={getPercentageColor(summary?.lowRatingPercentage || 0)}
              />
              <StatCard 
                title="Active Cases"
                value={summary?.totalOpenCases ?? 0}
                subtitle="Awaiting resolution"
                icon={HelpCircle}
                color={summary?.totalOpenCases && summary.totalOpenCases > 0 ? "orange" : "green"}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Trends Area Chart */}
              <ChartCard title="Performance Trend" icon={TrendingUp} className="xl:col-span-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: 'var(--text-muted)', fontSize: 11}}
                      tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                    />
                    <YAxis 
                      domain={[0, 5]} 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: 'var(--text-muted)', fontSize: 11}}
                    />
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avgRating" 
                      stroke="var(--primary)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAvg)" 
                      name="Avg Rating"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Rating Distribution BarChart */}
              <ChartCard title="Rating Distribution" icon={LayoutDashboard}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...(summary?.ratingDistribution || [])].sort((a,b)=>a.rating-b.rating)}>
                    <XAxis 
                      dataKey="rating" 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: 'var(--text-muted)', fontSize: 12}}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'var(--surface-hover)'}}
                      contentStyle={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {summary?.ratingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rating <= 2 ? 'var(--danger)' : 'var(--primary)'} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Case Status Breakdown */}
              <ChartCard title="Case Resolution" icon={CheckCircle2}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary?.casesByStatus || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="count"
                      nameKey="status"
                    >
                      {summary?.casesByStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={(PIE_COLORS as any)[entry.status] || 'var(--border)'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
