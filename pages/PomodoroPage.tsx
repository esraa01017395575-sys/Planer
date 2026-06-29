import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, Play, Pause, Square, ArrowLeft, Volume2, VolumeX, SkipForward, Flame, Save, Check, Image, MapPin, Sparkles, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const CITY_BACKGROUNDS = [
  {
    name_en: "Tokyo, Japan 🇯🇵",
    name_ar: "طوكيو، اليابان 🇯🇵",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=1600&q=80" // Tokyo neon streets
  },
  {
    name_en: "Paris, France 🇫🇷",
    name_ar: "باريس، فرنسا 🇫🇷",
    url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80" // Eiffel Tower dusk
  },
  {
    name_en: "New York, USA 🇺🇸",
    name_ar: "نيويورك، أمريكا 🇺🇸",
    url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80" // Times Square cozy lights
  },
  {
    name_en: "Kyoto, Japan 🇯🇵",
    name_ar: "كيوتو، اليابان 🇯🇵",
    url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80" // Golden Temple Autumn
  },
  {
    name_en: "Cairo, Egypt 🇪🇬",
    name_ar: "القاهرة، مصر 🇪🇬",
    url: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1600&q=80" // Cairo Nile lights dusk
  },
  {
    name_en: "London, UK 🇬🇧",
    name_ar: "لندن، بريطانيا 🇬🇧",
    url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80" // London evening
  },
  {
    name_en: "Venice, Italy 🇮🇹",
    name_ar: "البندقية، إيطاليا 🇮🇹",
    url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1600&q=80" // Venice colorful canals
  },
  {
    name_en: "Sydney, Australia 🇦🇺",
    name_ar: "سيدني، أستراليا 🇦🇺",
    url: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80" // Sydney Opera House night
  }
];

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
    addNotification,
    showPomodoroEncouragement, setShowPomodoroEncouragement,
    pomodoroMode, setPomodoroMode,
    handleSaveStopwatchSession
  } = useAppContext();

  // Task details containing subtasks
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState<boolean>(() => {
    return localStorage.getItem('pomodoroChecklistExpanded') !== 'false';
  });

  // Preferred session length: 25 or 50 minutes
  const [sessionLength, setSessionLength] = useState<number>(() => {
    return localStorage.getItem('pomodoroSessionLength') === '50' ? 50 : 25;
  });

  // Background state (default based on session completed count)
  const [bgIndex, setBgIndex] = useState<number>(() => {
    return pomodoroCount % CITY_BACKGROUNDS.length;
  });

  // Sync background with pomodoroCount updates
  useEffect(() => {
    setBgIndex(pomodoroCount % CITY_BACKGROUNDS.length);
  }, [pomodoroCount]);

  const handleCompleteTask = async () => {
    const taskId = params.taskId || activePomodoro?.id;
    if (!taskId) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', taskId);
      
      if (error) {
        addNotification(language === 'ar' ? 'حدث خطأ أثناء إكمال المهمة' : 'Error completing the task', 'error');
      } else {
        addNotification(language === 'ar' ? 'مبروك! تم نقل المهمة إلى مكتملة 🎉' : 'Awesome! Task moved to completed 🎉', 'success');
        import("../lib/audio-magic").then(m => m.playCastSpellSound()).catch(() => {});
        setShowPomodoroEncouragement(false);
        setLocation('/tasks');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExtendTimer = () => {
    setPomodoroTime(5 * 60);
    setInitialPomodoroTime(5 * 60);
    setIsPomodoroRunning(true);
    setShowPomodoroEncouragement(false);
    addNotification(language === 'ar' ? 'تم تمديد المؤقت بـ 5 دقائق إضافية!' : 'Extended timer by 5 extra minutes!', 'success');
  };

  // Fetch task subtasks on mount or when activePomodoro changes
  useEffect(() => {
    const taskId = params.taskId || activePomodoro?.id;
    if (taskId) {
      const fetchTaskDetails = async () => {
        try {
          const { data, error } = await supabase
            .from('tasks')
            .select('*, subtasks (*)')
            .eq('id', taskId)
            .single();
          if (data) {
            setTaskDetails(data);
            // If activePomodoro wasn't set, set it now
            if (!activePomodoro) {
              setActivePomodoro(data);
            }
          }
        } catch (e) {
          console.error("Error fetching task details for Pomodoro view:", e);
        }
      };
      fetchTaskDetails();
    }
  }, [params.taskId, activePomodoro?.id]);

  // Handle activePomodoro default construct
  useEffect(() => {
    if (!activePomodoro) {
      const defaultTitle = language === 'ar' ? 'جلسة تركيز نشطة' : 'Active Focus Session';
      setActivePomodoro({
        id: params.taskId,
        title: defaultTitle,
        estimated_min: 25
      });
      const durationSecs = pomodoroMode === 'stopwatch' ? 0 : sessionLength * 60;
      setPomodoroTime(durationSecs);
      setInitialPomodoroTime(durationSecs);
      setIsPomodoroRunning(false);
      setPomodoroPhase('focus');
    }
    setIsPomodoroMinimized(false);
  }, [params.taskId, activePomodoro, pomodoroMode]);

  // Handle Subtask toggle
  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    if (!taskDetails) return;
    
    // Optimistic UI update
    const updatedSubtasks = (taskDetails.subtasks || []).map((st: any) =>
      st.id === subtaskId ? { ...st, completed } : st
    );
    setTaskDetails({ ...taskDetails, subtasks: updatedSubtasks });

    // Play spell sound
    if (completed) {
      import("../lib/audio-magic").then(m => m.playCastSpellSound()).catch(() => {});
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', taskDetails.id);
      
      if (error) {
        addNotification(language === 'ar' ? 'فشل تحديث المهمة الفرعية' : 'Failed to update subtask', 'error');
        // Rollback
        const rollbackSubtasks = (taskDetails.subtasks || []).map((st: any) =>
          st.id === subtaskId ? { ...st, completed: !completed } : st
        );
        setTaskDetails({ ...taskDetails, subtasks: rollbackSubtasks });
      } else {
        addNotification(language === 'ar' ? 'تم تحديث المهمة الفرعية بنجاح' : 'Subtask updated successfully', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync custom estimated duration if less than session length
  useEffect(() => {
    if (taskDetails && pomodoroMode !== 'stopwatch' && !isPomodoroRunning) {
      const estMin = taskDetails.estimated_min;
      const prefLength = sessionLength;
      if (estMin && estMin > 0 && estMin < prefLength) {
        const estSecs = estMin * 60;
        setPomodoroTime(estSecs);
        setInitialPomodoroTime(estSecs);
      }
    }
  }, [taskDetails, pomodoroMode, sessionLength, isPomodoroRunning]);

  // Toggle Standard Session Length (25 vs 50 minutes)
  const handleSessionLengthChange = (length: number) => {
    if (isPomodoroRunning) {
      if (!confirm(language === 'ar' ? 'الجلسة جارية حالياً. هل تريد تغيير المدة وإعادة تعيين المؤقت؟' : 'A session is running. Do you want to change duration and reset the timer?')) {
        return;
      }
    }
    setSessionLength(length);
    localStorage.setItem('pomodoroSessionLength', String(length));
    
    if (pomodoroMode !== 'stopwatch') {
      const focusSecs = length * 60;
      setPomodoroTime(focusSecs);
      setInitialPomodoroTime(focusSecs);
      setIsPomodoroRunning(false);
    }
    addNotification(
      language === 'ar' 
        ? `تم تحديد مدة الجلسة لتكون ${length} دقيقة` 
        : `Session duration set to ${length} minutes`, 
      'success'
    );
  };

  const handleSkip = () => {
    if (pomodoroPhase === 'focus') {
      setPomodoroPhase('break');
      const breakSecs = 5 * 60;
      setPomodoroTime(breakSecs);
      setInitialPomodoroTime(breakSecs);
      addNotification(language === 'ar' ? 'تم تخطي جلسة التركيز إلى الاستراحة' : 'Focus session skipped to Break', 'info');
    } else {
      setPomodoroPhase('focus');
      const focusSecs = sessionLength * 60;
      setPomodoroTime(focusSecs);
      setInitialPomodoroTime(focusSecs);
      addNotification(language === 'ar' ? 'بدأت جلسة تركيز جديدة' : 'New focus session started', 'info');
    }
  };

  // Manual background cycle
  const cycleBackground = () => {
    const nextIdx = (bgIndex + 1) % CITY_BACKGROUNDS.length;
    setBgIndex(nextIdx);
  };

  const minutes = String(Math.floor(pomodoroTime / 60)).padStart(2, '0');
  const seconds = String(pomodoroTime % 60).padStart(2, '0');
  const elapsedMins = pomodoroMode === 'stopwatch' 
    ? Math.floor(pomodoroTime / 60) 
    : Math.floor((initialPomodoroTime - pomodoroTime) / 60);

  const totalAccumulatedMins = (taskDetails?.spent_min || 0) + elapsedMins;
  const estimatedMins = taskDetails?.estimated_min || 45;
  const isOvertime = totalAccumulatedMins > estimatedMins;
  const progress = pomodoroMode === 'stopwatch'
    ? (pomodoroTime % 60) / 60
    : (initialPomodoroTime > 0 ? (1 - pomodoroTime / initialPomodoroTime) : 0);
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference * (1 - progress);

  // Calculations for total sessions
  const taskEstMin = taskDetails?.estimated_min || activePomodoro?.estimated_min || 25;
  const calculatedTotalSessions = Math.ceil(taskEstMin / sessionLength);

  const currentBg = CITY_BACKGROUNDS[bgIndex];

  return (
    <div 
      className="min-h-screen w-full overflow-y-auto flex flex-col justify-between p-4 md:p-6 bg-cover bg-center transition-all duration-1000 relative font-sans text-white"
      style={{ backgroundImage: `url(${currentBg.url})` }}
    >
      {/* Dark gorgeous gradient overlay over image to ensure contrast */}
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[3px] z-0" />

      {/* Floating Exit/Return header */}
      <div className="flex items-center justify-between z-10 w-full relative">
        <button 
          onClick={() => {
            setIsPomodoroMinimized(true);
            setLocation('/tasks');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all shadow-lg active:scale-95 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'ar' ? 'العودة للمهام' : 'Return to Tasks'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Cycle background button */}
          <button
            onClick={cycleBackground}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-white text-xs font-bold shadow-md"
            title={language === 'ar' ? 'تغيير معالم المدينة الخلفية' : 'Change City Background'}
          >
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'ar' ? 'تغيير الخلفية' : 'Cycle Scenery'}</span>
          </button>

          {/* Sound Muted toggle */}
          <button 
            onClick={() => setSoundMuted(!soundMuted)}
            className={`p-2.5 rounded-2xl border transition-all ${soundMuted ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-white/10 border-white/10 text-white'} shadow-md hover:scale-105`}
            title={soundMuted ? (language === 'ar' ? 'تشغيل الصوت' : 'Unmute Sound') : (language === 'ar' ? 'كتم الصوت' : 'Mute Sound')}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main split dashboard (Left: clock, Right: task info and subtasks) */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 z-10 relative my-4 py-4">
        
        {/* Left Side: Timer & Big clock */}
        <div className="flex flex-col items-center justify-center space-y-6 flex-shrink-0">
          <header className="space-y-1 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest leading-none">
              <Timer className="w-3.5 h-3.5 text-accent-glow animate-pulse" />
              <span>
                {pomodoroMode === 'stopwatch'
                  ? (language === 'ar' ? 'تتبع ساعة الإيقاف ⏱️' : 'Stopwatch Tracker ⏱️')
                  : (pomodoroPhase === 'focus' ? (language === 'ar' ? 'وقت التركيز 🍅' : 'Focus Session 🍅') : (language === 'ar' ? 'وقت استراحة ☕' : 'Break Time ☕'))}
              </span>
            </div>

            {/* City current tag */}
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold tracking-widest text-white/60 pt-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>{language === 'ar' ? currentBg.name_ar : currentBg.name_en}</span>
            </div>
          </header>

          {/* Clock Circle */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {isOvertime && (
              <div className="absolute -top-3 z-20 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full animate-pulse shadow-lg shadow-rose-600/30 border border-rose-500/30 select-none">
                🚨 {language === 'ar' ? 'انتهى الوقت المحدد للمهمة!' : 'OVER TIME - LIMIT EXCEEDED!'} 🚨
              </div>
            )}
            {isPomodoroRunning && (
              <motion.div 
                animate={{ scale: [1, 1.04, 1] }} 
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/10 to-indigo-500/10 blur-xl" 
              />
            )}

            <svg width="100%" height="100%" viewBox="0 0 250 250" className="absolute">
              <circle 
                cx="125" 
                cy="125" 
                r="110" 
                fill="none" 
                strokeWidth="5" 
                className="stroke-white/10" 
              />
              <motion.circle 
                cx="125" 
                cy="125" 
                r="110" 
                fill="none" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`transition-all duration-1000 ${pomodoroMode === 'stopwatch' ? 'stroke-indigo-400' : (pomodoroPhase === 'focus' ? 'stroke-accent' : 'stroke-emerald-400')}`}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '125px 125px' }}
              />
            </svg>

            {/* Timer digits */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
              <span className="text-5xl sm:text-6xl font-mono font-black tracking-tight drop-shadow-md">
                {minutes}:{seconds}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
                {pomodoroMode === 'stopwatch'
                  ? (language === 'ar' ? 'توقيـت مستمـر' : 'CONTINUOUS TIME')
                  : (pomodoroPhase === 'focus' ? (language === 'ar' ? 'قم بالتركيز' : 'STAY FOCUSED') : (language === 'ar' ? 'استـرح قليلاً' : 'RELAX MIND'))}
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsPomodoroRunning(false);
                const duration = pomodoroMode === 'stopwatch' ? 0 : sessionLength * 60;
                setPomodoroTime(duration);
                setInitialPomodoroTime(duration);
                addNotification(language === 'ar' ? 'تمت إعادة تعيين المؤقت' : 'Timer reset', 'info');
              }}
              className="p-3.5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all shadow-md active:scale-95"
              title={language === 'ar' ? 'إعادة التعيين' : 'Reset'}
            >
              <Square className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
              className={`px-8 py-3.5 rounded-2xl font-black text-white text-base transition-all shadow-xl active:scale-95 ${
                isPomodoroRunning 
                  ? 'bg-emerald-600 shadow-emerald-500/10 hover:bg-emerald-500' 
                  : 'bg-accent shadow-accent/10 hover:bg-accent-glow'
              }`}
            >
              {isPomodoroRunning ? (
                <span className="flex items-center gap-2">
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{language === 'ar' ? 'إيقاف مؤقت' : 'Pause'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>{language === 'ar' ? 'بدء التركيز' : 'Start Focus'}</span>
                </span>
              )}
            </button>

            {pomodoroMode === 'stopwatch' ? (
              <button
                onClick={() => handleSaveStopwatchSession()}
                disabled={pomodoroTime < 10}
                className="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-accent border border-indigo-400/20 text-white hover:scale-105 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                title={language === 'ar' ? 'حفظ الجلسة والتقدم' : 'Save Session & Progress'}
              >
                <Save className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="p-3.5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all shadow-md active:scale-95"
                title={language === 'ar' ? 'تخطي المرحلة' : 'Skip Phase'}
              >
                <SkipForward className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Task description, subtasks checklist and standard session control */}
        <div className="flex-1 w-full max-w-md flex flex-col space-y-4">
          
          {/* Active task title and stats card */}
          <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-accent-glow uppercase tracking-wider block mb-1">
                  {language === 'ar' ? 'المهمة الجارية' : 'Active Task'}
                </span>
                <h3 className="text-lg font-bold text-white leading-snug truncate">
                  {activePomodoro?.title || (language === 'ar' ? 'جلسة تركيز نشطة' : 'Active Focus Session')}
                </h3>
              </div>

              {pomodoroMode !== 'stopwatch' && (
                <div className="flex flex-col items-end flex-shrink-0 text-right">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block">
                    {language === 'ar' ? 'الجلسات' : 'Sessions'}
                  </span>
                  <span className="text-xs font-black text-white/90 bg-white/10 px-2 py-0.5 rounded-lg mt-0.5 border border-white/10 tabular-nums">
                    {pomodoroCount + 1} / {calculatedTotalSessions}
                  </span>
                </div>
              )}
            </div>

            {/* Mode Selector (Countdown / Stopwatch) */}
            <div className="space-y-1.5 mb-3.5 border-b border-white/5 pb-3.5">
              <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block">
                {language === 'ar' ? 'نمط المؤقت (اتجاه الوقت):' : 'Timer Mode (Time Direction):'}
              </label>
              
              <div className="flex bg-black/20 border border-white/5 p-1 rounded-xl gap-1 w-full">
                <button
                  onClick={() => {
                    if (isPomodoroRunning) {
                      if (!confirm(language === 'ar' ? 'المؤقت جاري حالياً. هل تريد تغيير النمط وإعادة التعيين؟' : 'A session is running. Do you want to change mode and reset the timer?')) {
                        return;
                      }
                    }
                    setPomodoroMode('countdown');
                    const focusSecs = sessionLength * 60;
                    setPomodoroTime(focusSecs);
                    setInitialPomodoroTime(focusSecs);
                    setIsPomodoroRunning(false);
                    setPomodoroPhase('focus');
                    addNotification(language === 'ar' ? 'تم اختيار نمط العد التنازلي ⬇️' : 'Switched to Countdown mode ⬇️', 'info');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    pomodoroMode === 'countdown'
                      ? 'bg-accent text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>⬇️</span>
                  <span>{language === 'ar' ? 'عد تنازلي (Time Down)' : 'Countdown (Time Down)'}</span>
                </button>
                <button
                  onClick={() => {
                    if (isPomodoroRunning) {
                      if (!confirm(language === 'ar' ? 'المؤقت جاري حالياً. هل تريد تغيير النمط وإعادة التعيين؟' : 'A session is running. Do you want to change mode and reset the timer?')) {
                        return;
                      }
                    }
                    setPomodoroMode('stopwatch');
                    setPomodoroTime(0);
                    setInitialPomodoroTime(0);
                    setIsPomodoroRunning(false);
                    setPomodoroPhase('focus');
                    addNotification(language === 'ar' ? 'تم اختيار نمط ساعة الإيقاف ⬆️' : 'Switched to Stopwatch mode ⬆️', 'info');
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    pomodoroMode === 'stopwatch'
                      ? 'bg-accent text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>⬆️</span>
                  <span>{language === 'ar' ? 'ساعة إيقاف (Time Up)' : 'Stopwatch (Time Up)'}</span>
                </button>
              </div>
            </div>

            {/* Standard Session Switcher (25 vs 50 mins) */}
            {pomodoroMode !== 'stopwatch' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block">
                  {language === 'ar' ? 'مدة جلسة التركيز (دقيقة):' : 'Focus Session Duration:'}
                </label>
                
                <div className="flex bg-black/20 border border-white/5 p-1 rounded-xl gap-1 w-full">
                  <button
                    onClick={() => handleSessionLengthChange(25)}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      sessionLength === 25
                        ? 'bg-accent text-white shadow-md'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    ⏱️ 25 {language === 'ar' ? 'دقيقة' : 'Min'}
                  </button>
                  <button
                    onClick={() => handleSessionLengthChange(50)}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      sessionLength === 50
                        ? 'bg-accent text-white shadow-md'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    ⏱️ 50 {language === 'ar' ? 'دقيقة' : 'Min'}
                  </button>
                  {taskDetails?.estimated_min && taskDetails.estimated_min !== 25 && taskDetails.estimated_min !== 50 && (
                    <button
                      onClick={() => handleSessionLengthChange(taskDetails.estimated_min)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        sessionLength === taskDetails.estimated_min
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      🎯 {taskDetails.estimated_min} {language === 'ar' ? 'د (المهمة)' : 'm (Task)'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subtasks Checklist card */}
          <div className="bg-white/5 border border-white/5 backdrop-blur-md rounded-3xl p-5 shadow-2xl flex-1 flex flex-col min-h-0">
            <div 
              onClick={() => {
                const nextVal = !isChecklistExpanded;
                setIsChecklistExpanded(nextVal);
                localStorage.setItem('pomodoroChecklistExpanded', String(nextVal));
              }}
              className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5 cursor-pointer select-none group/hdr hover:opacity-85 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white/90">
                  {language === 'ar' ? 'المهام الفرعية' : 'Subtasks Checklist'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {taskDetails?.subtasks ? taskDetails.subtasks.length : 0}
                </span>
                {isChecklistExpanded ? (
                  <ChevronUp className="w-4 h-4 text-white/60 group-hover/hdr:text-white transition-colors" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/60 group-hover/hdr:text-white transition-colors" />
                )}
              </div>
            </div>

            {/* List of subtasks */}
            {isChecklistExpanded && (
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1 min-h-[140px] max-h-[180px]">
                {taskDetails?.subtasks && taskDetails.subtasks.length > 0 ? (
                  taskDetails.subtasks.map((st: any) => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtask(st.id, !st.completed)}
                      className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 group/st"
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${
                        st.completed 
                          ? 'bg-accent border-accent scale-105 shadow-sm shadow-accent/20' 
                          : 'border-white/30 group-hover/st:border-white'
                      }`}>
                        {st.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-xs font-bold leading-tight flex-1 select-none transition-all ${
                        st.completed 
                          ? 'line-through text-white/40 decoration-white/30' 
                          : 'text-white/90'
                      }`}>
                        {st.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-white/30 space-y-1.5 h-full">
                    <div className="w-8 h-8 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                      <span className="text-xs">👀</span>
                    </div>
                    <div className="text-[11px] font-bold">
                      {language === 'ar' ? 'لا توجد مهام فرعية لهذه المهمة' : 'No subtasks for this task'}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider opacity-60">
                      {language === 'ar' ? 'تعديل المهمة من لوحة العمل لإضافتها' : 'Edit task on board to add them'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer session progress dots */}
      <div className="flex justify-center items-center gap-2 py-2 z-10 w-full relative">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i < pomodoroCount % 4 
                ? 'w-7 bg-accent' 
                : i === pomodoroCount % 4 
                  ? 'w-4 bg-accent/45 animate-pulse' 
                  : 'w-2.5 bg-white/20'
            }`} 
          />
        ))}
      </div>

      {/* Pomodoro Completion Encouragement overlay modal */}
      <AnimatePresence>
        {showPomodoroEncouragement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md px-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl text-center space-y-6 relative overflow-hidden text-white"
            >
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent/15 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
              
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto border border-accent/20 animate-bounce">
                {isOvertime ? (
                  <AlertTriangle className="w-10 h-10 text-rose-500 animate-pulse" />
                ) : (
                  <Flame className="w-10 h-10 text-accent fill-accent animate-pulse" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-black tracking-tight text-white">
                  {isOvertime 
                    ? (language === 'ar' ? '⚠️ لقد تجاوزت الوقت المحدد!' : '⚠️ Over Time Limit Exceeded!')
                    : (language === 'ar' ? 'أداء عبقري يا بطل! 🏆 ✨' : 'Phenomenal Focus Session! 🏆 ✨')}
                </h3>
                <p className="text-sm font-medium tracking-wide text-white/70">
                  {isOvertime 
                    ? (language === 'ar' 
                      ? `المهمة تم تقديرها بـ ${estimatedMins} دقيقة، لكنك قضيت ${totalAccumulatedMins} دقيقة.` 
                      : `Task was estimated for ${estimatedMins}m, but you spent ${totalAccumulatedMins}m.`)
                    : (language === 'ar' 
                      ? `لقد أتممت بنجاح جلسة تركيز كاملة لمدة ${sessionLength} دقيقة.` 
                      : `You completed a full focus block of ${sessionLength} minutes.`)}
                </p>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 relative">
                <p className="text-sm font-bold leading-relaxed text-white">
                  {isOvertime ? (
                    language === 'ar' 
                      ? "تنبيه الوقت الإضافي: لقد استغرقت وقتاً أطول من المخطط له لتأدية هذه المهمة. هل تود إكمالها ونقلها إلى خانة المكتملة الآن، أم الاستمرار في تتبع الوقت؟ ⏳⚡"
                      : "Overtime Alert: You've spent more time than originally planned for this task. Would you like to finalize it and move it to Done, or keep working? ⏳⚡"
                  ) : (
                    [
                      language === 'ar' 
                        ? "يا بطل! إنجاز أسطوري.. كدا أنت خلصت جلسة تركيز كاملة! خد فنجان قهوة وريّح شوية وسيب الباقي علينا ☕🌟"
                        : "Incredible work, hero! You've conquered a complete focus session! Grab a coffee and rest up ☕🌟",
                      language === 'ar'
                        ? "جامد جداً يا بطلة! الخطوة دي بتقرّبك أكتر لحلمك.. استمتعي بالاستراحة دلوقتي بكل فخر 💪✨"
                        : "Amazing job! This step brings you closer to your dream. Enjoy your well-earned break 💪✨",
                      language === 'ar'
                        ? "الله ينور يا وحش! الـ Focus ده هو السر اللي بيصنع الفرق.. عاش بجد والله! 👏🎯"
                        : "Spot on! This absolute focus is the secret that makes all the difference! Outstanding effort! 👏🎯",
                      language === 'ar'
                        ? "كدا خلصنا خطوة تانية بنجاح.. طوّر نفسك وعاداتك خطوة بخطوة وإحنا معاك ديماً! 🌟🚀"
                        : "Another successful step completed! Build yourself block by block, we're with you all the way! 🌟🚀"
                    ][pomodoroCount % 4]
                  )}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleCompleteTask}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-wider transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🎉</span>
                  <span>{language === 'ar' ? 'نعم، أتممت المهمة بالكامل! (نقل لخانة مكتملة)' : 'Yes, I finished the task! (Move to Done)'}</span>
                </button>

                {pomodoroMode !== 'stopwatch' && (
                  <button
                    onClick={handleExtendTimer}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/45 text-indigo-200 hover:text-white border border-indigo-500/20 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>⏱️</span>
                    <span>{language === 'ar' ? 'تمديد الجلسة (إضافة 5 دقائق إضافية)' : 'Extend session (Add 5 extra minutes)'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowPomodoroEncouragement(false);
                    if (pomodoroMode === 'stopwatch') {
                      setPomodoroTime(0);
                      setInitialPomodoroTime(0);
                      setLocation('/tasks');
                    } else {
                      setPomodoroPhase('break');
                      setPomodoroTime(5 * 60);
                      setInitialPomodoroTime(5 * 60);
                      setIsPomodoroRunning(true);
                    }
                  }}
                  className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>☕</span>
                  <span>
                    {pomodoroMode === 'stopwatch'
                      ? (language === 'ar' ? 'العودة للوحة العمل' : 'Return to Board')
                      : (language === 'ar' ? 'بدء الاستراحة الآن ☕' : 'Start My Break ☕')}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
