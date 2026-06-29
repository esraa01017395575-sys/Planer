import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type Theme = 'midnight' | 'aurora' | 'solar';
type Mode = 'dark' | 'light';
type Language = 'en' | 'ar';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  toggleMode: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  notifications: Notification[];

  // Global Pomodoro
  activePomodoro: any;
  setActivePomodoro: (task: any) => void;
  pomodoroTime: number;
  setPomodoroTime: (time: number) => void;
  initialPomodoroTime: number;
  setInitialPomodoroTime: (time: number) => void;
  isPomodoroRunning: boolean;
  setIsPomodoroRunning: (running: boolean) => void;
  pomodoroPhase: 'focus' | 'break' | 'long-break';
  setPomodoroPhase: (phase: 'focus' | 'break' | 'long-break') => void;
  pomodoroCount: number;
  setPomodoroCount: (count: number) => void;
  soundMuted: boolean;
  setSoundMuted: (muted: boolean) => void;
  isPomodoroMinimized: boolean;
  setIsPomodoroMinimized: (minimized: boolean) => void;
  startPomodoroGlobal: (task: any) => void;
  showPomodoroEncouragement: boolean;
  setShowPomodoroEncouragement: (show: boolean) => void;
  taskRemindersEnabled: boolean;
  setTaskRemindersEnabled: (enabled: boolean) => void;
  habitRemindersEnabled: boolean;
  setHabitRemindersEnabled: (enabled: boolean) => void;
  aiSuggestionsEnabled: boolean;
  setAiSuggestionsEnabled: (enabled: boolean) => void;
  pomodoroMode: 'countdown' | 'stopwatch';
  setPomodoroMode: (mode: 'countdown' | 'stopwatch') => void;
  handleSaveStopwatchSession: (customDurationMins?: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    chat: 'AI Chat',
    projects: 'Projects',
    plans: 'Plans',
    tasks: 'Tasks',
    habits: 'Habits',
    notes: 'Notes',
    settings: 'Settings',
    favorites: 'Favorites',
    calendar: 'Calendar',
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    good_night: 'Good night',
    daily_quote: 'Quote',
    pending_yesterday: 'PENDING FROM YESTERDAY',
    today_tasks: "TODAY'S TASKS",
    habits_today: 'HABITS TODAY',
    daily_habits: 'Daily Habits',
    view_all_tasks: 'View all tasks',
    start: 'Start',
    reschedule: 'Reschedule',
    remove: 'Remove',
    add_task: 'Add task',
    new_plan_via_ai: 'New Plan via AI',
    search_notes: 'Search notes...',
    grid: 'Grid',
    list: 'List',
    new_note: 'New Note',
    new_section: 'New section',
    all_notes: 'All Notes',
    search_favorites: 'Search favorites...',
    add_manually: 'Add manually',
    send_to_ai: 'Send to AI',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    profile: 'Profile',
    your_tasks: 'Your tasks',
    accept_all: 'Accept all',
    delete_all: 'Delete all',
    career_discovery: 'Career Discovery & Analysis',
    discovery_phase: 'Discovery & Analysis Phase',
    add_to_plan: 'Add to plan',
    smart_suggestions: 'Smart Suggestions',
    based_on_chat: 'Based on our conversation',
    ai_assistant: 'AI Assistant',
    analyzing: 'Analyzing...',
    chat_placeholder: 'Talk to your career coach...',
    long_term_plans: 'Long-term Plans',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    view_full_plan: 'View Full Plan',
    add_task_today: 'Add Task Today',
    streak: 'Streak',
    focus_score: 'Focus Score',
    habit_streak: 'Habit Streak',
    goals_met: 'Goals Met',
    daily_progress: 'Daily Progress',
    tasks_completed: 'TASKS COMPLETED',
    energy_level: 'ENERGY LEVEL',
    weekly_review: 'Weekly Review',
    today_schedule: "Today's Schedule",
    view_all: 'View All',
    manage: 'Manage',
    habit_tracker: 'Habit Tracker',
    note_saved: 'Note saved successfully',
    note_deleted: 'Note deleted',
    confirm_delete_note: 'Are you sure you want to delete this note?',
    save_note: 'Save Note',
    new_note_title: 'New Note',
    note_title_placeholder: 'Note title...',
    note_content_placeholder: 'Write your thoughts...',
    task_completed_xp: 'Task completed! +XP',
    task_rescheduled: 'Task rescheduled successfully',
    task_deleted: 'Task deleted',
    task_updated: 'Task updated successfully',
    task_added: 'Task added successfully',
    start_pomodoro: 'Start Pomodoro',
    habit_logged: 'Habit logged successfully! +XP',
    habit_created: 'Habit created successfully',
    favorite_added: 'Added to favorites',
    favorite_removed: 'Removed from favorites',
    notification_permission: 'Notification permission requested',
    streakDays: 'streak days',
    timesPerDay: 'Times per day',
    frequency: 'Frequency',
    reminderTime: 'Reminder Time',
    remindBefore: 'Remind me before',
    minutes: 'min',
    addHabit: 'Add Habit',
    editHabit: 'Edit Habit',
    deleteHabit: 'Delete Habit',
    activeHabits: 'Active habits',
    markDone: 'Mark Done',
    streak_maintained: 'Streak maintained!',
    confirmDelete: 'Are you sure you want to delete this?',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    newHabit: 'New Habit',
    daily: 'Daily',
    weekly: 'Weekly',
    loading: 'Loading...',
    please_login: 'Please login first',
    error_saving_task: 'Error saving task',
    tomorrow: 'Tomorrow',
    next_week: 'Next Week',
    ideas: 'Ideas',
    work: 'Work',
    personal: 'Personal',
    current_phase: 'Current Phase',
    planned: 'Planned',
    defining_milestones: 'Defining milestones',
    flexible_duration: 'Flexible duration',
    new_plan: 'New Plan',
    plan_created: 'Plan created successfully',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    chat: 'المحادثة الذكية',
    projects: 'المشاريع',
    plans: 'الخطط',
    tasks: 'المهام',
    habits: 'العادات',
    notes: 'الملاحظات',
    settings: 'الإعدادات',
    favorites: 'المفضلات',
    calendar: 'التقويم',
    good_morning: 'صباح الخير',
    good_afternoon: 'مساء الخير',
    good_evening: 'مساء الخير',
    good_night: 'طابت ليلتك',
    daily_quote: 'اقتباس اليوم',
    pending_yesterday: 'مهام معلقة من الأمس',
    today_tasks: 'مهام اليوم',
    habits_today: 'عادات اليوم',
    daily_habits: 'العادات اليومية',
    view_all_tasks: 'عرض كل المهام',
    start: 'ابدأ',
    reschedule: 'إعادة جدولة',
    remove: 'حذف',
    add_task: 'إضافة مهمة',
    new_plan_via_ai: 'خطة جديدة بالذكاء الاصطناعي',
    search_notes: 'البحث في الملاحظات...',
    grid: 'شبكة',
    list: 'قائمة',
    new_note: 'ملاحظة جديدة',
    new_section: 'قسم جديد',
    all_notes: 'كل الملاحظات',
    search_favorites: 'البحث في المفضلات...',
    add_manually: 'إضافة يدوياً',
    send_to_ai: 'إرسال للذكاء الاصطناعي',
    language: 'اللغة',
    theme: 'السمة',
    notifications: 'التنبيهات',
    profile: 'الملف الشخصي',
    your_tasks: 'مهامك المقترحة',
    accept_all: 'قبول الكل',
    delete_all: 'حذف الكل',
    career_discovery: 'اكتشاف وتحليل المسار المهني',
    discovery_phase: 'مرحلة الاكتشاف والتحليل',
    add_to_plan: 'إضافة للخطة',
    smart_suggestions: 'اقتراحات ذكية',
    based_on_chat: 'بناءً على محادثتنا',
    ai_assistant: 'المساعد الذكي',
    analyzing: 'جاري التحليل...',
    chat_placeholder: 'تحدث مع مدربك المهني...',
    long_term_plans: 'الخطط طويلة المدى',
    monthly: 'شهري',
    quarterly: 'ربع سنوي',
    yearly: 'سنوي',
    view_full_plan: 'عرض الخطة الكاملة',
    add_task_today: 'إضافة مهمة لليوم',
    streak: 'سلسلة',
    focus_score: 'درجة التركيز',
    habit_streak: 'سلسلة العادات',
    goals_met: 'الأهداف المحققة',
    daily_progress: 'التقدم اليومي',
    tasks_completed: 'المهام المكتملة',
    energy_level: 'مستوى الطاقة',
    weekly_review: 'المراجعة الأسبوعية',
    today_schedule: 'جدول اليوم',
    view_all: 'عرض الكل',
    manage: 'إدارة',
    habit_tracker: 'تتبع العادات',
    note_saved: 'تم حفظ الملاحظة بنجاح',
    note_deleted: 'تم حذف الملاحظة',
    confirm_delete_note: 'هل أنت متأكد من حذف هذه الملاحظة؟',
    save_note: 'حفظ الملاحظة',
    new_note_title: 'ملاحظة جديدة',
    note_title_placeholder: 'عنوان الملاحظة...',
    note_content_placeholder: 'اكتب أفكارك...',
    task_completed_xp: 'تم إكمال المهمة! +XP',
    task_rescheduled: 'تم إعادة جدولة المهمة بنجاح',
    task_deleted: 'تم حذف المهمة',
    task_updated: 'تم تحديث المهمة بنجاح',
    task_added: 'تم إضافة المهمة بنجاح',
    start_pomodoro: 'بدء بومودورو',
    habit_logged: 'تم تسجيل العادة بنجاح! +XP',
    habit_created: 'تم إنشاء العادة بنجاح',
    favorite_added: 'تمت الإضافة للمفضلة',
    favorite_removed: 'تم الحذف من المفضلة',
    notification_permission: 'تم طلب إذن التنبيهات',
    streakDays: 'أيام متتالية',
    timesPerDay: 'مرات يومياً',
    frequency: 'التكرار',
    reminderTime: 'وقت التذكير',
    remindBefore: 'ذكرني قبل',
    minutes: 'دقيقة',
    addHabit: 'إضافة عادة',
    editHabit: 'تعديل العادة',
    deleteHabit: 'حذف العادة',
    activeHabits: 'العادات النشطة',
    markDone: 'تم الإنجاز',
    streak_maintained: 'حافظت على تتابع أيامك!',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    cancel: 'إلغاء',
    delete: 'حذف',
    save: 'حفظ',
    newHabit: 'عادة جديدة',
    daily: 'يومي',
    weekly: 'أسبوعي',
    loading: 'جاري التحميل...',
    please_login: 'يرجى تسجيل الدخول أولاً',
    error_saving_task: 'حدث خطأ أثناء حفظ المهمة',
    tomorrow: 'غداً',
    next_week: 'الأسبوع القادم',
    ideas: 'أفكار',
    work: 'عمل',
    personal: 'شخصي',
    current_phase: 'المرحلة الحالية',
    planned: 'مخطط له',
    defining_milestones: 'تحديد الأهداف',
    flexible_duration: 'مدة مرنة',
    new_plan: 'خطة جديدة',
    plan_created: 'تم إنشاء الخطة بنجاح',
  }
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'midnight');
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('mode') as Mode) || 'dark');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Notifications Preferences
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState<boolean>(() => localStorage.getItem('taskRemindersEnabled') !== 'false');
  const [habitRemindersEnabled, setHabitRemindersEnabled] = useState<boolean>(() => localStorage.getItem('habitRemindersEnabled') !== 'false');
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState<boolean>(() => localStorage.getItem('aiSuggestionsEnabled') !== 'false');

  // Pomodoro Global State
  const [activePomodoro, setActivePomodoro] = useState<any | null>(null);
  const [pomodoroMode, setPomodoroMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [initialPomodoroTime, setInitialPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState<'focus' | 'break' | 'long-break'>('focus');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [soundMuted, setSoundMuted] = useState<boolean>(() => localStorage.getItem('soundMuted') === 'true');
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(false);
  const [showPomodoroEncouragement, setShowPomodoroEncouragement] = useState(false);

  // Audio Synthesizer Helpers for Retro ticking and chime
  const playTickSound = (secsRemaining?: number) => {
    if (soundMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      const isTick = (secsRemaining ?? 0) % 2 === 0;
      osc.type = 'triangle'; // Woodier/warmer analog tick-tock
      osc.frequency.setValueAtTime(isTick ? 600 : 450, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.012, audioCtx.currentTime); 
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } catch (e) {
      // Audio context permission or fallback error ignored
    }
  };

  const playBeepSound = () => {
    if (soundMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 triple chime
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime + idx * 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + idx * 0.12 + 0.3);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.35);
      });
    } catch (e) {
      // Click restriction/permission error ignored
    }
  };

  // Global handle Pomodoro Phase completion
  const handleGlobalPomodoroEnd = async () => {
    setIsPomodoroRunning(false);
    playBeepSound();

    if (pomodoroPhase === 'focus') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      setShowPomodoroEncouragement(true);

      // Record Pomodoro Session inside DB (Support dual density compatibility query)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && activePomodoro) {
          const durationMins = Math.round(initialPomodoroTime / 60);
          await supabase.from('pomodoro_sessions').insert({
            user_id: user.id,
            task_id: activePomodoro.id,
            duration_minutes: durationMins,
            duration_min: durationMins, // dual-column density
            completed: true,
            completed_at: new Date().toISOString()
          });

          // UPDATE TASK SPENT MINUTES DIRECTLY (Safely)
          try {
            const { data: currentTask } = await supabase
              .from('tasks')
              .select('spent_min')
              .eq('id', activePomodoro.id)
              .maybeSingle();
            
            const currentSpent = currentTask?.spent_min || 0;
            await supabase
              .from('tasks')
              .update({ spent_min: currentSpent + durationMins })
              .eq('id', activePomodoro.id);
          } catch (taskErr) {
            console.error("Error updating task spent_min:", taskErr);
          }

          // NEW: Link/rollover task hours to project total hours if task has a project_id
          if (activePomodoro.project_id) {
            await fetch(`/api/projects/${activePomodoro.project_id}/sessions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id
              },
              body: JSON.stringify({
                title: language === 'ar' ? `جلسة تركيز بومودورو: ${activePomodoro.title}` : `Pomodoro Session: ${activePomodoro.title}`,
                description: language === 'ar' ? 'تم إكمال جلسة تركيز كاملة بنجاح' : 'Completed focus session successfully',
                duration: durationMins,
                tasksCompleted: [activePomodoro.title],
                notes: `Pomodoro session logged on task: ${activePomodoro.title}`,
                mood: 'productive',
                date: new Date().toISOString().split('T')[0]
              })
            });
          }
        }
      } catch (err) {
        console.error("Error saving global pomodoro session:", err);
      }

      const isLongBreak = newCount % 4 === 0;
      const breakMins = isLongBreak ? 15 : 5;
      const nextPhaseState = isLongBreak ? 'long-break' : 'break';

      setPomodoroPhase(nextPhaseState);
      setPomodoroTime(breakMins * 60);
      setInitialPomodoroTime(breakMins * 60);
      addNotification(language === 'ar' ? `رائع تم إكمال جلسة التركيز! استراحة لمدة ${breakMins} دقائق 🌟` : `Fantastic job! Taking a ${breakMins} mins break 🌟`, 'success');

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(language === 'ar' ? 'جلسة الـ Focus انتهت!' : 'Focus Session Finished!', {
          body: language === 'ar' ? `حان وقت الاستراحة (${breakMins} دقائق)` : `Time for a well-deserved ${breakMins}m break!`,
          icon: '/favicon.ico'
        });
      }
    } else {
      setPomodoroPhase('focus');
      const preferredLength = localStorage.getItem('pomodoroSessionLength') === '50' ? 50 : 25;
      const focusSecs = preferredLength * 60;
      setPomodoroTime(focusSecs);
      setInitialPomodoroTime(focusSecs);
      addNotification(language === 'ar' ? 'انتهت الاستراحة! هيا لنركز مجدداً 💪' : 'Break is over! Clear your mind and let\'s focus 💪', 'info');

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(language === 'ar' ? 'انتهت الاستراحة!' : 'Break Over!', {
          body: language === 'ar' ? 'هل أنت مستعد لجلسة التركيز القادمة؟' : 'Ready to dive back into your focused session?',
          icon: '/favicon.ico'
        });
      }
    }
  };

  // Stopwatch completion & saving session linked to project total spent hours
  const handleSaveStopwatchSession = async (customDurationMins?: number) => {
    setIsPomodoroRunning(false);
    playBeepSound();

    const actualSeconds = pomodoroTime;
    const durationMins = customDurationMins ?? Math.max(1, Math.round(actualSeconds / 60));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && activePomodoro) {
        // 1. Record Pomodoro session row linked to task
        await supabase.from('pomodoro_sessions').insert({
          user_id: user.id,
          task_id: activePomodoro.id,
          duration_minutes: durationMins,
          duration_min: durationMins,
          completed: true,
          completed_at: new Date().toISOString()
        });

        // UPDATE TASK SPENT MINUTES DIRECTLY (Safely)
        try {
          const { data: currentTask } = await supabase
            .from('tasks')
            .select('spent_min')
            .eq('id', activePomodoro.id)
            .maybeSingle();
          
          const currentSpent = currentTask?.spent_min || 0;
          await supabase
            .from('tasks')
            .update({ spent_min: currentSpent + durationMins })
            .eq('id', activePomodoro.id);
        } catch (taskErr) {
          console.error("Error updating task spent_min:", taskErr);
        }

        // 2. Record workspace session linked to parent project for total spent hours tracking
        if (activePomodoro.project_id) {
          await fetch(`/api/projects/${activePomodoro.project_id}/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id
            },
            body: JSON.stringify({
              title: language === 'ar' ? `ساعة توقيت: ${activePomodoro.title}` : `Stopwatch Timer: ${activePomodoro.title}`,
              description: language === 'ar' ? `جلسة عمل تتبع مستمرة مكتملة` : `Stopwatch focus tracking completed`,
              duration: durationMins,
              tasksCompleted: [activePomodoro.title],
              notes: `Stopwatch focus session logged on task: ${activePomodoro.title}`,
              mood: 'productive',
              date: new Date().toISOString().split('T')[0]
            })
          });
        }

        // Show encouragement
        setShowPomodoroEncouragement(true);
        addNotification(language === 'ar' ? 'تم حفظ تقدم الجلسة وتحديث ساعات المشروع بنجاح!' : 'Focus session saved! Project total spent hours updated.', 'success');
      }
    } catch (e) {
      console.error("Error saving stopwatch session:", e);
    }
  };

  // Global ticker effect
  useEffect(() => {
    let interval: any;
    if (isPomodoroRunning) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (pomodoroMode === 'stopwatch') {
            if (pomodoroPhase === 'focus') {
              playTickSound(prev);
            }
            return prev + 1;
          }

          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => {
              handleGlobalPomodoroEnd();
            }, 10);
            return 0;
          }
          if (pomodoroPhase === 'focus') {
            playTickSound(prev);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroPhase, soundMuted, activePomodoro, pomodoroMode]);

  // Global Start Action
  const startPomodoroGlobal = async (task: any) => {
    try {
      // 1. Instantly set task status to in_progress (or doing) in database
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', task.id);
      
      if (error) {
        // Fallback or backup name: 'doing' (some workspaces use 'doing' some use 'in_progress')
        await supabase
          .from('tasks')
          .update({ status: 'doing' })
          .eq('id', task.id);
      }
    } catch (e) {
      console.error("Error setting task status:", e);
    }

    // 2. Set timer constants
    const preferredLength = localStorage.getItem('pomodoroSessionLength') === '50' ? 50 : 25;
    setActivePomodoro(task);
    if (pomodoroMode === 'stopwatch') {
      setInitialPomodoroTime(0);
      setPomodoroTime(0);
    } else {
      setInitialPomodoroTime(preferredLength * 60);
      setPomodoroTime(preferredLength * 60);
    }
    setIsPomodoroRunning(true);
    setPomodoroPhase('focus');
    setIsPomodoroMinimized(false);

    if (pomodoroMode === 'stopwatch') {
      addNotification(language === 'ar' ? 'بدأ احتساب وقت المذاكرة/العمل ساعة توقيت!' : 'Stopwatch started on active focus!', 'success');
    } else {
      addNotification(language === 'ar' ? 'بدأت جلسة بومودورو! تم تحويل المهمة إلى قيد التنفيذ' : 'Pomodoro session started! Task moved to Active Focus', 'success');
    }

    // 3. Directly redirect to /pomodoro/taskid page
    window.history.pushState(null, '', `/pomodoro/${task.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);

    // Play notification sound if sound is not muted
    if (!soundMuted) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const now = audioCtx.currentTime;

          if (type === 'error') {
            // A quick caution double beep
            [350, 280].forEach((freq, idx) => {
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, now + idx * 0.12);
              gainNode.gain.setValueAtTime(0.06, now + idx * 0.12);
              gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.2);
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.start(now + idx * 0.12);
              osc.stop(now + idx * 0.12 + 0.25);
            });
          } else {
            // A beautiful sparkling ascending bell-like chime (A5 -> C#6 -> E6 -> A6)
            const notes = [880, 1109.73, 1318.51, 1760];
            notes.forEach((freq, idx) => {
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now + idx * 0.08);
              gainNode.gain.setValueAtTime(0.001, now + idx * 0.08);
              gainNode.gain.linearRampToValueAtTime(0.05, now + idx * 0.08 + 0.02);
              gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.start(now + idx * 0.08);
              osc.stop(now + idx * 0.08 + 0.45);
            });
          }
        }
      } catch (e) {
        console.error("Failed to play notification sound:", e);
      }
    }

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const parseTimeToHoursAndMinutes = (timeStr: string): { hours: number; minutes: number } | null => {
    if (!timeStr) return null;
    const str = String(timeStr).trim().toLowerCase();
    
    if (/am|pm/i.test(str)) {
      const match = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
      if (match) {
        let hh = parseInt(match[1], 10);
        const mm = parseInt(match[2], 10);
        const ampm = match[3];
        if (ampm === 'pm' && hh < 12) hh += 12;
        if (ampm === 'am' && hh === 12) hh = 0;
        return { hours: hh, minutes: mm };
      }
    }
    
    const parts = str.split(':');
    if (parts.length >= 2) {
      const hh = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10);
      if (!isNaN(hh) && !isNaN(mm)) {
        return { hours: hh, minutes: mm };
      }
    }
    return null;
  };

  const firedNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkReminders = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const userId = session.user.id;
        const now = new Date();
        
        // Get user's local YYYY-MM-DD date key instead of UTC to avoid timezone mismatch
        const todayKey = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0')
        ].join('-');

        // --- 1. TASK REMINDERS (30 MINUTES BEFORE TIME) ---
        const taskReminders = localStorage.getItem('taskRemindersEnabled') !== 'false';
        if (taskReminders) {
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('due_date', todayKey)
            .neq('status', 'completed')
            .neq('status', 'done');

          if (!tasksError && tasks) {
            tasks.forEach((task: any) => {
              if (!task.scheduled_time) return;
              const parsedTime = parseTimeToHoursAndMinutes(task.scheduled_time);
              if (!parsedTime) return;

              const scheduledDateTime = new Date(now);
              scheduledDateTime.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

              const timeDiffMs = scheduledDateTime.getTime() - now.getTime();
              // check if starting within the next 30 minutes, or up to 5 minutes past (to handle browser background throttling)
              const isWithin30MinsBefore = timeDiffMs > -5 * 60_000 && timeDiffMs <= 30 * 60_000;

              if (isWithin30MinsBefore) {
                const uniqueKey = `task-${task.id}-30m-reminded`;
                if (!firedNotifications.current.has(uniqueKey)) {
                  firedNotifications.current.add(uniqueKey);
                  
                  const msgAr = `المهمة "${task.title}" ستبدأ خلال 30 دقيقة! 🎯`;
                  const msgEn = `Task "${task.title}" starts in 30 minutes! 🎯`;
                  addNotification(language === 'ar' ? msgAr : msgEn, 'info');

                  // Save notification to database notifications table
                  supabase.from('notifications').insert({
                    user_id: userId,
                    type: 'task_reminder',
                    title: task.title,
                    body: language === 'ar' ? msgAr : msgEn,
                    ref_id: task.id,
                    is_read: false
                  }).then(({ error }: any) => {
                    if (error) console.error("Failed to insert task reminder to db:", error);
                  });

                  if (Notification.permission === 'granted') {
                    new Notification(task.title, {
                      body: language === 'ar' ? msgAr : msgEn,
                      icon: '/favicon.ico'
                    });
                  }
                }
              }
            });
          }
        }

        // --- 2. HABIT REMINDERS (GLOBAL BACKGROUND SUPPORT) ---
        const habitReminders = localStorage.getItem('habitRemindersEnabled') !== 'false';
        if (habitReminders) {
          const { data: habits, error: habitsError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);

          if (!habitsError && habits) {
            habits.forEach((h: any) => {
              if (!h.reminder_time) return;
              if (h.last_completed_on === todayKey) return;

              const parsedTime = parseTimeToHoursAndMinutes(h.reminder_time);
              if (!parsedTime) return;

              const targetTime = new Date(now);
              targetTime.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

              const reminderOffsets = Array.isArray(h.reminders) && h.reminders.length > 0 ? h.reminders : [0];

              reminderOffsets.forEach((mins: number) => {
                const fireAt = new Date(targetTime.getTime() - mins * 60_000);
                const uniqueKey = `habit-${h.id}:${todayKey}:${mins}`;

                if (!firedNotifications.current.has(uniqueKey)) {
                  const diff = now.getTime() - fireAt.getTime();
                  if (diff >= 0 && diff < 10 * 60_000) {
                    firedNotifications.current.add(uniqueKey);

                    const bodyAr = mins === 0 ? "حان وقت هذه العادة الآن! 🌟" : `تبدأ هذه العادة خلال ${mins} دقيقة! ⏰`;
                    const bodyEn = mins === 0 ? `Time for habit "${h.title}" now! 🌟` : `Habit "${h.title}" starts in ${mins} minutes! ⏰`;

                    addNotification(`${h.title} — ${language === 'ar' ? bodyAr : bodyEn}`, 'info');

                    // Save notification to database notifications table
                    supabase.from('notifications').insert({
                      user_id: userId,
                      type: 'habit_reminder',
                      title: h.title,
                      body: language === 'ar' ? bodyAr : bodyEn,
                      ref_id: h.id,
                      is_read: false
                    }).then(({ error }: any) => {
                      if (error) console.error("Failed to insert habit reminder to db:", error);
                    });

                    if (Notification.permission === 'granted') {
                      new Notification(h.title, {
                        body: language === 'ar' ? bodyAr : bodyEn,
                        tag: uniqueKey
                      });
                    }
                  }
                }
              });
            });
          }
        }

      } catch (err) {
        console.error("Error in global reminders checker:", err);
      }
    };

    checkReminders();
    const intervalId = setInterval(checkReminders, 45_000);
    return () => clearInterval(intervalId);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mode', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  const toggleMode = () => setMode(prev => prev === 'dark' ? 'light' : 'dark');

  const t = (key: string) => translations[language][key] || key;

  const handleSetTaskReminders = (enabled: boolean) => {
    setTaskRemindersEnabled(enabled);
    localStorage.setItem('taskRemindersEnabled', String(enabled));
  };

  const handleSetHabitReminders = (enabled: boolean) => {
    setHabitRemindersEnabled(enabled);
    localStorage.setItem('habitRemindersEnabled', String(enabled));
  };

  const handleSetAiSuggestions = (enabled: boolean) => {
    setAiSuggestionsEnabled(enabled);
    localStorage.setItem('aiSuggestionsEnabled', String(enabled));
  };

  const handleSetSoundMuted = (muted: boolean) => {
    setSoundMuted(muted);
    localStorage.setItem('soundMuted', String(muted));
  };

  return (
    <AppContext.Provider value={{ 
      theme, setTheme, mode, toggleMode, language, setLanguage, t, 
      addNotification, notifications,
      activePomodoro, setActivePomodoro,
      pomodoroTime, setPomodoroTime,
      initialPomodoroTime, setInitialPomodoroTime,
      isPomodoroRunning, setIsPomodoroRunning,
      pomodoroPhase, setPomodoroPhase,
      pomodoroCount, setPomodoroCount,
      soundMuted, setSoundMuted: handleSetSoundMuted,
      isPomodoroMinimized, setIsPomodoroMinimized,
      startPomodoroGlobal,
      showPomodoroEncouragement, setShowPomodoroEncouragement,
      taskRemindersEnabled, setTaskRemindersEnabled: handleSetTaskReminders,
      habitRemindersEnabled, setHabitRemindersEnabled: handleSetHabitReminders,
      aiSuggestionsEnabled, setAiSuggestionsEnabled: handleSetAiSuggestions,
      pomodoroMode, setPomodoroMode,
      handleSaveStopwatchSession
    }}>
      {children}
      
      {/* Toast Notifications UI */}
      <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-[9999] flex flex-col gap-3 pointer-events-none`}>
        {notifications.map(n => (
          <div 
            key={n.id}
            className={`pointer-events-auto px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-4 fade-in duration-300 opacity-100 ${
              n.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
              n.type === 'error' ? 'bg-red-600 text-white border-red-500' :
              'bg-accent text-white border-accent-glow'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full bg-white`} />
            <span className="font-bold text-sm tracking-wide">{n.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
