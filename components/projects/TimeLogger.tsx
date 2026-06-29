import React, { useState } from 'react';
import { Calendar, Clock, Smile, Save, HelpCircle, Sparkles } from 'lucide-react';
import { Project } from '../../types/projects';
import { useAppContext } from '../../context/AppContext';

interface TimeLoggerProps {
  project: Project;
  onLogTime: (sessionData: {
    title: string;
    description: string;
    duration: number; // in minutes
    tasksCompleted: string[];
    notes: string;
    mood: 'productive' | 'stuck' | 'breakthrough';
    date: string;
  }) => void;
}

export const TimeLogger: React.FC<TimeLoggerProps> = ({ project, onLogTime }) => {
  const { language } = useAppContext();
  const isAr = language === 'ar';

  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [mood, setMood] = useState<'productive' | 'stuck' | 'breakthrough'>('productive');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);

  const allSuggestedTasks: string[] = project.milestones
    ? project.milestones.flatMap(m => m.tasks || [])
    : [];

  const handleToggleTask = (task: string) => {
    setSelectedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const handleSave = () => {
    const calculatedMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    if (calculatedMinutes <= 0) {
      return alert(isAr ? "الرجاء إدخال وقت صحيح." : "Please provide a valid duration.");
    }

    onLogTime({
      title: sessionTitle || (isAr ? `سجل عمل مسبق تتبع ${project.title}` : `Retro session tracking ${project.title}`),
      description: isAr ? `تسجيل وقت يدوي لقضاء ${calculatedMinutes} دقيقة` : `Manual log tracking ${calculatedMinutes} minutes`,
      duration: calculatedMinutes,
      tasksCompleted: selectedTasks,
      notes: sessionNotes,
      mood,
      date: logDate
    });

    // Reset forms
    setHours('1');
    setMinutes('0');
    setSessionTitle('');
    setSessionNotes('');
    setSelectedTasks([]);
    setLogDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <div>
        <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          {isAr ? "إدخال وقت بأثر رجعي" : "Log Time Manually"}
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          {isAr ? "سجل الساعات الجاهزة المكتملة دون استخدام مؤقت" : "Record your pre-completed focused hours manually without using stopwatch"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Hours & Minutes */}
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
            {isAr ? "الساعات" : "Hours"}
          </label>
          <input
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 font-mono text-center text-sm font-bold focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
            {isAr ? "الدقائق" : "Minutes"}
          </label>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 font-mono text-center text-sm font-bold focus:border-accent"
          />
        </div>
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
            {isAr ? "التاريخ" : "Date Worked"}
          </label>
          <div className="relative">
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full h-11 px-4 pr-10 rounded-xl bg-bg-secondary border border-border/15 text-xs text-text-primary"
            />
            <Calendar className="absolute top-3.5 right-3.5 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
            {isAr ? "موضوع الإنجاز" : "Task/Focus Title"}
          </label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder={isAr ? "مثال: واجهة الصفحة الرئيسية..." : "e.g. Design homepage layout..."}
            className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 text-sm"
          />
        </div>
        {/* Mood */}
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
            {isAr ? "الحالة النفسية والمزاج" : "Mood Score"}
          </label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value as any)}
            className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 text-xs text-text-primary focus:border-accent appearance-none relative"
          >
            <option value="productive">{isAr ? "🔥 منجز ومتحمس" : "🔥 Highly Productive"}</option>
            <option value="stuck">{isAr ? "⚠️ عالق أو مشتت" : "⚠️ Felt Stuck"}</option>
            <option value="breakthrough">{isAr ? "✨ حدث طفرة أو إلهام" : "✨ Breakthrough Ideas"}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
          {isAr ? "ملاحظات ودروس مستفادة" : "Key Session Notes & Retro"}
        </label>
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder={isAr ? "شرح مختصر لما قمت به وأي تحديات تخطيتها..." : "Brief summary of achievements or bottlenecks overcome..."}
          rows={2}
          className="w-full p-4 rounded-xl bg-bg-secondary border border-border/15 text-sm"
        />
      </div>

      {allSuggestedTasks.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
            {isAr ? "ربطه بالمهام المطلوبة" : "Link Completed Tasks"}
          </label>
          <div className="max-h-28 overflow-y-auto no-scrollbar space-y-2 p-1.5 bg-bg-secondary/40 rounded-xl border border-border/10">
            {allSuggestedTasks.map((t, idx) => {
              const checked = selectedTasks.includes(t);
              return (
                <label key={idx} className="flex items-center gap-3 p-1.5 rounded-lg cursor-pointer hover:bg-accent/5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleTask(t)}
                    className="rounded border-border text-accent focus:ring-accent w-4 h-4"
                  />
                  <span className={`text-xs ${checked ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{t}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full h-11 px-6 bg-bg-secondary hover:bg-accent hover:text-white border border-border/10 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
      >
        <Save className="w-4 h-4" />
        <span>{isAr ? "تسجيل الساعات" : "Log retrospect hours"}</span>
      </button>
    </div>
  );
};
