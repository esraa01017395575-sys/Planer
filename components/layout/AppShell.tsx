import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, MessageSquare, FolderGit2, Target, CheckSquare, 
  Activity, StickyNote, Settings, Heart, Calendar, 
  Bell, Sun, Moon, Search, Plus, User, LogOut, Check, Trash2, Clock,
  Volume2, VolumeX, Maximize2, GripHorizontal, Play, Pause
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useGetNotifications, useMarkNotificationRead, useDeleteNotification } from '../../lib/hooks';

const Sidebar = () => {
  const { t, language } = useAppContext();
  const [isHovered, setIsHovered] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { id: 'chat', icon: MessageSquare, label: t('chat'), path: '/chat' },
    { id: 'plans', icon: Target, label: t('plans'), path: '/plans' },
    { id: 'tasks', icon: CheckSquare, label: t('tasks'), path: '/tasks' },
    { id: 'projects', icon: FolderGit2, label: t('projects'), path: '/projects' },
    { id: 'habits', icon: Activity, label: t('habits'), path: '/habits' },
    { id: 'notes', icon: StickyNote, label: t('notes'), path: '/notes' },
  ];

  return (
    <motion.div 
      className={`fixed top-4 bottom-4 ${language === 'ar' ? 'right-4' : 'left-4'} glass-card z-50 flex flex-col transition-all duration-300 overflow-hidden border-none shadow-xl`}
      animate={{ width: isHovered ? 260 : 72 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center shadow-lg shadow-accent/20 flex-shrink-0">
          <span className="text-white font-bold text-xl">A</span>
        </div>
        <AnimatePresence>
          {isHovered && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display font-bold text-lg whitespace-nowrap"
            >
              AI Coach Pro
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link key={item.id} href={item.path}>
            <div
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all cursor-pointer group ${location === item.path ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:bg-accent/10 hover:text-accent'}`}
            >
              <item.icon className={`w-6 h-6 flex-shrink-0 ${location === item.path ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
              <AnimatePresence>
                {isHovered && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-3 space-y-1 border-t border-border/10">
        <Link href="/favorites">
          <div
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all cursor-pointer group ${location === '/favorites' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:bg-accent/10 hover:text-accent'}`}
          >
            <Heart className={`w-6 h-6 flex-shrink-0 ${location === '/favorites' ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
            <AnimatePresence>
              {isHovered && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap font-medium"
                >
                  {t('favorites')}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
        
        <Link href="/settings">
          <div
            className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all cursor-pointer group ${location === '/settings' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:bg-accent/10 hover:text-accent'}`}
          >
            <Settings className={`w-6 h-6 flex-shrink-0 ${location === '/settings' ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
            <AnimatePresence>
              {isHovered && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap font-medium"
                >
                  {t('settings')}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};

const Topbar = () => {
  const { t, language, mode, toggleMode } = useAppContext();
  const { data: notifications, refetch } = useGetNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: deleteNotif } = useDeleteNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await markRead(n.id);
    }
    refetch();
  };

  const handleDeleteAll = async () => {
    if (confirm(t('confirmDelete'))) {
      for (const n of notifications) {
        await deleteNotif(n.id);
      }
      refetch();
    }
  };

  return (
    <div className={`fixed top-4 ${language === 'ar' ? 'right-24 left-4' : 'left-24 right-4'} h-16 glass-card z-40 flex items-center justify-between px-6 border-none shadow-lg`}>
      <div className="flex items-center gap-4 flex-1">
        {/* Search removed */}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={toggleMode}
          className="p-2.5 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
          title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-bg-card" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} w-80 glass-card bg-bg-card shadow-2xl border border-border p-4 z-50`}
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
                  <h3 className="font-bold text-sm tracking-tight">{t('notifications')}</h3>
                  <div className="flex gap-2">
                    <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest">{t('accept_all')}</button>
                    <button onClick={handleDeleteAll} className="p-1 text-text-secondary hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto no-scrollbar space-y-2">
                  {notifications?.length > 0 ? (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3 rounded-xl transition-all border ${n.is_read ? 'bg-transparent border-transparent' : 'bg-accent/5 border-accent/10'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className={`text-xs font-bold leading-snug ${n.is_read ? 'text-text-secondary' : 'text-text-primary'}`}>{n.title || 'System Notification'}</p>
                            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">{n.message}</p>
                            <div className="flex items-center gap-1.5 mt-2 opacity-60">
                              <Clock className="w-3 h-3" />
                              <span className="text-[9px] font-bold uppercase">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          {!n.is_read && (
                            <button 
                              onClick={() => { markRead(n.id); refetch(); }}
                              className="p-1 text-accent hover:bg-accent/10 rounded-lg transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-20" />
                      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-40">All caught up!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-border/10 mx-2" />
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none">Israa</p>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Pro Member</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bg-secondary border border-border/10 flex items-center justify-center overflow-hidden">
            <User className="w-6 h-6 text-text-secondary" />
          </div>
        </div>
      </div>
    </div>
  );
};

const PersistentFloatingPomodoro = () => {
  const [location, setLocation] = useLocation();
  const { 
    language,
    activePomodoro, setActivePomodoro,
    pomodoroTime, setPomodoroTime,
    isPomodoroRunning, setIsPomodoroRunning,
    pomodoroPhase, setPomodoroPhase,
    soundMuted, setSoundMuted,
    setInitialPomodoroTime
  } = useAppContext();

  if (!activePomodoro) return null;

  const minutes = String(Math.floor(pomodoroTime / 60)).padStart(2, '0');
  const seconds = String(pomodoroTime % 60).padStart(2, '0');

  const handleCancel = () => {
    if (confirm(language === 'ar' ? 'هل تريد إلغاء وإغلاق جلسة البومودورو الحالية؟' : 'Do you want to discard the active Pomodoro session?')) {
      setIsPomodoroRunning(false);
      setActivePomodoro(null);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[99999] cursor-grab active:cursor-grabbing w-64 shadow-xl rounded-xl p-3 border border-accent/20 bg-bg-card/95 backdrop-blur-xl select-none"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-border/10">
          <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-text-secondary tracking-widest leading-none">
            <GripHorizontal className="w-3 h-3 opacity-40 animate-pulse" />
            <span className={pomodoroPhase === 'focus' ? 'text-accent' : 'text-emerald-500'}>
              {pomodoroPhase === 'focus' ? (language === 'ar' ? 'تركيز 🍅' : 'Focus 🍅') : (language === 'ar' ? 'استراحة ☕' : 'Break ☕')}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button 
              onClick={() => setSoundMuted(!soundMuted)} 
              className="p-1 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-colors"
              title={soundMuted ? 'Unmute' : 'Mute'}
            >
              {soundMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={() => setLocation(`/pomodoro/${activePomodoro.id}`)} 
              className="p-1 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-colors"
              title="Expand Detail"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button 
              onClick={handleCancel} 
              className="p-1 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-500 transition-colors"
              title="Close"
            >
              <Trash2 className="w-3 object-contain h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex-1 min-w-0">
            <p className="text-[8px] text-text-secondary font-black opacity-60 uppercase mb-0.5 tracking-wider">
              {language === 'ar' ? 'المهمة الجارية' : 'ACTIVE FOCUS'}
            </p>
            <h4 className="text-[11px] font-bold text-text-primary leading-tight truncate">
              {activePomodoro.title}
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="font-mono text-base font-bold text-text-primary tabular-nums">
              {minutes}:{seconds}
            </div>

            <button
              onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-accent hover:bg-accent-glow text-white shadow-lg shadow-accent/25 transition-all active:scale-95"
            >
              {isPomodoroRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AppShell = ({ children, hideNav = false, hideTopbar = false }: { children: React.ReactNode, hideNav?: boolean, hideTopbar?: boolean }) => {
  const { language, activePomodoro } = useAppContext();
  const [location] = useLocation();

  const showFloating = activePomodoro && !location.startsWith('/pomodoro');
  
  if (hideNav) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-accent/30">
        <main className="min-h-screen transition-all duration-300">
          <div className="max-w-full mx-auto pb-12 px-0">
            {children}
          </div>
        </main>
        {showFloating && <PersistentFloatingPomodoro />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-accent/30">
      <Sidebar />
      {!hideTopbar && <Topbar />}
      <main className={`${hideTopbar ? 'pt-4' : 'pt-24'} ${language === 'ar' ? 'pr-24 pl-4' : 'pl-24 pr-4'} min-h-screen transition-all duration-300`}>
        <div className="max-w-7xl mx-auto pb-12 px-2 md:px-6">
          {children}
        </div>
      </main>

      {showFloating && <PersistentFloatingPomodoro />}
    </div>
  );
};
