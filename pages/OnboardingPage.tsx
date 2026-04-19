import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Sun, Moon, Zap, Brain, Check } from 'lucide-react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    wakeTime: '07:00',
    sleepTime: '23:00',
    energyPeak: 'morning'
  });
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Saving basic info to 'users'
      await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: formData.name,
        });

      // Saving life cycle info to 'life_profiles'
      const { error } = await supabase
        .from('life_profiles')
        .upsert({
          user_id: user.id,
          wake_time: formData.wakeTime,
          sleep_time: formData.sleepTime,
          energy_peak: formData.energyPeak
        });

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
      title: "What's your name?",
      subtitle: "Let's personalize your Life OS experience.",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter your name"
            className="w-full bg-bg-secondary/50 border-none rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-accent/20 transition-all text-lg font-medium"
          />
        </div>
      )
    },
    {
      title: "Your Daily Rhythm",
      subtitle: "When do you usually start and end your day?",
      icon: Sun,
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Wake Up</label>
            <input 
              type="time" 
              value={formData.wakeTime}
              onChange={(e) => setFormData({...formData, wakeTime: e.target.value})}
              className="w-full bg-bg-secondary/50 border-none rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Sleep</label>
            <input 
              type="time" 
              value={formData.sleepTime}
              onChange={(e) => setFormData({...formData, sleepTime: e.target.value})}
              className="w-full bg-bg-secondary/50 border-none rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
        </div>
      )
    },
    {
      title: "Peak Energy",
      subtitle: "When do you feel most productive and alert?",
      icon: Zap,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {['morning', 'afternoon', 'evening', 'night'].map((peak) => (
            <button
              key={peak}
              onClick={() => setFormData({...formData, energyPeak: peak as any})}
              className={`p-4 rounded-2xl border transition-all text-left capitalize font-bold ${formData.energyPeak === peak ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-bg-secondary/50 border-transparent hover:border-accent/30'}`}
            >
              {peak}
            </button>
          ))}
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
              {loading ? 'Setting up...' : step === steps.length ? 'Finish' : 'Next'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
