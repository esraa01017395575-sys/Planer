import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Sun, Moon, Zap, Brain, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function OnboardingPage() {
  const { language } = useAppContext();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    wakeTime: '07:00',
    sleepTime: '23:00',
    energyPeak: 'morning',
    lifeAreas: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update name in users table if needed
      await supabase
        .from('users')
        .update({ name: formData.name })
        .eq('id', user.id);

      // Upsert into life_profiles table
      const formattedWake = formData.wakeTime ? (formData.wakeTime.length === 5 ? `${formData.wakeTime}:00` : formData.wakeTime) : '07:00:00';
      const formattedSleep = formData.sleepTime ? (formData.sleepTime.length === 5 ? `${formData.sleepTime}:00` : formData.sleepTime) : '23:00:00';

      const { error } = await supabase
        .from('life_profiles')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          name: formData.name,
          wake_time: formattedWake,
          sleep_time: formattedSleep,
          energy_peak: formData.energyPeak,
          life_areas: formData.lifeAreas,
          is_onboarded: true
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setLocation('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: language === 'ar' ? "ما هو اسمك؟" : "What's your name?",
      subtitle: language === 'ar' ? "دعنا نضفي طابعاً شخصياً على تجربتك." : "Let's personalize your Life OS experience.",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder={language === 'ar' ? "أدخل اسمك هنا" : "Enter your name"}
            className="w-full bg-bg-secondary/50 border-none rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-accent/20 transition-all text-lg font-medium text-text-primary"
          />
        </div>
      )
    },
    {
      title: language === 'ar' ? "إيقاعك اليومي" : "Your Daily Rhythm",
      subtitle: language === 'ar' ? "متى تبدأ وتنهي يومك عادةً؟" : "When do you usually start and end your day?",
      icon: Sun,
      content: (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
              {language === 'ar' ? 'الاستيقاظ' : 'Wake Up'}
            </label>
            <input 
              type="time" 
              value={formData.wakeTime}
              onChange={(e) => setFormData({...formData, wakeTime: e.target.value})}
              className="w-full bg-bg-secondary/50 border-none rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-accent/20 transition-all text-text-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
              {language === 'ar' ? 'النوم' : 'Sleep'}
            </label>
            <input 
              type="time" 
              value={formData.sleepTime}
              onChange={(e) => setFormData({...formData, sleepTime: e.target.value})}
              className="w-full bg-bg-secondary/50 border-none rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-accent/20 transition-all text-text-primary"
            />
          </div>
        </div>
      )
    },
    {
      title: language === 'ar' ? "أوقات طاقتك القصوى" : "Peak Energy",
      subtitle: language === 'ar' ? "متى تشعر بالنشاط والإنتاجية العالية؟" : "When do you feel most productive and alert?",
      icon: Zap,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {['morning', 'afternoon', 'evening', 'night'].map((peak) => {
            const labelAr = peak === 'morning' ? 'الصباح' : peak === 'afternoon' ? 'الظهيرة' : peak === 'evening' ? 'المساء' : 'الليل';
            return (
              <button
                key={peak}
                onClick={() => setFormData({...formData, energyPeak: peak as any})}
                className={`p-4 rounded-2xl border transition-all text-left capitalize font-bold ${formData.energyPeak === peak ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-bg-secondary/50 border-transparent hover:border-accent/30 text-text-primary'}`}
              >
                {language === 'ar' ? labelAr : peak}
              </button>
            );
          })}
        </div>
      )
    },
    {
      title: language === 'ar' ? "مجالات الاهتمام والتركيز" : "Areas of Focus",
      subtitle: language === 'ar' ? "اختر المجالات التي تود تحسينها وتتبعها (يمكنك اختيار أكثر من مجال)" : "Select the areas you'd like to improve and track (you can select multiple).",
      icon: Brain,
      content: (
        <div className="grid grid-cols-1 gap-3">
          {[
            { key: 'productivity', ar: 'الإنتاجية والتركيز ⚡', en: 'Productivity & Focus ⚡' },
            { key: 'health', ar: 'الصحة واللياقة البدنية 💪', en: 'Health & Fitness 💪' },
            { key: 'learning', ar: 'التعلم وتطوير المهارات 📚', en: 'Learning & Skills 📚' },
            { key: 'spiritual', ar: 'الجانب الروحي والراحة النفسية 🧘', en: 'Spiritual & Wellness 🧘' },
            { key: 'social', ar: 'العلاقات والجانب الاجتماعي 🤝', en: 'Social & Relationships 🤝' }
          ].map((area) => {
            const isSelected = formData.lifeAreas.includes(area.key);
            return (
              <button
                key={area.key}
                onClick={() => {
                  if (isSelected) {
                    setFormData({
                      ...formData,
                      lifeAreas: formData.lifeAreas.filter(a => a !== area.key)
                    });
                  } else {
                    setFormData({
                      ...formData,
                      lifeAreas: [...formData.lifeAreas, area.key]
                    });
                  }
                }}
                className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between font-bold ${
                  isSelected 
                    ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                    : 'bg-bg-secondary/50 border-transparent hover:border-accent/30 text-text-primary'
                }`}
              >
                <span>{language === 'ar' ? area.ar : area.en}</span>
                {isSelected && <Check className="w-5 h-5 text-white" />}
              </button>
            );
          })}
        </div>
      )
    }
  ];

  const currentStepData = steps[step - 1];

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-indigo-500 shadow-xl shadow-accent/20 mb-6">
            <currentStepData.icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight mb-2">
            {currentStepData.title}
          </h1>
          <p className="text-text-secondary">
            {currentStepData.subtitle}
          </p>
        </div>

        <div className="glass-card p-8 border-none shadow-2xl">
          {currentStepData.content}

          <div className="mt-10 flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${i + 1 === step ? 'w-8 bg-accent' : 'w-2 bg-bg-secondary'}`}
                />
              ))}
            </div>
            
            <button 
              onClick={() => step < steps.length ? setStep(step + 1) : handleComplete()}
              disabled={loading || (step === 1 && !formData.name)}
              className="bg-accent text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-accent/20 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (language === 'ar' ? 'جاري الإعداد...' : 'Setting up...') : step === steps.length ? (language === 'ar' ? 'إنهاء' : 'Finish') : (language === 'ar' ? 'التالي' : 'Next')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
