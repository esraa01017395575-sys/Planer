import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Calendar, Clock, Play, CheckCircle2, 
  ChevronRight, ArrowUpRight, Target, Activity,
  Zap, Brain, Star
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useGetDailySchedule, useGetHabits, useGetDailyQuote } from '../lib/hooks';
import { useAppContext } from '../context/AppContext';

export const Dashboard = () => {
  const { t, language } = useAppContext();
  const { data: schedule, loading: scheduleLoading } = useGetDailySchedule();
  const { data: habits, loading: habitsLoading } = useGetHabits();
  const { data: quote } = useGetDailyQuote();

  const today = new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  const stats = [
    { label: 'Focus Score', value: '92%', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Habit Streak', value: '12 Days', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Goals Met', value: '8/10', icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

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
            {stats.map((stat, i) => (
              <div key={i} className="glass-card px-4 py-2 flex items-center gap-3 border-none shadow-sm">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">{t(stat.label.toLowerCase().replace(' ', '_'))}</p>
                  <p className="text-sm font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Focus / Quote - Large Bento Box */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="md:col-span-8 glass-card p-8 relative overflow-hidden group min-h-[240px] flex flex-col justify-center"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Brain className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <span className="text-xs font-bold text-accent uppercase tracking-widest mb-4 block">{t('daily_quote')}</span>
              <h2 className="text-3xl font-display font-medium leading-tight text-text-primary italic">
                "{quote || 'Loading your daily spark...'}"
              </h2>
              <div className="mt-8 flex items-center gap-4">
                <button className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 hover:scale-105 transition-transform flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  {t('start')} Deep Work
                </button>
                <button className="text-text-secondary hover:text-accent font-bold text-sm transition-colors">
                  {t('calendar')}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats / Progress - Small Bento Box */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="md:col-span-4 glass-card p-6 flex flex-col justify-between bg-gradient-to-br from-accent/5 to-indigo-500/5"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-text-primary">{t('daily_progress')}</h3>
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-text-secondary">{t('tasks_completed')}</span>
                    <span>65%</span>
                  </div>
                  <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      className="h-full bg-accent"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-text-secondary">{t('energy_level')}</span>
                    <span>High</span>
                  </div>
                  <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      className="h-full bg-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-3 rounded-xl border border-accent/20 text-accent font-bold text-sm hover:bg-accent hover:text-white transition-all">
              {t('weekly_review')}
            </button>
          </motion.div>

          {/* Today's Tasks - Medium Bento Box */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="md:col-span-7 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                {t('today_schedule')}
              </h3>
              <button className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                {t('view_all')} <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3">
              {scheduleLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 bg-bg-secondary/50 animate-pulse rounded-2xl" />)
              ) : schedule && schedule.length > 0 ? (
                schedule.slice(0, 4).map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-bg-secondary/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-accent border-accent' : 'border-border group-hover:border-accent'}`}>
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${task.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                          {task.scheduled_time || '09:00 AM'} • {task.duration || 30} MIN
                        </p>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 text-text-secondary hover:text-accent transition-all">
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl">
                  <p className="text-text-secondary text-sm italic">No tasks for today. Time to plan!</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Habits - Medium Bento Box */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="md:col-span-5 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent fill-accent/20" />
                {t('habit_tracker')}
              </h3>
              <button className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                {t('manage')} <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-6">
              {habitsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 bg-bg-secondary/50 animate-pulse rounded-2xl" />)
              ) : habits && habits.length > 0 ? (
                habits.slice(0, 3).map((habit: any) => {
                  const logs = habit.habit_logs || [];
                  const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d.toISOString().split('T')[0];
                  });

                  return (
                    <div key={habit.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{habit.icon || '✨'}</span>
                          <span className="font-bold text-sm text-text-primary">{habit.title || habit.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                          {habit.current_streak || 0}d streak
                        </span>
                      </div>
                      <div className="flex justify-between gap-1">
                        {last7Days.map((date) => {
                          const isDone = logs.some((l: any) => l.date === date && l.completed);
                          return (
                            <div 
                              key={date}
                              className={`flex-1 h-8 rounded-lg border transition-all ${
                                isDone 
                                  ? 'bg-accent border-accent shadow-sm' 
                                  : 'bg-bg-secondary border-border/50'
                              }`}
                              title={date}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl">
                  <p className="text-text-secondary text-sm italic">Start a new habit today.</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
  );
};
