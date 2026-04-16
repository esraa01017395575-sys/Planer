import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    chat: 'AI Chat',
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
    daily_quote: 'AI DAILY QUOTE',
    pending_yesterday: 'PENDING FROM YESTERDAY',
    today_tasks: "TODAY'S TASKS",
    habits_today: 'HABITS TODAY',
    view_all_tasks: 'View all tasks',
    start: 'Start',
    reschedule: 'Reschedule',
    remove: 'Remove',
    add_task: 'Add task',
    new_plan: 'New plan via AI',
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
    career_session: 'Career Discovery & Analysis',
    discovery_phase: 'Discovery & Analysis Phase',
    add_to_plan: 'Add to plan',
    smart_suggestions: 'Smart Suggestions',
    based_on_chat: 'Based on our conversation',
    ai_assistant: 'AI Assistant',
    analyzing: 'Analyzing...',
    chat_placeholder: 'Talk to your career coach...',
    long_term_plans: 'Long Term Plans',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    new_plan_via_ai: 'New Plan via AI',
    view_full_plan: 'View Full Plan',
    add_task_today: 'Add Task Today',
    daily_habits: 'Daily Habits',
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
  },
  ar: {
    dashboard: 'لوحة التحكم',
    chat: 'المحادثة الذكية',
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
    daily_quote: 'حكمة اليوم الذكية',
    pending_yesterday: 'مهام معلقة من الأمس',
    today_tasks: 'مهام اليوم',
    habits_today: 'عادات اليوم',
    view_all_tasks: 'عرض كل المهام',
    start: 'ابدأ',
    reschedule: 'إعادة جدولة',
    remove: 'حذف',
    add_task: 'إضافة مهمة',
    new_plan: 'خطة جديدة بالذكاء الاصطناعي',
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
    career_session: 'مرحلة الاكتشاف والتحليل',
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
    new_plan_via_ai: 'خطة جديدة بالذكاء الاصطناعي',
    view_full_plan: 'عرض الخطة الكاملة',
    add_task_today: 'إضافة مهمة لليوم',
    daily_habits: 'العادات اليومية',
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
  }
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'midnight');
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('mode') as Mode) || 'dark');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', mode === 'dark' ? 'dark' : theme);
  }, [theme, mode]);

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

  return (
    <AppContext.Provider value={{ 
      theme, setTheme, mode, toggleMode, language, setLanguage, t, 
      addNotification, notifications 
    }}>
      {children}
      
      {/* Toast Notifications UI */}
      <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-[9999] flex flex-col gap-3 pointer-events-none`}>
        {notifications.map(n => (
          <div 
            key={n.id}
            className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-4 fade-in duration-300 ${
              n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
              n.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
              'bg-accent/10 border-accent/20 text-accent'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              n.type === 'success' ? 'bg-emerald-500' :
              n.type === 'error' ? 'bg-red-500' :
              'bg-accent'
            }`} />
            <span className="font-bold text-sm">{n.message}</span>
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
