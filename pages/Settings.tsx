import React from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Globe, Palette, Bell, User, Shield, LogOut, ChevronRight } from 'lucide-react';

export const Settings = () => {
  const { t, language, setLanguage, theme, setTheme, mode, toggleMode } = useAppContext();

  const sections = [
    { id: 'profile', icon: User, label: t('profile'), description: 'Manage your personal information' },
    { id: 'language', icon: Globe, label: t('language'), description: 'Choose your preferred language' },
    { id: 'theme', icon: Palette, label: t('theme'), description: 'Customize your visual experience' },
    { id: 'notifications', icon: Bell, label: t('notifications'), description: 'Configure your alert preferences' },
    { id: 'security', icon: Shield, label: 'Security', description: 'Manage your account security' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-text-primary">{t('settings')}</h1>
        <p className="text-text-secondary mt-1">Manage your preferences and account settings</p>
      </header>

      <div className="space-y-4">
        {sections.map(section => (
          <motion.div 
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 flex items-center justify-between hover:border-accent/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-bg-secondary flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <section.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">{section.label}</h3>
                <p className="text-sm text-text-secondary">{section.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {section.id === 'language' && (
                <div className="flex bg-bg-secondary p-1 rounded-xl border border-border">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setLanguage('en'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    EN
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setLanguage('ar'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'ar' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    AR
                  </button>
                </div>
              )}

              {section.id === 'theme' && (
                <div className="flex bg-bg-secondary p-1 rounded-xl border border-border">
                  {['midnight', 'aurora', 'solar'].map(tName => (
                    <button 
                      key={tName}
                      onClick={(e) => { e.stopPropagation(); setTheme(tName as any); }}
                      className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${theme === tName ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      <div className={`w-4 h-4 rounded-full ${tName === 'midnight' ? 'bg-[#7C5CFC]' : tName === 'aurora' ? 'bg-[#00C896]' : 'bg-[#F5A623]'}`}></div>
                    </button>
                  ))}
                </div>
              )}

              <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      <button className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-500/20">
        <LogOut className="w-5 h-5" />
        {t('logout') || 'Logout'}
      </button>
    </div>
  );
};
