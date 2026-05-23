import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BrainCircuit, ThumbsUp, Frown, Sparkles, Clock, CalendarDays, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsReport {
  totalMinutes: number;
  avgSessionDuration: number;
  moodDistribution: Record<string, number>;
  recentVelocity: Array<{ date: string; duration: number; tasksCount: number }>;
}

interface ProjectAnalyticsProps {
  projectId: string;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ projectId }) => {
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (user) {
          headers['x-user-id'] = user.id;
        }

        const res = await fetch(`/api/projects/${projectId}/analytics`, { headers });
        const report = await res.json();
        setData(report);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 py-16 gap-3">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <span className="text-xs text-text-secondary">جاري جمع تحليلات الإنتاجية...</span>
      </div>
    );
  }

  if (!data || !data.recentVelocity || data.recentVelocity.length === 0) {
    return (
      <div className="bg-bg-secondary/30 rounded-2xl border border-border/10 p-8 text-center">
        <BrainCircuit className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium text-text-secondary">لا توجد تحليلات كافية بعد.</p>
        <p className="text-xs text-text-secondary/60 mt-1">ابدأ بتسجيل أول جلسة عمل لرسم بياني لإنتاجيتك!</p>
      </div>
    );
  }

  // Map velocity for chart
  const chartData = data.recentVelocity.map(rv => {
    return {
      date: new Date(rv.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      hours: Number((rv.duration / 60).toFixed(1)),
      tasks: rv.tasksCount
    };
  }).reverse(); // Order chronological

  const totalHours = Number((data.totalMinutes / 60).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Mini Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4 flex items-center gap-4 border border-border/10">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center text-accent">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">مجموع الساعات / Total Hours</p>
            <p className="text-lg font-bold text-text-primary mt-0.5">{totalHours} ساعة</p>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4 border border-border/10">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">معدل الجلسة / Avg Duration</p>
            <p className="text-lg font-bold text-text-primary mt-0.5">{data.avgSessionDuration} دقيقة</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card p-4 border border-border/10">
        <h4 className="font-bold text-xs font-mono uppercase text-text-secondary mb-4">منحنى جلسات العمل / Productivity Velocity</h4>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent, #6366f1)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--color-accent, #6366f1)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--color-border)" fontSize={9} />
              <YAxis tickCount={4} stroke="var(--color-border)" fontSize={9} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: '12px', 
                  fontSize: '11px',
                  color: '#fff'
                }} 
              />
              <Area type="monotone" dataKey="hours" stroke="var(--color-accent, #6366f1)" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" name="الساعات" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mood Distribution */}
      <div className="glass-card p-4 border border-border/10">
        <h4 className="font-bold text-xs font-mono uppercase text-text-secondary mb-3.5">التركيز والحالة النفسية / Mood Distribution</h4>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-center">
            <ThumbsUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="block text-xs font-bold text-emerald-400">{data.moodDistribution?.productive || 0}</span>
            <span className="text-[10px] text-text-secondary">منجز / Focused</span>
          </div>

          <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-center">
            <Frown className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <span className="block text-xs font-bold text-red-400">{data.moodDistribution?.stuck || 0}</span>
            <span className="text-[10px] text-text-secondary">عالق / Blocked</span>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 p-3 rounded-xl text-center">
            <Sparkles className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="block text-xs font-bold text-purple-400">{data.moodDistribution?.breakthrough || 0}</span>
            <span className="text-[10px] text-text-secondary">إلهام / Breakthrough</span>
          </div>
        </div>
      </div>
    </div>
  );
};
