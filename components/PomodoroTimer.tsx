import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Minimize2, Timer } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useRecordPomodoroSession } from '../lib/hooks';

type Phase = 'focus' | 'break' | 'long-break';
type PomodoroType = 'classic' | 'deep_work';

const CONFIGS: Record<PomodoroType, { focus: number; break: number; longBreak: number; label: string }> = {
  classic: { focus: 25, break: 5, longBreak: 15, label: 'Classic 25/5' },
  deep_work: { focus: 50, break: 10, longBreak: 20, label: 'Deep Work 50/10' },
};

type Props = {
  taskId: string;
  taskTitle: string;
  pomodoroType?: PomodoroType;
  onClose?: () => void;
  floating?: boolean;
  onMinimize?: () => void;
  autoStart?: boolean;
};

export function PomodoroTimer({
  taskId, taskTitle, pomodoroType = 'classic', onClose, floating = false, onMinimize, autoStart = false
}: Props) {
  const cfg = CONFIGS[pomodoroType] || CONFIGS['classic'];
  const [phase, setPhase] = useState<Phase>('focus');
  const [sessionCount, setSessionCount] = useState(0);
  const [totalSecs, setTotalSecs] = useState(cfg.focus * 60);
  const [remaining, setRemaining] = useState(cfg.focus * 60);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addNotification } = useAppContext();
  const { mutate: recordPomodoro } = useRecordPomodoroSession();

  const phaseDuration = useCallback((): number => {
    if (phase === 'focus') return cfg.focus * 60;
    if (phase === 'long-break') return cfg.longBreak * 60;
    return cfg.break * 60;
  }, [phase, cfg]);

  useEffect(() => {
    const dur = phaseDuration();
    setTotalSecs(dur);
    setRemaining(dur);
    setRunning(false);
  }, [phase, phaseDuration]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handlePhaseEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handlePhaseEnd = async () => {
    setRunning(false);
    if (phase === 'focus') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      // Save to DB
      recordPomodoro({ task_id: taskId, duration_minutes: cfg.focus });

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🍅 جلسة بومودورو اكتملت!', {
          body: `${taskTitle} — وقت الاستراحة!`,
          icon: '/favicon.ico',
        });
      }
      addNotification('✅ جلسة بومودورو اكتملت! وقت أخذ استراحة قصيرة', 'success');
      // 4th break is long
      const nextPhase: Phase = newCount % 4 === 0 ? 'long-break' : 'break';
      setPhase(nextPhase);
    } else {
      addNotification('⚡ انتهت الاستراحة — هيا بنا! جلسة تركيز جديدة', 'success');
      setPhase('focus');
    }
  };

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const progress = 1 - remaining / totalSecs;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - progress);

  const phaseLabel: Record<Phase, string> = {
    focus: 'Focus',
    break: 'Short Break',
    'long-break': 'Long Break',
  };

  // We map the requested theme colors to safe standard tailwind colors 
  // or custom CSS vars if available. We will use generic equivalent if missing setup.
  const phaseColor: Record<Phase, string> = {
    focus: 'text-indigo-500 stroke-indigo-500',
    break: 'text-emerald-500 stroke-emerald-500',
    'long-break': 'text-green-500 stroke-green-500',
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <div className={`${floating
      ? 'fixed bottom-6 right-6 z-50 w-72 glass-card shadow-2xl shadow-indigo-500/20 border-indigo-500/30'
      : 'w-full glass-card border-indigo-500/20'} p-4 rounded-2xl bg-white/5 backdrop-blur-xl`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-indigo-400" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {floating && onMinimize && (
            <button onClick={onMinimize} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <Minimize2 size={14} />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <Square size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Phase label */}
      <div className="text-center mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${phase === 'focus' ? 'text-indigo-400' : 'text-emerald-400'}`}>
          {phaseLabel[phase]}
        </span>
        <div className="text-xs text-gray-400 mt-0.5">
          Session #{sessionCount + 1}
        </div>
      </div>

      {/* Arc Timer */}
      <div className="flex items-center justify-center my-3 relative">
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" className="stroke-white/10" />
            <circle
              cx="50" cy="50" r="40" fill="none" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`transition-all duration-1000 ${phaseColor[phase].split(' ')[1]}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold text-white">{mins}:{secs}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <p className="text-xs text-center text-gray-400 mb-4 truncate max-w-[200px] mx-auto">{taskTitle}</p>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => { setPhase('focus'); setRunning(false); }}
          className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Reset"
        >
          <Square size={18} />
        </button>
        <button
          onClick={() => { setRunning(r => !r); requestNotificationPermission(); }}
          className={`p-3 rounded-xl font-bold text-white transition-all shadow-lg ${running
            ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600'
            : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700'}`}
        >
          {running ? <Pause size={22} className="fill-white" /> : <Play size={22} className="fill-white" />}
        </button>
        <button
          onClick={() => setRunning(false)}
          className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"
          title="Stop"
        >
          <Square size={18} />
        </button>
      </div>

      {/* Sessions dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i < sessionCount % 4 ? 'bg-indigo-500' : 'bg-white/10'}`}
          />
        ))}
      </div>
    </div>
  );
}

export function FloatingPomodoro({ taskId, taskTitle, pomodoroType, onClose, autoStart = false }: Props) {
  const [minimized, setMinimized] = useState(false);
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all text-sm"
        >
          <Timer size={16} /> Return to Pomodoro
        </button>
      </div>
    );
  }
  return (
    <PomodoroTimer
      taskId={taskId}
      taskTitle={taskTitle}
      pomodoroType={pomodoroType}
      onClose={onClose}
      floating
      onMinimize={() => setMinimized(true)}
      autoStart={autoStart}
    />
  );
}
