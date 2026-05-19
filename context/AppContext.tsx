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

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

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
