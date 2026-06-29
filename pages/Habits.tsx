import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useGetHabits, useCompleteHabit, useCreateHabit, useDeleteHabit, useUpdateHabit } from '../lib/hooks';
import { formatTime12h } from '../lib/utils';
import { playCastSpellSound } from '../lib/audio-magic';
import { supabase } from '../lib/supabase';
import { 
  Plus, Flame, Trophy, Pencil, Trash2, Bell, BellOff, Check, Loader2, LayoutGrid, Table
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HabitHeatmap } from '../components/habits/HabitHeatmap';
import { 
  HabitFormModal, 
  HabitForm, 
  ICONS 
} from '../components/habits/HabitFormModal';

function iconFor(key: string) {
  return ICONS.find((i) => i.key === key) ?? ICONS[4]; // Default to focus
}

const EMPTY_FORM: HabitForm = {
  title: "", icon: "focus", category: "health", frequency: "daily",
  target_per_day: 1, xp_per_complete: 20, reminder_time: "", reminders: [],
};

export const Habits = () => {
  const { data: habitsData, loading: isLoading, refetch } = useGetHabits();
  const { mutate: completeHabit } = useCompleteHabit();
  const { mutate: createHabit, isPending: isCreating } = useCreateHabit();
  const { mutate: deleteHabit } = useDeleteHabit();
  const { mutate: updateHabit } = useUpdateHabit();
  const { addNotification, language, t } = useAppContext();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<HabitForm>(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('habitsViewMode') as 'cards' | 'table') || 'cards';
  });

  const habits = habitsData || [];

  const handleSetViewMode = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('habitsViewMode', mode);
  };

  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const getDayName = (date: Date, isAr: boolean) => {
    const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayIdx = date.getDay();
    return isAr ? daysAr[dayIdx] : daysEn[dayIdx];
  };

  const formatDateDayMonth = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const toggleHabitDay = async (h: any, dateStr: string) => {
    const existingLog = h.habit_logs?.find((l: any) => l.completed_at?.split('T')[0] === dateStr);
    const todayStr = new Date().toISOString().split('T')[0];
    const isAr = language === 'ar';
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addNotification(isAr ? 'يجب تسجيل الدخول أولاً' : 'Please log in first', 'error');
        return;
      }

      if (existingLog) {
        // delete the log
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existingLog.id);
        
        if (error) throw error;
        
        // If today's log, update the current streak
        if (dateStr === todayStr) {
          const currentStreak = Math.max(0, (h.current_streak || 0) - 1);
          await supabase
            .from('habits')
            .update({ current_streak: currentStreak })
            .eq('id', h.id);
        }
        addNotification(isAr ? 'تم إلغاء تسجيل العادة!' : 'Habit log removed!', 'info');
      } else {
        // insert log for the day
        const completedAt = `${dateStr}T12:00:00.000Z`;
        const { error } = await supabase
          .from('habit_logs')
          .insert({
            habit_id: h.id,
            user_id: user.id,
            completed_at: completedAt
          });

        if (error) throw error;

        if (dateStr === todayStr) {
          await supabase
            .from('habits')
            .update({ current_streak: (h.current_streak || 0) + 1 })
            .eq('id', h.id);
        }
        playCastSpellSound();
        addNotification(isAr ? 'تم تسجيل العادة بنجاح!' : 'Habit logged successfully!', 'success');
      }
      refetch();
    } catch (err: any) {
      console.error('Error toggling habit day:', err);
      addNotification(isAr ? 'حدث خطأ أثناء حفظ التغييرات' : 'Error updating habit log', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      title: form.title,
      emoji: form.icon, // reusing emoji col for icon key
      category: form.category,
      frequency: form.frequency,
      target_per_day: form.target_per_day,
      xp_per_complete: form.xp_per_complete,
      reminder_time: form.reminder_time || null,
      reminders: form.reminders,
      is_active: true
    };

    if (form.id) {
      updateHabit({ id: form.id, data: payload }, {
        onSuccess: () => {
          addNotification(t('note_saved'), 'success');
          setShowModal(false);
          refetch();
        }
      });
    } else {
      createHabit({ data: payload }, {
        onSuccess: () => {
          addNotification(t('habit_created'), 'success');
          setShowModal(false);
          setForm(EMPTY_FORM);
          refetch();
        }
      });
    }
  };

  const handleComplete = (h: any) => {
    completeHabit({ id: h.id }, {
      onSuccess: () => {
        refetch();
        playCastSpellSound();
        addNotification(t('habit_logged'), 'success');
      }
    });
  };

  const openEdit = (h: any) => {
    setForm({
      id: h.id,
      title: h.title,
      icon: h.emoji || 'focus',
      category: h.category as any,
      frequency: h.frequency as any,
      target_per_day: h.target_per_day || 1,
      xp_per_complete: h.xp_per_complete || 20,
      reminder_time: h.reminder_time?.slice(0, 5) || "",
      reminders: h.reminders || []
    });
    setShowModal(true);
  };

  const todaysCount = (h: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return h.habit_logs?.filter((l: any) => l.completed_at?.split('T')[0] === todayStr).length || 0;
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

  const bestStreak = habits.reduce((m, h) => Math.max(m, h.best_streak || 0), 0);
  const doneCount = habits.filter(h => todaysCount(h) >= (h.target_per_day || 1)).length;
  const progressPct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight">{t('habits')}</h1>
            <p className="text-sm text-text-secondary mt-1 font-medium italic opacity-70">"Consistency is the bridge between goals and accomplishment."</p>
          </div>
          <button 
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
            className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} /> {t('addHabit')}
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col gap-1 ring-1 ring-white/5 shadow-2xl">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Best Streak</span>
            <div className="flex items-center gap-2">
               <Flame className="text-orange-500 w-6 h-6" />
               <span className="text-3xl font-display font-bold">{bestStreak}</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex flex-col gap-1 ring-1 ring-accent/10 border-accent/20">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Today's Progress</span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-display font-bold">{progressPct}%</span>
              <span className="text-sm font-bold text-text-secondary">{doneCount}/{habits.length}</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Active Habits</span>
            <span className="text-3xl font-display font-bold">{habits.length}</span>
          </motion.div>
        </div>

        {/* View Mode Selector Toolbar */}
        {habits.length > 0 && (
          <div className="flex items-center justify-between border-b border-border/10 pb-4 flex-wrap gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider font-mono">
              {language === 'ar' ? 'نمط عرض العادات:' : 'Habits View Mode:'}
            </span>
            <div className="flex bg-bg-secondary/40 border border-border/10 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => handleSetViewMode('cards')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                <LayoutGrid size={14} />
                <span>{language === 'ar' ? 'عرض الكروت' : 'Cards View'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('table')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                <Table size={14} />
                <span>{language === 'ar' ? 'عرض الجدول' : 'Table View'}</span>
              </button>
            </div>
          </div>
        )}

        {habits.length === 0 && (
          <div className="glass-card p-20 flex flex-col items-center gap-6 text-center shadow-inner border-dashed">
            <div>
              <h3 className="text-xl font-bold">No routines established yet</h3>
              <p className="text-text-secondary mt-2 max-w-sm">Start your journey today by creating a single meaningful habit.</p>
            </div>
            <button 
               type="button"
               onClick={() => setShowModal(true)}
               className="bg-bg-secondary border border-border px-8 py-3 rounded-2xl font-bold hover:bg-border transition-all"
            >
              Start First Habit
            </button>
          </div>
        )}

        {habits.length > 0 && (
          viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {habits.map((h: any, i: number) => {
                const count = todaysCount(h);
                const target = h.target_per_day || 1;
                const progress = Math.min(100, Math.round((count / target) * 100));
                const isDone = count >= target;
                const habitLogs = new Set<string>(h.habit_logs?.map((l: any) => l.completed_at?.split('T')[0]).filter(Boolean) || []);
                const { Icon, color } = iconFor(h.emoji || 'focus');

                return (
                  <motion.div 
                    key={h.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-6 flex flex-col gap-4 group hover:ring-2 hover:ring-accent/20 transition-all border-border/40"
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon style={{ color }} size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-text-primary truncate">{h.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase font-black tracking-tighter px-2 py-0.5 rounded-lg bg-bg-secondary text-text-secondary">
                            {(() => {
                              const cat = String(h.category || 'health').toLowerCase();
                              if (language === 'ar') {
                                if (cat === 'spiritual') return 'روحاني';
                                if (cat === 'health') return 'صحة';
                                if (cat === 'learning') return 'تعلم';
                                if (cat === 'productivity') return 'إنتاجية';
                                if (cat === 'social') return 'اجتماعي';
                                if (cat === 'work') return 'عمل';
                                if (cat === 'fitness') return 'لياقة بدنية';
                                if (cat === 'mindfulness') return 'يقظة ذهنية';
                                return cat;
                              }
                              return cat;
                            })()}
                          </span>
                          <span className="text-[10px] font-bold text-text-secondary opacity-40">{h.frequency}</span>
                          {target > 1 && <span className="text-[10px] font-bold text-accent">{target}×/day</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs font-bold text-text-secondary">
                           <span className="flex items-center gap-1"><Flame size={14} className="text-orange-500" /> {h.current_streak || 0} {t('streak')}</span>
                           <span className="flex items-center gap-1 opacity-50"><Trophy size={14} /> {h.best_streak || 0}</span>
                           <span className="text-accent">+20 XP</span>
                           {h.reminder_time && (
                             <span className="flex items-center gap-1 text-accent/70"><Bell size={12} /> {formatTime12h(h.reminder_time)}</span>
                           )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openEdit(h)} className="p-2 hover:bg-bg-secondary rounded-xl text-text-secondary transition-colors"><Pencil size={14} /></button>
                        <button type="button" onClick={() => setConfirmDel(h)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-text-secondary transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {target > 1 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase opacity-40">
                          <span>Today</span>
                          <span>{count}/{target}</span>
                        </div>
                        <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-accent"
                          />
                        </div>
                      </div>
                    )}

                    <HabitHeatmap logs={habitLogs} />

                    <button
                      type="button"
                      onClick={() => !isDone && handleComplete(h)}
                      disabled={isDone}
                      className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                        isDone 
                        ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 cursor-default' 
                        : 'bg-accent text-white shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95'
                      }`}
                    >
                      {isDone ? <><Check size={20} className="stroke-[3]" /> {language === 'ar' ? 'تم لليوم' : 'Done for Today'}</> : <><Plus size={20} /> {language === 'ar' ? '+1 تسجيل' : '+1 Keep going'}</>}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Table View with Row = Habits, Col = Last 7 Days */
            <div className="glass-card overflow-hidden border border-border/10 shadow-2xl rounded-3xl">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/10 bg-bg-secondary/20">
                      <th className={`p-4 text-xs font-bold text-text-secondary uppercase tracking-widest min-w-[200px] sticky left-0 bg-bg-primary/95 backdrop-blur-md z-10 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {language === 'ar' ? 'العادة' : 'Habit'}
                      </th>
                      {getLast7Days().map((date, idx) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isTodayDate = dateStr === new Date().toISOString().split('T')[0];
                        return (
                          <th key={idx} className="p-3 text-center min-w-[90px] font-sans">
                            <div className={`inline-flex flex-col items-center py-1 px-3 rounded-xl ${isTodayDate ? 'bg-accent/15 ring-1 ring-accent/20 text-accent font-black' : 'text-text-secondary'}`}>
                              <span className="text-[11px] font-bold uppercase">{getDayName(date, language === 'ar')}</span>
                              <span className="text-[10px] font-mono opacity-60 mt-0.5">{formatDateDayMonth(date)}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/5">
                    {habits.map((h: any) => {
                      const habitLogs = new Set<string>(h.habit_logs?.map((l: any) => l.completed_at?.split('T')[0]).filter(Boolean) || []);
                      const { Icon, color } = iconFor(h.emoji || 'focus');
                      const target = h.target_per_day || 1;

                      return (
                        <tr key={h.id} className="group hover:bg-bg-secondary/20 transition-colors">
                          <td className={`p-4 sticky left-0 bg-bg-primary/95 backdrop-blur-md z-10 flex items-center gap-3 min-w-[200px] border-r border-border/5`}>
                            <div 
                              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                              style={{ backgroundColor: `${color}15` }}
                            >
                              <Icon style={{ color }} size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-text-primary truncate block max-w-[120px]" title={h.title}>{h.title}</span>
                                <button 
                                  type="button" 
                                  onClick={() => openEdit(h)} 
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-secondary rounded text-text-secondary transition-all cursor-pointer"
                                  title={language === 'ar' ? 'تعديل' : 'Edit'}
                                >
                                  <Pencil size={11} />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setConfirmDel(h)} 
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-text-secondary transition-all cursor-pointer"
                                  title={language === 'ar' ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-text-secondary opacity-60">
                                <span className="flex items-center gap-0.5"><Flame size={11} className="text-orange-500" /> {h.current_streak || 0}</span>
                                <span>•</span>
                                <span>{target > 1 ? `${target}×` : h.frequency}</span>
                              </div>
                            </div>
                          </td>

                          {getLast7Days().map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isCompleted = habitLogs.has(dateStr);

                            return (
                              <td key={idx} className="p-3 text-center">
                                <div className="flex justify-center items-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleHabitDay(h, dateStr)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${
                                      isCompleted
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105 ring-2 ring-emerald-500/15'
                                        : 'border border-border/60 hover:border-accent hover:bg-accent/5 text-transparent hover:text-accent/40'
                                    }`}
                                    title={isCompleted ? (language === 'ar' ? 'مكتمل - اضغط لإلغاء التسجيل' : 'Completed - Click to remove') : (language === 'ar' ? 'اضغط للتسجيل' : 'Click to complete')}
                                  >
                                    <Check size={14} className={isCompleted ? 'stroke-[3.5]' : 'stroke-[2]'} />
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      
      <AnimatePresence>
        <HabitFormModal
          form={form}
          setForm={setForm}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          isSaving={isCreating}
          t={t}
        />
      </AnimatePresence>

      <AnimatePresence>
        {confirmDel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDel(null)}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-bg-primary border border-border rounded-[2rem] p-8 max-w-sm w-full space-y-6 text-center"
               onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Delete this routine?</h3>
                <p className="text-sm text-text-secondary">This action cannot be undone. All streak data will be archived.</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmDel(null)} className="flex-1 py-4 font-bold bg-bg-secondary rounded-2xl">Wait, no</button>
                <button 
                  type="button"
                  onClick={() => {
                    deleteHabit({ id: confirmDel.id }, { onSuccess: () => { setConfirmDel(null); refetch(); addNotification(t('note_deleted'), 'success'); } });
                  }} 
                  className="flex-1 py-4 font-bold bg-red-500 text-white rounded-2xl shadow-xl shadow-red-500/20"
                >
                  Yes, delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
