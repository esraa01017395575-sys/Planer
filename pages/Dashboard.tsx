import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Calendar, Clock, Play, CheckCircle2, 
  ChevronRight, ArrowUpRight, Target, Activity,
  Zap, Brain, Star, Flame, RefreshCcw
} from 'lucide-react';
import { Link } from 'wouter';
import { format, isBefore, startOfToday } from 'date-fns';
import { AppShell } from '../components/layout/AppShell';
import { useGetDailySchedule, useGetHabits, useGetDailyQuote, useGetUserXP, useGetTasks, useCompleteHabit } from '../lib/hooks';
import { useAppContext } from '../context/AppContext';
import { LoadingState, SkeletonCard } from '../components/ui/LoadingState';

export const Dashboard = () => {
  const { t, language } = useAppContext();
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  
  const { data: schedule, isLoading: loadSchedule } = useGetDailySchedule({ date: todayDateStr });
  const { data: habits, isLoading: loadHabits, refetch: refetchHabits } = useGetHabits();
  const { data: allTasks, isLoading: loadTasks } = useGetTasks();
  const { data: quote, loading: loadQuote } = useGetDailyQuote();
  const { data: userXP } = useGetUserXP();

  const { mutate: completeHabit } = useCompleteHabit();

  if (loadSchedule || loadHabits || loadTasks) {
    return (
      <AppShell>
        <LoadingState message="Waking up your OS..." />
      </AppShell>
    );
  }

  const overdueTasks = allTasks?.filter(t => t.due_date && isBefore(new Date(t.due_date), startOfToday()) && t.status !== 'done') || [];
  const today = format(new Date(), language === 'ar' ? 'eeee، d MMMM' : 'EEEE, MMMM d');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Life OS Dashboard</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-text-primary tracking-tight">
            {t('good_morning')}, <span className="text-gradient">Israa</span> 👋
          </h1>
          <p className="text-text-secondary mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {today}
          </p>
        </div>
        
        <div className="flex gap-3">
          {[
            { label: 'Level', value: userXP ? `LVL ${userXP.level}` : 'LVL 1', icon: Star, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'XP', value: `${userXP?.current_xp || 0} / ${userXP?.next_level_xp || 100}`, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Streak', value: `${habits?.reduce((max, h) => Math.max(max, h.current_streak || 0), 0) || 0}d`, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <div key={i} className="glass-card px-4 py-2 flex items-center gap-3 border-none shadow-sm">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">{t(stat.label.toLowerCase())}</p>
                <p className="text-sm font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Quote Section */}
      <motion.section 
        whileHover={{ y: -4 }}
        className="relative overflow-hidden glass-card p-8 border-accent/20 bg-gradient-to-br from-accent/5 to-indigo-500/5 group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Brain size={120} className="text-accent" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-xs font-bold text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles size={16} /> Daily Insight
          </h2>
          <p className="text-2xl md:text-3xl font-display leading-tight text-text-primary italic">
            "{quote || "Design your day, before it designs you."}"
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/chat">
              <button className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:scale-105 transition-transform flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Plan my day
              </button>
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {overdueTasks.length > 0 && (
            <section>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-destructive">
                <RefreshCcw size={20} /> {t('pending_yesterday')}
              </h3>
              <div className="space-y-3">
                {overdueTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 glass-card border-destructive/20 bg-destructive/5 hover:border-destructive/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <span className="font-medium text-text-primary">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-xs font-bold px-3 py-1.5 rounded-lg bg-bg-secondary border border-border hover:bg-bg-primary transition-colors">
                        {t('reschedule')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                <Calendar size={20} className="text-accent" /> {t('today_schedule')}
              </h3>
              <Link href="/tasks">
                <span className="text-sm text-accent hover:underline font-bold flex items-center gap-1 cursor-pointer">
                  {t('view_all_tasks')} <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            
            <div className="space-y-3">
              {schedule?.length === 0 ? (
                <div className="glass-card p-12 text-center border-dashed border-2 border-border/50">
                  <CheckCircle2 size={48} className="mx-auto text-text-secondary mb-4 opacity-30" />
                  <p className="text-text-secondary font-medium">Your schedule is clear today.</p>
                  <Link href="/chat">
                    <button className="mt-4 px-6 py-2.5 bg-accent/10 text-accent font-bold rounded-xl hover:bg-accent hover:text-white transition-all">
                      Ask AI for suggestions
                    </button>
                  </Link>
                </div>
              ) : (
                schedule?.map(item => (
                  <motion.div 
                    key={item.id} 
                    whileHover={{ scale: 1.01 }}
                    className="group flex items-center justify-between p-4 glass-card hover:border-accent/30 transition-all hover:shadow-lg hover:shadow-accent/5 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-mono font-bold text-accent w-14 bg-accent/5 py-1 px-2 rounded-lg text-center">
                        {item.start_time?.slice(0,5) || 'NOW'}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary group-hover:text-accent transition-colors">
                          {item.task?.title || 'Unknown Task'}
                        </p>
                        <p className="text-xs text-text-secondary mt-1 uppercase tracking-widest font-bold">
                          {item.task?.estimated_min || 25} MIN • {item.task?.category || 'Task'}
                        </p>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 shadow-md shadow-accent/20">
                      <Play size={14} className="fill-current" /> {t('start')}
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Side Column */}
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-text-primary">
              <Flame size={20} className="text-orange-500" /> {t('daily_habits')}
            </h3>
            <div className="glass-card divide-y divide-border/30">
              {habits?.filter(h => h.is_active).map((habit) => (
                <div key={habit.id} className="flex items-center justify-between p-4 hover:bg-accent/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-bg-secondary flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {habit.emoji || (habit.category === 'health' ? '💪' : habit.category === 'learning' ? '📚' : '🎯')}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-primary">{habit.title}</p>
                      <p className="text-xs text-text-secondary font-mono flex items-center gap-1">
                        Streak: <span className="text-orange-500 font-bold">{habit.current_streak} 🔥</span>
                      </p>
                    </div>
                  </div>
                  {habit.completed_today ? (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={18} className="fill-emerald-500 text-bg-primary" />
                    </div>
                  ) : (
                    <button 
                      onClick={() => completeHabit({ id: habit.id }, { onSuccess: refetchHabits })}
                      className="w-9 h-9 rounded-full border-2 border-border/50 hover:border-accent hover:bg-accent/10 transition-all active:scale-90"
                    />
                  )}
                </div>
              ))}
              {(!habits || habits.length === 0) && (
                <div className="p-8 text-center">
                  <p className="text-sm text-text-secondary">No active habits yet.</p>
                  <Link href="/habits">
                    <span className="text-xs font-bold text-accent hover:underline block mt-2 cursor-pointer">Start some!</span>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* XP Summary Side Box */}
          <section className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-accent/10 border-indigo-500/20">
            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
              <Target size={16} className="text-indigo-500" /> {t('daily_progress')}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-text-secondary">XP Level Progress</span>
                  <span className="text-indigo-500">{userXP ? Math.round((userXP.current_xp / userXP.next_level_xp) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: userXP ? `${(userXP.current_xp / userXP.next_level_xp) * 100}%` : '0%' }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>
              <p className="text-[10px] text-text-secondary text-center uppercase tracking-widest font-bold">
                Level {userXP?.level || 1} • {userXP?.current_xp || 0} XP
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
