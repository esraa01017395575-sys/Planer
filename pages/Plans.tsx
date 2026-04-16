import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Clock, ChevronRight, Plus, MessageSquare } from 'lucide-react';

export const Plans = ({ plans: propsPlans, onAskAI: propsOnAskAI }: { plans?: any[], onAskAI?: (content: string) => void }) => {
  const { t, language } = useAppContext();
  const [activeTab, setActiveTab] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<any[]>(propsPlans || []);
  const onAskAI = propsOnAskAI || ((content: string) => console.log('Ask AI:', content));

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text-primary">{t('long_term_plans')}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-xl border border-border">
            {['monthly', 'quarterly', 'yearly'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {t(tab)}
              </button>
            ))}
          </div>
          <button 
            onClick={() => onAskAI("I want to create a new long-term plan")}
            className="px-6 py-3 bg-accent text-white font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('new_plan_via_ai')}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.filter(p => p.type === activeTab || !p.type).map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-6 group hover:border-accent/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">{plan.title}</h3>
                <p className="text-xs text-text-secondary mt-1">{plan.duration || '2 months'}</p>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Target className="w-5 h-5 text-accent" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-text-secondary">{plan.progress || 45}% complete</span>
                <span className="text-accent">{plan.status || 'In progress'}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${plan.progress || 45}%` }}
                  className="h-full bg-accent"
                ></motion.div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Current Phase</span>
              </div>
              <p className="text-sm font-medium text-text-primary">{plan.current_phase || 'Phase 2 — Express & Databases'}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                <span>This week milestone</span>
              </div>
              <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
                <div className="w-4 h-4 rounded-full border border-text-secondary"></div>
                <span className="text-xs text-text-primary">{plan.this_week_milestone || 'Build first REST API'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <button className="flex-1 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-all">
                {t('view_full_plan')}
              </button>
              <button className="flex-1 py-2 text-xs font-bold text-accent hover:bg-accent/10 rounded-lg transition-all">
                {t('add_task_today')}
              </button>
              <button 
                onClick={() => onAskAI(`Let's talk about my plan: ${plan.title}`)}
                className="p-2 text-text-secondary hover:text-accent transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
