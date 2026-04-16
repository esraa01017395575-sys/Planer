import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useGetHabits, useCompleteHabit, useCreateHabit } from '../lib/hooks';
import { Flame, Activity, Sparkles, Plus, X, CheckCircle2, MoreVertical, Trophy, Target, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const CATEGORIES = ['spiritual', 'health', 'learning', 'productivity', 'social'] as const;
const EMOJIS = ['🧘', '💪', '📚', '🏃', '🎯', '✍️', '💧', '🌙', '☀️', '🍎', '🧠', '💤'];

export default function Habits() {
  const { data: habits, isLoading, refetch } = useGetHabits();
  const { mutate: completeHabit } = useCompleteHabit();
  const { mutate: createHabit, isPending: isCreating } = useCreateHabit();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'health' as typeof CATEGORIES[number],
    emoji: '💪',
    frequency: 'daily' as 'daily' | 'weekly',
    target_count: 1,
    xp_per_complete: 20,
  });

  const handleComplete = (id: string) => {
    completeHabit({ id }, {
      onSuccess: () => {
        refetch();
        toast({ title: '✅ Habit logged! +XP gained' });
      },
      onError: () => toast({ title: 'Failed to log habit', variant: 'destructive' }),
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createHabit(
      { data: { ...form, is_active: true } as any },
      {
        onSuccess: () => {
          toast({ title: 'Habit created!', description: `${form.emoji} ${form.title}` });
          setShowModal(false);
          setForm({ title: '', description: '', category: 'health', emoji: '💪', frequency: 'daily', target_count: 1, xp_per_complete: 20 });
          refetch();
        },
        onError: () => toast({ title: 'Failed to create habit', variant: 'destructive' }),
      }
    );
  };

  if (isLoading) return <AppShell><LoadingState message="Loading habits..." /></AppShell>;

  const activeHabits = habits?.filter(h => h.is_active) || [];
  const bestStreak = activeHabits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0);
  const completedToday = activeHabits.filter(h => (h as any).completed_today).length;
  const weeklyPct = activeHabits.length > 0 ? Math.round((completedToday / activeHabits.length) * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Habits</h1>
            <p className="text-muted-foreground mt-1">Build consistency, level up your life.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-95"
          >
            <Plus size={18} /> New Habit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-3">
              <Flame size={24} />
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{bestStreak}</p>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">Best Streak</p>
          </div>
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center border-primary/30">
            <div className="text-4xl font-display font-bold text-primary mb-2">{weeklyPct}%</div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Today's Progress</p>
          </div>
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-display font-bold text-foreground mb-2">{activeHabits.length}</div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Habits</p>
          </div>
        </div>

        <div className="space-y-4">
          {activeHabits.length === 0 && (
            <div className="glass-card p-12 flex flex-col items-center gap-4 text-center">
              <div className="text-5xl">🎯</div>
              <h3 className="text-xl font-bold">No habits yet</h3>
              <p className="text-muted-foreground">Start building your daily routines for a better life.</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                Create First Habit
              </button>
            </div>
          )}

          {activeHabits.map((habit) => {
            const weekLogs: boolean[] = (habit as any).week_logs || Array(7).fill(false);
            const completedToday = (habit as any).completed_today || false;
            return (
              <div key={habit.id} className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-border transition-colors">
                <div className="flex items-center gap-4 min-w-[250px]">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-2xl shadow-inner border border-border/50">
                    {habit.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground">{habit.title}</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {habit.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="font-mono text-accent font-bold flex items-center gap-1">
                        <Flame size={14} /> {habit.current_streak || 0} days
                      </span>
                      <span className="text-muted-foreground border-l border-border pl-3">+{habit.xp_per_complete} XP</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground">{day}</span>
                      <div className={`w-6 h-6 rounded-md border ${weekLogs[i] ? 'bg-primary border-primary shadow-[0_0_10px_var(--color-primary)] opacity-80' : 'bg-secondary border-border'}`} />
                    </div>
                  ))}
                </div>

                <div className="min-w-[140px] flex justify-end">
                  {completedToday ? (
                    <button disabled className="w-full flex items-center justify-center gap-2 bg-secondary text-muted-foreground py-3 rounded-xl font-bold cursor-not-allowed border border-border">
                      <Check size={18} /> Done Today
                    </button>
                  ) : (
                    <button
                      onClick={() => handleComplete(habit.id)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground py-3 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Habit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">New Habit</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Title *</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Morning Meditation"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, emoji }))}
                      className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center transition-all ${form.emoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any }))}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary transition-all"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">XP per completion: {form.xp_per_complete}</label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={form.xp_per_complete}
                  onChange={e => setForm(f => ({ ...f, xp_per_complete: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !form.title.trim()}
                  className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
