import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Calendar, Clock, Play, CheckCircle2, 
  ChevronRight, ArrowUpRight, Target, Activity,
  Zap, Brain, Star, Flame, RefreshCcw, MoreHorizontal, Settings, Trash2, Heart
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { format, isBefore, startOfToday, addDays, parseISO } from 'date-fns';
import { formatTime12h } from '../lib/utils';
import { 
  useGetDailySchedule, useGetHabits, useGetDailyQuote, 
  useGetUserXP, useGetTasks, useCompleteHabit, 
  useUpdateTask, useDeleteTask, useToggleFavorite, useGetFavorites,
  useGetProfile
} from '../lib/hooks';
import { useAppContext } from '../context/AppContext';
import { LoadingState, SkeletonCard } from '../components/ui/LoadingState';

export const Dashboard = () => {
  const { t, language, addNotification } = useAppContext();
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  
  const { data: schedule, isLoading: loadSchedule } = useGetDailySchedule({ date: todayDateStr });
  const { data: habits, loading: loadHabits, refetch: refetchHabits } = useGetHabits();
  const { data: allTasks, loading: loadTasks, refetch: refetchTasks } = useGetTasks();
  const { data: quote, loading: loadQuote } = useGetDailyQuote();
  const { data: userXP } = useGetUserXP();
  const { data: favorites } = useGetFavorites();
  const { data: profile, loading: loadProfile } = useGetProfile();

  const { mutate: completeHabit } = useCompleteHabit();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { toggleFavorite } = useToggleFavorite();

  const isFavorited = (sourceId: string) => {
    return favorites?.some((f: any) => f.source_id === sourceId);
  };
  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!loadSchedule && !loadHabits && !loadTasks && !loadProfile) {
      setIsInitialLoad(false);
    }
  }, [loadSchedule, loadHabits, loadTasks, loadProfile]);

  const handleReschedule = (task: any, option: '24h' | 'tomorrow' | 'next_week' | 'calendar' | 'delete') => {
    if (option === 'delete') {
      if (confirm(t('confirmDelete'))) deleteTask({ id: task.id }, { onSuccess: () => { addNotification(t('task_deleted'), "success"); refetchTasks(); } });
      return;
    }
    
    if (option === 'calendar') {
      setLocation(`/tasks?edit=${task.id}`);
      return;
    }

    let newDate = new Date(task.due_date || new Date());
    if (option === '24h') newDate = addDays(newDate, 1);
    else if (option === 'tomorrow') newDate = addDays(new Date(), 1);
    else if (option === 'next_week') newDate = addDays(new Date(), 7);

    const dateStr = format(newDate, 'yyyy-MM-dd');
    const isToday = dateStr === todayDateStr;

    updateTask({ 
      id: task.id, 
      data: { 
        due_date: dateStr,
        daily_schedule: isToday ? dateStr : null
      } 
    }, {
      onSuccess: () => {
        addNotification(t('task_rescheduled'), "success");
        setRescheduleTaskId(null);
        refetchTasks();
      }
    });
  };

  const todayTasksCombined = React.useMemo(() => {
    const tasksFromAll = allTasks?.filter(t => t.status !== 'done' && (t.due_date === todayDateStr || t.daily_schedule === todayDateStr)) || [];
    const tasksFromSchedule = schedule?.map(s => s.task).filter(Boolean) || [];
    
    const combined = [...tasksFromAll];
    tasksFromSchedule.forEach(st => {
      if (!combined.find(t => t.id === st.id)) {
        combined.push(st);
      }
    });
    
    return combined.sort((a, b) => {
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return 0;
    }).slice(0, 5);
  }, [allTasks, schedule, todayDateStr]);

  if (isInitialLoad && (loadSchedule || loadHabits || loadTasks)) {
    return (
      <LoadingState message="Waking up your OS..." />
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
            <span className="text-xs font-bold uppercase tracking-widest">Life OS Dashboard</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-text-primary tracking-tight">
            {t('good_morning')}, <span className="text-gradient">{profile?.name || "Israa"}</span> 👋
          </h1>
          <p className="text-text-secondary mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {today}
          </p>
        </div>
        
        <div className="flex gap-3">
          {[
            { label: 'Level', value: userXP ? `LVL ${userXP.level}` : 'LVL 1', icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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
            Daily Insight
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
            <section className="animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex flex-col mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-destructive/80 mb-1">
                  PENDING FROM YESTERDAY
                </h3>
                <div className="h-px w-full bg-border/30 mb-4" />
                
                <div className="space-y-3">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full border border-destructive bg-transparent" />
                        <p className="font-medium text-text-primary text-sm flex items-center gap-2">
                          {task.title}
                          {task.due_date && (
                            <span className="text-destructive/50 font-mono text-[10px]">
                              {format(new Date(task.due_date), 'MMM d')}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 relative">
                        <button 
                          onClick={() => setRescheduleTaskId(rescheduleTaskId === task.id ? null : task.id)}
                          className="text-[10px] font-bold px-3 py-1 rounded-lg bg-secondary/50 border border-border hover:bg-secondary text-text-secondary transition-colors"
                        >
                          {t('reschedule')}
                        </button>

                        <AnimatePresence>
                          {rescheduleTaskId === task.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-bg-primary !opacity-100 border-2 border-accent rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                            >
                              <p className="px-3 py-2 text-[10px] uppercase font-bold text-text-secondary tracking-widest border-b border-border mb-1">Options</p>
                              <button onClick={(e) => { e.stopPropagation(); handleReschedule(task, '24h'); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" /> +24 h
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleReschedule(task, 'tomorrow'); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                                <ArrowUpRight className="w-3.5 h-3.5 text-primary" /> {t('tomorrow')}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleReschedule(task, 'next_week'); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg transition-colors flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" /> {t('next_week')}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleReschedule(task, 'calendar'); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg transition-colors flex items-center gap-2 border-t border-border mt-1">
                                <Settings className="w-3.5 h-3.5 text-primary" /> {t('calendar')}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleReschedule(task, 'delete'); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary text-red-500 rounded-lg transition-colors flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> {t('delete')}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="flex flex-col mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-1">
                TODAY'S TASKS
              </h3>
              <div className="h-px w-full bg-border/20 mb-4" />
              
              <div className="space-y-4">
                {todayTasksCombined.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border/30 rounded-2xl">
                    <p className="text-text-secondary font-medium">Your schedule is clear today.</p>
                  </div>
                ) : (
                  todayTasksCombined.map(task => (
                      <motion.div 
                        key={task.id} 
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                            task.priority === 'high' ? 'border-red-500' : 
                            task.priority === 'medium' ? 'border-border' : 'border-green-500'
                          }`} />
                          <p className="font-bold text-text-primary text-sm">
                            {task.title} 
                            <span className="text-accent ml-2 font-mono text-xs">
                              {task.start_time 
                                ? formatTime12h(task.start_time)
                                : ''
                              }
                            </span>
                            <span className="text-text-secondary mx-2">•</span>
                            <span className="text-text-secondary/70 text-xs">{task.estimated_min || 25} min</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              toggleFavorite({ 
                                type: 'task', 
                                item_id: task.id, 
                                title: task.title,
                                metadata: { priority: task.priority, start_time: task.start_time }
                              }).then((res) => {
                                if (res.added) addNotification(t('favorite_added'), 'success');
                                else addNotification(t('favorite_removed'), 'info');
                              });
                            }} 
                            className="p-1.5 transition-colors" 
                            title="Favorite"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFavorited(task.id) ? "fill-red-500 text-red-500" : "text-text-secondary hover:text-red-500"}`} />
                          </button>
                          <Link href={`/tasks?start=${task.id}`}>
                            <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all flex items-center gap-1.5">
                              <Play size={10} className="fill-current" /> {t('start')}
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    ))
                )}
                
                <Link href="/tasks">
                  <div className="mt-4 pt-4 border-t border-border/10">
                    <span className="text-xs text-accent hover:underline font-bold flex items-center gap-1 cursor-pointer">
                      {t('view_all_tasks')} →
                    </span>
                  </div>
                </Link>
              </div>
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
                      onClick={async () => {
                        // Optimistic update
                        const originalHabits = [...(habits || [])];
                        const updatedHabits = originalHabits.map(h => 
                          h.id === habit.id ? { ...h, completed_today: true, current_streak: h.current_streak + 1 } : h
                        );
                        // We can't easily update the SWR/Cache here without the mutate function from useHabits
                        // So we just call the mutation and hope for the best, or use local state.
                        await completeHabit({ id: habit.id }, { onSuccess: refetchHabits });
                      }}
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
        </div>
      </div>
    </div>
  );
};
