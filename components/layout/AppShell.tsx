import React, { useState } from 'react';
import { 
  LayoutDashboard, MessageSquare, Target, CheckSquare, 
  Activity, StickyNote, Settings, Heart, Calendar, 
  Bell, Sun, Moon, Search, Plus, User, LogOut
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';

const Sidebar = () => {
  const { t, language } = useAppContext();
  const [isHovered, setIsHovered] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { id: 'chat', icon: MessageSquare, label: t('chat'), path: '/chat' },
    { id: 'plans', icon: Target, label: t('plans'), path: '/plans' },
    { id: 'tasks', icon: CheckSquare, label: t('tasks'), path: '/tasks' },
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
  
  return (
    <div className={`fixed top-4 ${language === 'ar' ? 'right-24 left-4' : 'left-24 right-4'} h-16 glass-card z-40 flex items-center justify-between px-6 border-none shadow-lg`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search your OS..." 
            className="w-full bg-bg-secondary/50 border-none rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={toggleMode}
          className="p-2.5 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all"
          title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="p-2.5 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
        </button>
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

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { language } = useAppContext();
  
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-accent/30">
      <Sidebar />
      <Topbar />
      <main className={`pt-24 ${language === 'ar' ? 'pr-24 pl-4' : 'pl-24 pr-4'} min-h-screen transition-all duration-300`}>
        <div className="max-w-7xl mx-auto pb-12">
          {children}
        </div>
      </main>
    </div>
  );
};
