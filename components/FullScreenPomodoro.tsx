import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { useRecordPomodoroSession } from '../lib/hooks';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: any;
};

const fmtTime = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const FullScreenPomodoro = ({ isOpen, onClose, initialTask }: Props) => {
  const { mutate: recordPomodoro } = useRecordPomodoroSession();
  const [task, setTask] = useState<any | null>(initialTask || null);
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [secondsLeft, setSecondsLeft] = useState<number>((initialTask?.workMin || 25) * 60);
  const [cycle, setCycle] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [workMinInput, setWorkMinInput] = useState<number>(task?.workMin || 25);
  const [breakMinInput, setBreakMinInput] = useState<number>(task?.breakMin || 5);
  const [longBreakMinInput, setLongBreakMinInput] = useState<number>(task?.longBreakMin || 15);
  const [stats, setStats] = useState<{ sessions: number; minutes: number }>({ sessions: 0, minutes: 0 });

  useEffect(() => {
    if (initialTask) {
      setTask(initialTask);
      setSecondsLeft((initialTask.workMin || 25) * 60);
      setPhase('work');
      setCycle(0);
      setRunning(false);
    }
    // load persisted settings & stats
    try {
      const s = localStorage.getItem('pomodoroStats');
      if (s) setStats(JSON.parse(s));
      const cfg = localStorage.getItem('pomodoroSettings');
      if (cfg) {
        const parsed = JSON.parse(cfg);
        setWorkMinInput(parsed.workMin || workMinInput);
        setBreakMinInput(parsed.breakMin || breakMinInput);
        setLongBreakMinInput(parsed.longBreakMin || longBreakMinInput);
      }
    } catch (e) { }
  }, [initialTask]);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          // phase end
          if (phase === 'work') {
            const newCount = cycle + 1;
            setCycle(newCount);
            const isDeepWork = (task?.workMin || 25) >= 50;
            const breakTime = newCount % 4 === 0 ? (isDeepWork ? 20 : 15) : (isDeepWork ? 10 : 5);
            recordPomodoro({ task_id: task?.id, duration_minutes: Math.round((task?.workMin || 25)) });
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Focus Complete', { body: 'Time for a break!' });
            }
            setPhase('break');
            setSecondsLeft(breakTime * 60);
            setRunning(false);
            return 0;
          } else {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Break Complete', { body: 'Ready to focus again?' });
            }
            setPhase('work');
            setSecondsLeft((task?.workMin || 25) * 60);
            setRunning(false);
            return 0;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [running, phase, cycle, task, recordPomodoro]);

  if (!isOpen) return null;
  if (!task) return null;
  if (isMinimized) {
    // minimize: set floating-like behavior then close
    onClose();
    return null;
  }

  const total = (phase === 'work' ? (task.workMin || 25) : (task.breakMin || 5)) * 60;
  const pct = ((total - secondsLeft) / total) * 100;
  const C = 2 * Math.PI * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-app-card flex flex-col items-center justify-center p-6 animate-fade-in overflow-hidden"
      >
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ background: phase === 'work' ? 'var(--accent)' : 'var(--accent-2)' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ background: phase === 'work' ? 'var(--accent)' : 'var(--accent-2)' }} />
        </div>

        <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-app truncate max-w-[200px] md:max-w-md">{task.title}</h1>
              <p className="text-app-muted uppercase tracking-[0.2em] text-[10px] mt-1">{phase} mode · cycle #{cycle + (phase === 'work' ? 1 : 0)}</p>
            </div>
            <div className="flex gap-2">
               <button onClick={() => { setIsMinimized(true); }} className="h-10 w-10 rounded-xl bg-app-secondary text-app-muted hover:text-accent flex items-center justify-center transition-all">
                 <Minimize2 className="h-5 w-5" />
               </button>
               <button onClick={onClose} className="h-10 w-10 rounded-xl bg-app-secondary text-app-muted hover:text-danger flex items-center justify-center transition-all">
                 <X className="h-5 w-5" />
               </button>
            </div>
          </div>

          <div className="relative h-[220px] w-[220px] md:h-[280px] md:w-[280px] flex items-center justify-center">
             <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 260 260">
                <circle cx="130" cy="130" r="100" fill="none" stroke="var(--app-secondary)" strokeWidth="6" />
                <circle 
                  cx="130" cy="130" r="100" fill="none" 
                  stroke={phase === 'work' ? 'var(--accent)' : 'var(--accent-2)'} 
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(pct/100) * C} ${C}`}
                  style={{ transition: 'stroke-dasharray 0.5s linear' }}
                />
             </svg>
             <div className="flex flex-col items-center">
               <span className="text-6xl md:text-8xl font-mono font-bold text-app tracking-tighter">{fmtTime(secondsLeft)}</span>
               <div className="mt-3 flex items-center gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-full ${i < cycle % 4 ? 'bg-accent' : 'bg-app-secondary'}`} />
                  ))}
               </div>
             </div>
          </div>

          <div className="mt-12 flex items-center gap-6">
             <button onClick={() => setSoundOn(s => !s)} className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${soundOn ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-app-secondary text-app-muted'}`}>
                {soundOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
             </button>

             <button 
               onClick={() => setRunning(r => !r)}
               className="h-20 w-20 rounded-[30px] bg-accent text-white flex items-center justify-center hover:scale-105 shadow-elevated accent-glow transition-all"
             >
                {running ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
             </button>

             <button onClick={() => { setRunning(false); setSecondsLeft((task.workMin || 25) * 60); setPhase('work'); }} className="h-14 w-14 rounded-2xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center hover:bg-danger/20 transition-all">
                <Square className="h-6 w-6 fill-current" />
             </button>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-[11px] text-app-faint">Sessions: <strong className="ml-1">{stats.sessions}</strong></div>
              <div className="text-[11px] text-app-faint">Minutes: <strong className="ml-1">{stats.minutes}</strong></div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => playTestSound()} className="px-3 py-2 rounded-xl bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80">Test Sound</button>
              <button onClick={() => saveSettings()} className="px-3 py-2 rounded-xl bg-accent text-white">Save Settings</button>
              <button onClick={() => manualRecord()} className="px-3 py-2 rounded-xl bg-emerald-500 text-white">Record Session</button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs">Work</label>
              <input type="number" min={1} value={workMinInput} onChange={e => setWorkMinInput(Number(e.target.value))} className="w-20 p-2 rounded-xl bg-bg-secondary text-text-primary" />
              <label className="text-xs">Break</label>
              <input type="number" min={1} value={breakMinInput} onChange={e => setBreakMinInput(Number(e.target.value))} className="w-20 p-2 rounded-xl bg-bg-secondary text-text-primary" />
              <label className="text-xs">Long</label>
              <input type="number" min={1} value={longBreakMinInput} onChange={e => setLongBreakMinInput(Number(e.target.value))} className="w-20 p-2 rounded-xl bg-bg-secondary text-text-primary" />
            </div>

            <div className="mt-2 text-app-faint text-[11px]">Press <span className="px-1.5 py-0.5 bg-app-secondary rounded border border-app font-mono">Esc</span> to exit</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helpers: simple sound test and save/manual-record functions
const playTestSound = () => {
  try {
    const a = new Audio('/sounds/click.mp3');
    a.volume = 0.4;
    a.play().catch(() => { a.src = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'; a.play().catch(() => {}); });
  } catch (e) { }
};

function saveSettings() {
  try {
    const cfg = {
      workMin: Number((document.querySelector('input[type=number]') as HTMLInputElement)?.value || 25)
    };
    localStorage.setItem('pomodoroSettings', JSON.stringify(cfg));
  } catch (e) { }
}

function manualRecord() {
  try {
    const sRaw = localStorage.getItem('pomodoroStats');
    let s = sRaw ? JSON.parse(sRaw) : { sessions: 0, minutes: 0 };
    s.sessions = (s.sessions || 0) + 1;
    s.minutes = (s.minutes || 0) + 25;
    localStorage.setItem('pomodoroStats', JSON.stringify(s));
  } catch (e) { }
}
