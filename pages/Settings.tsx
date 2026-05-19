import React from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { 
  Moon, Sun, Monitor, Bell, Globe, 
  Palette, User, Shield, LogOut, ChevronRight 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'wouter';

export const Settings = () => {
  const { t, language, setLanguage, theme, setTheme, mode, toggleMode } = useAppContext();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation('/');
  };

  const themes = [
    { id: 'midnight', name: 'Midnight Purple', color: '#7C5CFC' },
    { id: 'aurora', name: 'Aurora Green', color: '#00C896' },
    { id: 'solar', name: 'Solar Orange', color: '#F5A623' }
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-secondary">Customize your life OS experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Appearance */}
        <section className="glass-card p-8 space-y-8 flex flex-col">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border/30 pb-4 text-text-primary">
            <Monitor size={20} className="text-accent" /> Appearance
          </h2>

          <div className="space-y-4">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Mode</label>
            <div className="flex bg-bg-secondary p-1 rounded-xl border border-border">
              <button 
                onClick={() => mode !== 'light' && toggleMode()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${mode === 'light' ? 'bg-bg-primary shadow-lg text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Sun size={16} /> Light
              </button>
              <button 
                onClick={() => mode !== 'dark' && toggleMode()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${mode === 'dark' ? 'bg-bg-primary shadow-lg text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Moon size={16} /> Dark
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Accent Theme</label>
            <div className="grid grid-cols-3 gap-4">
              {themes.map(th => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === th.id ? 'border-accent bg-accent/5' : 'border-border bg-bg-secondary/50 hover:border-accent/50'}`}
                >
                  <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: th.color }} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{th.id}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Preferences */}
        <div className="space-y-8">
          <section className="glass-card p-8 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border/30 pb-4 text-text-primary">
              <Globe size={20} className="text-accent" /> Language
            </h2>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setLanguage('en')}
                className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${language === 'en' ? 'border-accent text-accent bg-accent/5' : 'border-border text-text-secondary hover:text-text-primary'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('ar')}
                className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${language === 'ar' ? 'border-accent text-accent bg-accent/5' : 'border-border text-text-secondary hover:text-text-primary'}`}
              >
                العربية
              </button>
            </div>
          </section>

          <section className="glass-card p-8 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border/30 pb-4 text-text-primary">
              <Bell size={20} className="text-accent" /> Notifications
            </h2>
            
            <div className="space-y-4">
              {['Task Reminders', 'Habit Reminders', 'AI Suggestions'].map(notif => (
                <div key={notif} className="flex items-center justify-between group">
                  <span className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">{notif}</span>
                  <button className="w-12 h-6 rounded-full bg-accent relative transition-all shadow-inner">
                    <span className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
          </section>
          
          <button 
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-500/20 shadow-lg shadow-red-500/5"
          >
            <LogOut className="w-5 h-5" />
            Logout Account
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
