import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Timer, Play, Pause, Square, ArrowLeft, Volume2, VolumeX, SkipForward, Flame
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const PomodoroPage = ({ params }: { params: { taskId: string } }) => {
  const [location, setLocation] = useLocation();
  const { 
    language, t,
    activePomodoro, setActivePomodoro,
    pomodoroTime, setPomodoroTime,
    initialPomodoroTime, setInitialPomodoroTime,
    isPomodoroRunning, setIsPomodoroRunning,
    pomodoroPhase, setPomodoroPhase,
    pomodoroCount,
    soundMuted, setSoundMuted,
    setIsPomodoroMinimized,
    addNotification
  } = useAppContext();

  // If no active pomodoro is in context (e.g. direct URL navigation), construct a default task context
  useEffect(() => {
    if (!activePomodoro) {
      setActivePomodoro({
        id: params.taskId,
        title: language === 'ar' ? 'جلسة تركيز نشطة' : 'Active Focus Session',
        estimated_min: 25
      });
      setPomodoroTime(25 * 60);
      setInitialPomodoroTime(25 * 60);
      setIsPomodoroRunning(false);
      setPomodoroPhase('focus');
    }
    // Always maximize when on the main page
    setIsPomodoroMinimized(false);
  }, [params.taskId, activePomodoro]);

  const handleSkip = () => {
    if (pomodoroPhase === 'focus') {
      setPomodoroPhase('break');
      setPomodoroTime(5 * 60);
      setInitialPomodoroTime(5 * 60);
      addNotification(language === 'ar' ? 'تم تخطي جلسة التركيز إلى الاستراحة' : 'Focus session skipped to Break', 'info');
    } else {
      setPomodoroPhase('focus');
      const focusSecs = (activePomodoro?.estimated_min || 25) * 60;
      setPomodoroTime(focusSecs);
      setInitialPomodoroTime(focusSecs);
      addNotification(language === 'ar' ? 'بدأت جلسة تركيز جديدة' : 'New focus session started', 'info');
    }
  };

  const minutes = String(Math.floor(pomodoroTime / 60)).padStart(2, '0');
  const seconds = String(pomodoroTime % 60).padStart(2, '0');
  const progress = initialPomodoroTime > 0 ? (1 - pomodoroTime / initialPomodoroTime) : 0;
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary px-4 lg:px-8 py-8 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-accent/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />

      {/* Floating Exit/Return header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <button 
          onClick={() => {
            // Minimize floating widget before leaving
            setIsPomodoroMinimized(true);
            setLocation('/tasks');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-bg-card/40 border border-border/50 hover:bg-bg-secondary hover:scale-105 transition-all shadow-md text-text-secondary hover:text-text-primary text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'ar' ? 'العودة للمهام' : 'Return to Tasks'}</span>
        </button>

        <button 
          onClick={() => setSoundMuted(!soundMuted)}
          className={`p-3 rounded-2xl border transition-all ${soundMuted ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-accent/10 border-accent/20 text-accent'} shadow-md hover:scale-110`}
          title={soundMuted ? (language === 'ar' ? 'تشغيل الصوت' : 'Unmute Sound') : (language === 'ar' ? 'كتم الصوت' : 'Mute Sound')}
        >
          {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full max-w-xl flex flex-col items-center justify-center text-center relative z-10 space-y-8 mt-12">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-black uppercase tracking-widest leading-none">
            <Timer className="w-3.5 h-3.5" />
            <span>{pomodoroPhase === 'focus' ? (language === 'ar' ? 'وقت التركيز 🍅' : 'Focus Session 🍅') : (language === 'ar' ? 'وقت استراحة ☕' : 'Break Time ☕')}</span>
          </div>
          <h1>
            <span className="block text-3xl font-display font-black tracking-tight mt-2 text-text-primary max-w-lg mx-auto leading-tight truncate">
              {activePomodoro?.title || (language === 'ar' ? 'جلسة تركيز نشطة' : 'Active Focus Session')}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary font-bold uppercase tracking-widest opacity-80 mt-1">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>{language === 'ar' ? `جلسة رقم #${pomodoroCount + 1}` : `Session #${pomodoroCount + 1}`}</span>
          </div>
        </header>

        {/* Big Breathtaking Circular Clock */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* Pulsing ring during active focus */}
          {isPomodoroRunning && (
            <motion.div 
              animate={{ scale: [1, 1.03, 1] }} 
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/5 to-indigo-500/5 blur-md" 
            />
          )}

          <svg width="100%" height="100%" viewBox="0 0 250 250" className="absolute">
            {/* Background circle */}
            <circle 
              cx="125" 
              cy="125" 
              r="110" 
              fill="none" 
              strokeWidth="6" 
              className="stroke-border/10 dark:stroke-white/[0.04]" 
            />
            {/* Countdown arc */}
            <motion.circle 
              cx="125" 
              cy="125" 
              r="110" 
              fill="none" 
              strokeWidth="7" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`transition-all duration-1000 ${pomodoroPhase === 'focus' ? 'stroke-accent' : 'stroke-emerald-500'}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '125px 125px' }}
            />
          </svg>

          {/* Clock Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
            <span className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-text-primary">
              {minutes}:{seconds}
            </span>
            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.25em] tracking-widest opacity-60">
              {pomodoroPhase === 'focus' ? (language === 'ar' ? 'قم بالتركيز' : 'STAY FOCUSED') : (language === 'ar' ? 'استـرح قليلاً' : 'RELAX MIND')}
            </span>
          </div>
        </div>

        {/* Ticking indicator bar or small dots */}
        <div className="flex justify-center items-center gap-2 py-1">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i < pomodoroCount % 4 
                  ? 'w-6 bg-accent' 
                  : i === pomodoroCount % 4 
                    ? 'w-3 bg-accent/40 animate-pulse' 
                    : 'w-2 bg-border'
              }`} 
            />
          ))}
        </div>

        {/* Large Controls and Options Panel */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              setIsPomodoroRunning(false);
              const duration = (activePomodoro?.estimated_min || 25) * 60;
              setPomodoroTime(duration);
              setInitialPomodoroTime(duration);
              addNotification(language === 'ar' ? 'تمت إعادة تعيين المؤقت' : 'Timer reset', 'info');
            }}
            className="p-4 rounded-2xl bg-bg-card border border-border/50 hover:bg-bg-secondary text-text-secondary hover:text-white transition-all shadow-md active:scale-95"
            title={language === 'ar' ? 'إعادة التعيين' : 'Reset'}
          >
            <Square className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
            className={`px-8 py-4 rounded-3xl font-black text-white text-lg transition-all shadow-xl active:scale-95 ${
              isPomodoroRunning 
                ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600' 
                : 'bg-accent shadow-accent/20 hover:bg-accent-glow'
            }`}
          >
            {isPomodoroRunning ? (
              <span className="flex items-center gap-2">
                <Pause className="w-5 h-5 fill-current" />
                <span>{language === 'ar' ? 'إيقاف مؤقت' : 'Pause'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span>{language === 'ar' ? 'بدء التركيز' : 'Start Focus'}</span>
              </span>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="p-4 rounded-2xl bg-bg-card border border-border/50 hover:bg-bg-secondary text-text-secondary hover:text-white transition-all shadow-md active:scale-95"
            title={language === 'ar' ? 'تخطي المرحلة' : 'Skip Phase'}
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
