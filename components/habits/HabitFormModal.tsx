import React from "react";
import { motion } from "framer-motion";
import { X, Loader2, type LucideIcon } from "lucide-react";

import { 
  Droplet, BookOpen, Dumbbell, Brain, Heart, Sun, Moon, Apple, Target,
  PenLine, Footprints, Sparkles
} from "lucide-react";

export const CATEGORIES = ["spiritual", "health", "learning", "productivity", "social", "work", "fitness", "mindfulness"] as const;
export const FREQUENCIES = ["daily", "weekly"] as const;
export const REMINDER_OPTIONS = [60, 30, 15, 0] as const;

export const ICONS: { key: string; Icon: LucideIcon; color: string }[] = [
  { key: "water",     Icon: Droplet,     color: "#5BA3D0" },
  { key: "read",      Icon: BookOpen,    color: "#A88B6B" },
  { key: "workout",   Icon: Dumbbell,    color: "#C96B5A" },
  { key: "run",       Icon: Footprints,  color: "#D4A574" },
  { key: "focus",     Icon: Target,      color: "#6B8A6E" },
  { key: "write",     Icon: PenLine,     color: "#9B82CC" },
  { key: "mind",      Icon: Brain,       color: "#E8927C" },
  { key: "sleep",     Icon: Moon,        color: "#7B92B0" },
  { key: "morning",   Icon: Sun,         color: "#E8B84A" },
  { key: "diet",      Icon: Apple,       color: "#C96B5A" },
  { key: "love",      Icon: Heart,       color: "#E84A6F" },
  { key: "spark",     Icon: Sparkles,    color: "#9B82CC" },
];

export interface HabitForm {
  id?: string;
  title: string;
  icon: string;
  category: typeof CATEGORIES[number];
  frequency: typeof FREQUENCIES[number];
  target_per_day: number;
  xp_per_complete: number;
  reminder_time: string;
  reminders: number[];
}

interface HabitFormModalProps {
  form: HabitForm;
  setForm: (form: HabitForm) => void;
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
  t: (key: string) => string;
}

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  form,
  setForm,
  isOpen,
  onClose,
  onSave,
  isSaving,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.form 
        onSubmit={onSave}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-lg bg-bg-primary border border-border rounded-[2.5rem] shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar z-10"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-display font-bold">{form.id ? t('editHabit') : t('newHabit')}</h2>
          <button type="button" onClick={onClose} className="p-3 bg-bg-secondary rounded-2xl hover:scale-110 transition-transform cursor-pointer"><X /></button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">What Routine?</label>
          <input 
            autoFocus
            required
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            placeholder="e.g. Master the morning"
            className="w-full bg-bg-secondary/50 border border-border rounded-3xl px-6 py-5 outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all text-xl font-bold"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Pick a symbol</label>
          <div className="grid grid-cols-6 gap-3">
            {ICONS.map(item => (
              <button 
                key={item.key}
                type="button"
                onClick={() => setForm({...form, icon: item.key})}
                className={`aspect-square rounded-2xl flex items-center justify-center transition-all cursor-pointer ${form.icon === item.key ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-110' : 'bg-bg-secondary hover:bg-border/20 text-text-secondary'}`}
              >
                <item.Icon size={20} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Category</label>
            <select 
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value as any})}
              className="w-full h-14 rounded-2xl bg-bg-secondary border border-border px-4 font-bold outline-none cursor-pointer"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">How often?</label>
            <select 
              value={form.frequency}
              onChange={e => setForm({...form, frequency: e.target.value as any})}
              className="w-full h-14 rounded-2xl bg-bg-secondary border border-border px-4 font-bold outline-none cursor-pointer"
            >
              {FREQUENCIES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Target times</label>
            <span className="text-xl font-display font-bold text-accent">{form.target_per_day}×</span>
          </div>
          <input 
            type="range" min={1} max={10} step={1}
            value={form.target_per_day}
            onChange={e => setForm({...form, target_per_day: Number(e.target.value)})}
            className="w-full accent-accent h-2 bg-bg-secondary rounded-full appearance-none cursor-pointer"
          />
        </div>

        <div className="bg-bg-secondary/50 rounded-3xl p-6 border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Reminders</label>
            <input 
              type="time" 
              value={form.reminder_time}
              onChange={e => setForm({...form, reminder_time: e.target.value})}
              className="bg-bg-primary border border-border rounded-xl px-3 py-1 font-mono font-bold text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map(m => {
              const active = form.reminders.includes(m);
              return (
                <button 
                  key={m}
                  type="button"
                  onClick={() => {
                    const next = active ? form.reminders.filter(x => x !== m) : [...form.reminders, m].sort((a,b) => b-a);
                    setForm({...form, reminders: next});
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${active ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-bg-primary border border-border text-text-secondary opacity-60'}`}
                >
                  {m === 0 ? 'On time' : `${m}m before`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-5 rounded-3xl font-bold text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex-[2] py-5 rounded-3xl font-bold bg-accent text-white shadow-2xl shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : (form.id ? 'Save Habit' : 'Deploy Routine')}
          </button>
        </div>
      </motion.form>
    </div>
  );
};
