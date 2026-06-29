import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, Trash2, Clock, ThumbsUp, Frown, Sparkles } from 'lucide-react';
import { Project } from '../../types/projects';
import { useAppContext } from '../../context/AppContext';

interface SessionTrackerProps {
  project: Project;
  onSaveSession: (sessionData: {
    title: string;
    description: string;
    duration: number; // in minutes
    tasksCompleted: string[];
    notes: string;
    mood: 'productive' | 'stuck' | 'breakthrough';
  }) => void;
}

export const SessionTracker: React.FC<SessionTrackerProps> = ({ project, onSaveSession }) => {
  const { language } = useAppContext();
  const isAr = language === 'ar';

  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [mood, setMood] = useState<'productive' | 'stuck' | 'breakthrough'>('productive');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const allSuggestedTasks: string[] = project.milestones
    ? project.milestones.flatMap(m => m.tasks || [])
    : [];

  const handleToggleTask = (task: string) => {
    setSelectedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const handleSave = () => {
    const minutesSpent = Math.max(1, Math.round(seconds / 60));
    onSaveSession({
      title: sessionTitle || (isAr ? `جلسة عمل على ${project.title}` : `Session on ${project.title}`),
      description: isAr ? `تتبع جلسة عمل لمدة ${minutesSpent} دقيقة` : `Session tracking spent ${minutesSpent} minutes`,
      duration: minutesSpent,
      tasksCompleted: selectedTasks,
      notes: sessionNotes,
      mood
    });
    // Reset state
    resetTimer();
    setSessionTitle('');
    setSessionNotes('');
    setSelectedTasks([]);
    setMood('productive');
  };

  return (
    <div className="glass-card p-6 border-accent/20 bg-accent/5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            {isAr ? "جاري العمل الآن" : "Active Session"}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            {isAr ? "تتبع وقتك وإنجازاتك في الوقت الفعلي" : "Track your focus time and progress in real-time"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 bg-bg-secondary rounded-xl border border-border/10">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-sm font-mono font-bold text-text-primary px-1">
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={toggleTimer}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl ${
            isActive 
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10' 
              : 'bg-accent hover:bg-accent/90 text-white shadow-accent/25'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-5 h-5" />
              <span>{isAr ? "إيقاف مؤقت" : "Pause"}</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white" />
              <span>{isAr ? "ابدأ الجلسة" : "Start Focus"}</span>
            </>
          )}
        </button>

        <button
          onClick={resetTimer}
          disabled={seconds === 0}
          className="p-3.5 text-text-secondary hover:text-red-400 bg-bg-secondary hover:bg-red-500/10 rounded-2xl border border-border/10 transition-all disabled:opacity-40 disabled:hover:bg-bg-secondary disabled:hover:text-text-secondary"
          title={isAr ? "إعادة تعيين" : "Reset"}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {seconds > 10 && (
        <div className="space-y-6 pt-6 border-t border-border/10 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
                {isAr ? "عنوان الجلسة" : "Focus Title"}
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder={isAr ? "مثال: بناء نموذج قاعدة البيانات..." : "e.g. Design database schema..."}
                className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 font-medium text-sm focus:border-accent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
                {isAr ? "الحالة والمزاج" : "Session Mood"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMood('productive')}
                  className={`flex items-center justify-center gap-1.5 p-2 px-1.5 rounded-xl border text-xs font-bold transition-all ${
                    mood === 'productive' 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                      : 'bg-bg-secondary border-transparent text-text-secondary hover:bg-accent/10'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{isAr ? "منجز" : "Productive"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMood('stuck')}
                  className={`flex items-center justify-center gap-1.5 p-2 px-1.5 rounded-xl border text-xs font-bold transition-all ${
                    mood === 'stuck' 
                      ? 'bg-red-500/15 border-red-500/30 text-red-400' 
                      : 'bg-bg-secondary border-transparent text-text-secondary hover:bg-accent/10'
                  }`}
                >
                  <Frown className="w-4 h-4" />
                  <span>{isAr ? "عالق" : "Stuck"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMood('breakthrough')}
                  className={`flex items-center justify-center gap-1.5 p-2 px-1.5 rounded-xl border text-xs font-bold transition-all ${
                    mood === 'breakthrough' 
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' 
                      : 'bg-bg-secondary border-transparent text-text-secondary hover:bg-accent/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? "طفرة" : "Insight"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
              {isAr ? "ملاحظات ودروس مستفادة" : "Notes & Retro"}
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder={isAr ? "اكتب ما تم إنجازه، العقبات التي واجهتها..." : "Describe tasks completed, milestones met or lessons learned..."}
              rows={2}
              className="w-full p-3.5 rounded-xl bg-bg-secondary border border-border/15 text-sm focus:border-accent"
            />
          </div>

          {/* Task checklist if active milestones suggest them */}
          {allSuggestedTasks.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
                {isAr ? "المهام المكتملة خلال الجلسة" : "Check Completed Tasks"}
              </label>
              <div className="max-h-36 overflow-y-auto no-scrollbar space-y-2.5 p-1 bg-bg-secondary/40 rounded-xl border border-border/10">
                {allSuggestedTasks.map((t, index) => {
                  const isChecked = selectedTasks.includes(t);
                  return (
                    <label key={index} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTask(t)}
                        className="rounded border-border text-accent focus:ring-accent w-4 h-4"
                      />
                      <span className={`text-xs ${isChecked ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{t}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto h-11 px-6 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? "حفظ الجلسة والتقدم" : "Save Session & Progress"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
