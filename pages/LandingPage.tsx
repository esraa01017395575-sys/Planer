import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Brain, Sparkles, Target, 
  Calendar, ArrowRight, Zap, ListTodo, Shield, Star
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const LandingPage = () => {
  const [, setLocation] = useLocation();
  const { mode } = useAppContext();

  // Redirect to auth handler
  const handleGetStarted = () => {
    setLocation('/auth');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden relative font-sans">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 md:mx-auto max-w-6xl px-6 py-4 flex items-center justify-between border border-border/50 rounded-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-accent/20">
            L
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Life OS</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/auth">
            <span className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              Sign In
            </span>
          </Link>
          <button 
            onClick={handleGetStarted}
            className="bg-text-primary text-bg-primary px-5 py-2.5 rounded-full text-sm font-bold shadow-xl hover:scale-105 transition-transform duration-300 flex items-center gap-2"
          >
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-4 max-w-6xl mx-auto relative z-10">
        
        {/* Hero Section */}
        <motion.section 
          className="text-center max-w-4xl mx-auto mt-16 mb-32 space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-bold text-sm border border-accent/20 shadow-inner mb-4">
            <Sparkles size={16} />
            <span>The ultimate productivity system</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.1]">
            Organize your life. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-indigo-500">
              Empower your future.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            More than just a to-do list. Life OS is your personal AI-powered workspace to manage tasks, track habits, build plans, and unlock your highest potential.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-accent text-white font-bold text-lg hover:bg-accent/90 shadow-2xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              Start Your Journey <ArrowRight size={20} />
            </button>
            <button 
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-card font-bold text-lg hover:bg-bg-secondary transition-colors"
            >
              View Demo
            </button>
          </motion.div>
        </motion.section>

        {/* Bento Grid Features */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything you need to thrive</h2>
            <p className="text-text-secondary">A seamlessly integrated ecosystem of tools designed for deep work.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 - Large */}
            <div className="md:col-span-2 glass-card p-8 md:p-12 rounded-[2rem] border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full transition-transform duration-700 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                  <Brain className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">AI Career & Life Coach</h3>
                <p className="text-text-secondary max-w-md text-lg leading-relaxed">
                  Chat with a specialized AI assistant that helps you discover your career path, break down massive goals, and generate actionable step-by-step plans.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 rounded-[2rem] border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full transition-transform duration-700 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <ListTodo className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Tasks</h3>
                <p className="text-text-secondary">
                  Kanban boards, priority tagging, and AI subtask generation keep you organized.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 rounded-[2rem] border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-2xl rounded-full transition-transform duration-700 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                  <Target className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Habit Tracking</h3>
                <p className="text-text-secondary">
                  Build unbreakable habits with visual streaks and automated reminders.
                </p>
              </div>
            </div>

            {/* Feature 4 - Large */}
            <div className="md:col-span-2 glass-card p-8 md:p-12 rounded-[2rem] border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-3xl rounded-full transition-transform duration-700 group-hover:scale-150" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/20">
                  <Zap className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Pomodoro & Focus</h3>
                <p className="text-text-secondary max-w-md text-lg leading-relaxed">
                  Enter deep work states with integrated classic and deep-work Pomodoro timers, complete with aesthetic floating widgets and soothing sounds.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <section className="text-center py-20 px-8 glass-card rounded-[3rem] relative overflow-hidden border border-border/50">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 pointer-events-none" />
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Ready to transform your workflow?</h2>
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Join users who have taken control of their time and accelerated their personal growth.
          </p>
          <button 
            onClick={handleGetStarted}
            className="px-10 py-5 rounded-2xl bg-text-primary text-bg-primary font-bold text-xl hover:scale-105 transition-transform duration-300 shadow-2xl"
          >
            Create Free Account
          </button>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
              L
            </div>
            <span className="font-display font-bold">Life OS</span>
          </div>
          <p className="text-text-secondary text-sm">
            © {new Date().getFullYear()} Life OS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
