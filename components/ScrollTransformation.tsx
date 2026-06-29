import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Mail, Clock, MessageSquare, ListTodo, Flame, Brain, Hourglass, 
  HelpCircle, CheckCircle2, ShieldCheck, Zap, Star 
} from 'lucide-react';

interface ScrollTransformationProps {
  language: 'en' | 'ar';
  playLandingSound: (type: 'chime' | 'tick' | 'success') => void;
}

export const ScrollTransformation: React.FC<ScrollTransformationProps> = ({ language, playLandingSound }) => {
  const isAr = language === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactiveProgress, setInteractiveProgress] = useState<number>(0);
  const [isUsingSlider, setIsUsingSlider] = useState<boolean>(false);
  const [hasTriggeredSuccess, setHasTriggeredSuccess] = useState<boolean>(false);

  // Simple math helper for linear interpolation
  const lirp = (progress: number, outMin: number, outMax: number) => {
    return outMin + progress * (outMax - outMin);
  };

  // Monitor real scroll progress of the section
  useEffect(() => {
    const handleScroll = () => {
      if (isUsingSlider || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the element is scrolled through
      // Start of effect: element enters middle of the viewport
      // End of effect: element is near top of viewport
      const startVisible = windowHeight * 0.85;
      const endVisible = windowHeight * 0.15;
      
      const currentPos = rect.top;
      const range = startVisible - endVisible;
      const rawProgress = (startVisible - currentPos) / range;
      
      // Clamp between 0 and 1
      const progress = Math.max(0, Math.min(1, rawProgress));
      setInteractiveProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isUsingSlider]);

  // Success sound trigger when fully organized
  useEffect(() => {
    if (interactiveProgress >= 0.98) {
      if (!hasTriggeredSuccess) {
        playLandingSound('success');
        setHasTriggeredSuccess(true);
      }
    } else if (interactiveProgress < 0.8) {
      setHasTriggeredSuccess(false);
    }
  }, [interactiveProgress, hasTriggeredSuccess, playLandingSound]);

  // Handle manual interaction slider
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUsingSlider(true);
    const val = parseFloat(e.target.value);
    setInteractiveProgress(val);
    
    // Play a gentle ticking sound as things straighten out
    if (Math.round(val * 20) % 3 === 0) {
      playLandingSound('tick');
    }
  };

  // Translations
  const t = {
    en: {
      title: "From Clutter & Chaos to Flow State",
      subtitle: "Watch the magic. Scroll down or drag the slider to witness how Life OS simplifies and untangles a chaotic day into focused mastery.",
      chaosBadge: "CHAOS & SCATTERED BRAIN",
      organizedBadge: "FLOW STATE UNLOCKED",
      distractedPerson: "Distracted Mind",
      focusedPerson: "Sovereign Mind",
      sliderLabel: "Interactive Sandbox: Slide to untangle your day:",
      chaosState: "Too many notifications, missed streaks, scattered ideas, zero directions...",
      flowState: "Tasks scheduled, habits burning, deep focus running, AI Coach guiding...",
      taskWidgetTitle: "Smart Task list",
      taskWidgetDesc: "Structured Kanban prioritizes your prime actions.",
      habitWidgetTitle: "Habit Streaks",
      habitWidgetDesc: "Fire counters keep consistency highly rewarding.",
      pomoWidgetTitle: "Deep Pomodoro",
      pomoWidgetDesc: "Ticking acoustic cues enter absolute flow.",
      coachWidgetTitle: "AI Career Coach",
      coachWidgetDesc: "Daily tactical roadmaps in Egyptian or English.",
      resetButton: "Re-enable scroll-tracking",
      clickToTick: "Click here to test chime!"
    },
    ar: {
      title: "من التشتت والفوضى.. إلى قمة التركيز والتدفق",
      subtitle: "شاهد السحر بنفسك! قم بالتمرير للأسفل أو اسحب شريط التحكم البصري لتشاهد كيف يقوم نظام Life OS بفك تشابك خيوط يومك المزدحم وتنظيمه بسلاسة.",
      chaosBadge: "عقل مشتت وأفكار عشوائية مبعثرة",
      organizedBadge: "دخول زون التركيز والتدفق (Flow State)",
      distractedPerson: "تشتت مستمر",
      focusedPerson: "ترتيب سيادي",
      sliderLabel: "محاكي تفاعلي: مرر بإصبعك لترتيب يومك وفك التشابك:",
      chaosState: "إشعارات لا نهائية، عادات مفقودة، مهام منسية وتشتيط دائم...",
      flowState: "المهام مجدولة، سلاسل العادات تشتعل، مؤقت البومودورو يدق، والكوتش يوجهك...",
      taskWidgetTitle: "لوحات المهام",
      taskWidgetDesc: "ترتيب كانبان يقضي تماماً على التسويف.",
      habitWidgetTitle: "سلاسل الالتزام",
      habitWidgetDesc: "شعلات متقدة تدفعك باستمرار للإنجاز.",
      pomoWidgetTitle: "بومودورو المركّز",
      pomoWidgetDesc: "تكتكات مدروسة تبقيك منغمساً في العمل.",
      coachWidgetTitle: "كوتش الأداء",
      coachWidgetDesc: "توجيه باللهجة المصرية العامية وخارطة طريق شهرية.",
      resetButton: "العودة للتتبع التلقائي مع السكرول",
      clickToTick: "اضغط هنا لتجربة الرنين!"
    }
  }[isAr ? 'ar' : 'en'];

  // Smooth layout values for dynamic SVG paths representing the "Tangled Threads"
  const getPathData = (index: number, progress: number) => {
    // Starts at distracted head (center left) and ends at respective widget on the right
    // Progress goes 0 to 1.
    // 0 = extreme loops/waves representing tangled threads.
    // 1 = perfectly straightened paths.
    
    const startX = 140;
    const startY = 160 + (index - 1.5) * 20 * (1 - progress); // start close together
    
    // Target y positions for the 4 organized widgets on the right
    const targetY = 65 + index * 75; 
    const targetX = 420;

    if (progress >= 0.99) {
      // Perfectly straight line to destination
      return `M ${startX} ${startY} L ${targetX} ${targetY}`;
    }

    // Generate chaotic waves depending on progress
    const amp = 80 * (1 - progress); // amplitude of chaos decreases to 0
    const freq = 3.5 + index; // wave frequency
    
    const midX1 = startX + (targetX - startX) * 0.25;
    const midY1 = startY + (targetY - startY) * 0.25 + Math.sin(progress * Math.PI + index) * amp * 1.2;
    
    const midX2 = startX + (targetX - startX) * 0.6;
    const midY2 = startY + (targetY - startY) * 0.6 + Math.cos(progress * Math.PI + index * 1.5) * amp * -1.4;

    const midX3 = startX + (targetX - startX) * 0.85;
    const midY3 = targetY + Math.sin(progress * Math.PI * 2) * (amp * 0.3);

    return `M ${startX} ${startY} C ${midX1} ${midY1}, ${midX2} ${midY2}, ${midX3} ${midY3} T ${targetX} ${targetY}`;
  };

  return (
    <section 
      ref={containerRef}
      className="mb-24 md:mb-32 relative scroll-mt-28"
      id="chaos-transformation"
    >
      {/* Background glow orbs that change colors with progress */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
        <div 
          className="absolute -top-1/4 -left-1/4 w-96 h-96 rounded-full blur-[100px] transition-all duration-700" 
          style={{
            backgroundColor: `rgba(${255 - Math.round(interactiveProgress * 150)}, ${70 + Math.round(interactiveProgress * 100)}, ${70 + Math.round(interactiveProgress * 180)}, 0.08)`
          }}
        />
        <div 
          className="absolute -bottom-1/4 -right-1/4 w-96 h-96 rounded-full blur-[100px] transition-all duration-700"
          style={{
            backgroundColor: `rgba(${99 + Math.round(interactiveProgress * 100)}, ${102 + Math.round(interactiveProgress * 110)}, ${241}, 0.06)`
          }}
        />
      </div>

      <div className="text-center mb-10 space-y-3 relative z-10">
        <span className="text-[10px] font-black uppercase text-accent tracking-widest bg-accent/15 px-3 py-1 rounded-full border border-accent/25">
          {isAr ? "الانتقال البصري المذهل ⚡" : "DYNAMIC VISUAL TRANSFORMATION"}
        </span>
        <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-text-primary to-text-primary/70">
          {t.title}
        </h2>
        <p className="text-xs md:text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      <div className="glass-card border border-border/55 rounded-[2.5rem] bg-bg-card/40 shadow-2xl p-6 md:p-10 relative overflow-hidden z-10">
        
        {/* Dynamic Controls Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/20 pb-6 mb-8">
          <div className="w-full md:w-auto space-y-1">
            <label className="text-xs font-bold text-text-secondary block flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400 animate-pulse" />
              <span>{t.sliderLabel}</span>
            </label>
            <div className="flex items-center gap-3 w-full max-w-md">
              <span className="text-[10px] font-mono text-rose-500 font-bold uppercase">{isAr ? "فوضى" : "Chaos"}</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={interactiveProgress}
                onChange={handleSliderChange}
                className="accent-accent flex-1 h-1.5 rounded-full bg-border/40 cursor-pointer transition-all duration-150 relative z-20"
              />
              <span className="text-[10px] font-mono text-accent font-bold uppercase">{isAr ? "انضباط" : "Flow"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUsingSlider && (
              <button 
                onClick={() => {
                  setIsUsingSlider(false);
                  playLandingSound('chime');
                }}
                className="text-[10px] font-mono bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-full border border-border/15 transition-all cursor-pointer"
              >
                {t.resetButton}
              </button>
            )}
            
            <div className="hidden sm:flex items-center gap-1 bg-bg-secondary/40 border border-border/15 rounded-full px-3 py-1 text-[11px] font-mono font-bold text-text-secondary">
              <span className="text-accent">Progress:</span>
              <span>{Math.round(interactiveProgress * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Visual Arena Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center min-h-[460px] relative">
          
          {/* Left Block: The Character Aura (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col items-center text-center space-y-5 relative">
            
            {/* Status Badge */}
            <AnimatePresence mode="wait">
              {interactiveProgress < 0.5 ? (
                <motion.div 
                  key="chaos-badge"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-[10px] tracking-wider uppercase"
                >
                  {t.chaosBadge}
                </motion.div>
              ) : (
                <motion.div 
                  key="flow-badge"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1.5"
                >
                  <Sparkles size={11} className="animate-spin-slow text-accent" />
                  <span>{t.organizedBadge}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Character Face Drawing Container */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              
              {/* Dynamic Aura background rings that shrink/expand/change colors */}
              <motion.div 
                className="absolute inset-0 rounded-full border border-dashed transition-colors duration-500"
                style={{
                  borderColor: interactiveProgress > 0.5 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                  scale: 1 + (1 - interactiveProgress) * 0.2
                }}
                animate={{ rotate: interactiveProgress > 0.5 ? 45 : -45 }}
                transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
              />

              <motion.div 
                className="absolute inset-2 rounded-full border transition-colors duration-500"
                style={{
                  borderColor: interactiveProgress > 0.5 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                  scale: 0.9 + (1 - interactiveProgress) * 0.15
                }}
                animate={{ rotate: interactiveProgress > 0.5 ? -360 : 360 }}
                transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
              />

              {/* Real character head styling with CSS */}
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-bg-secondary to-bg-secondary/40 border border-border/40 relative z-10 flex flex-col items-center justify-center shadow-lg">
                
                {/* Hair */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-[112%] h-12 bg-text-primary rounded-t-full rounded-b-2xl overflow-hidden opacity-90" />

                {/* Eyes Block */}
                <div className="flex gap-4 mt-3">
                  {interactiveProgress < 0.5 ? (
                    <>
                      {/* Chaotic spinning eyes */}
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-dashed border-rose-500 flex items-center justify-center font-mono text-[9px] font-black text-rose-500"
                      >
                        @
                      </motion.div>
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-5 h-5 rounded-full border-2 border-dashed border-rose-500 flex items-center justify-center font-mono text-[9px] font-black text-rose-500"
                      >
                        @
                      </motion.div>
                    </>
                  ) : (
                    <>
                      {/* Calm, happy, glittering stars / glasses eyes */}
                      <motion.div 
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 flex items-center justify-center text-accent font-black text-base"
                      >
                        ✧
                      </motion.div>
                      <motion.div 
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 flex items-center justify-center text-accent font-black text-base"
                      >
                        ✧
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Mouth Block */}
                <div className="mt-3">
                  {interactiveProgress < 0.3 ? (
                    // Stressed squiggly line
                    <svg width="24" height="6" viewBox="0 0 24 6" fill="none">
                      <path d="M1 3C3 1 5 5 7 3C9 1 11 5 13 3C15 1 17 5 19 3C21 1 23 5 25 3" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : interactiveProgress < 0.65 ? (
                    // Flat concentrated line
                    <div className="w-5 h-0.5 bg-text-secondary rounded-full" />
                  ) : (
                    // Happy wide smile
                    <motion.div 
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      className="w-8 h-3 border-b-3 border-indigo-500 rounded-b-full bg-indigo-500/10" 
                    />
                  )}
                </div>

                {/* Aura accessories */}
                {interactiveProgress > 0.8 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-1 w-6 h-1 bg-accent blur-[2px] rounded-full animate-bounce [animation-delay:0.3s]" 
                  />
                )}
              </div>

              {/* Dynamic chaotic particles that fly outwards when progress goes from 0 to 1 */}
              {interactiveProgress < 0.7 && (
                <div className="absolute inset-0 pointer-events-none select-none z-10 font-mono text-sm">
                  {/* Alert particle 1 */}
                  <motion.div 
                    className="absolute top-2 left-2 text-rose-500"
                    animate={{ 
                      x: [-10, 10, -10], 
                      y: [-5, 5, -5],
                      opacity: 1 - interactiveProgress * 1.3
                    }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                  >
                    <Mail size={16} className="text-rose-500 animate-bounce" />
                  </motion.div>

                  {/* Tick Alarm particle 2 */}
                  <motion.div 
                    className="absolute bottom-4 left-3"
                    animate={{ 
                      rotate: [0, 360],
                      opacity: 1 - interactiveProgress * 1.3
                    }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  >
                    <Clock size={16} className="text-orange-400" />
                  </motion.div>

                  {/* Collision particle 3 */}
                  <motion.div 
                    className="absolute top-4 right-3 text-red-400"
                    animate={{ 
                      scale: [0.9, 1.1, 0.9],
                      opacity: 1 - interactiveProgress * 1.3
                    }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  >
                    <MessageSquare size={16} className="text-red-400" />
                  </motion.div>

                  {/* Text labels */}
                  <motion.span 
                    className="absolute bottom-1 right-2 text-[10px] font-black text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20"
                    style={{ opacity: 1 - interactiveProgress * 1.5 }}
                  >
                    {isAr ? "ضغوط" : "STRESS"}
                  </motion.span>
                </div>
              )}

              {/* Sparkling confetti on 100% flow */}
              {interactiveProgress >= 0.96 && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.2, 1], 
                        opacity: [0, 1, 0],
                        x: [0, (idx - 2.5) * 45],
                        y: [0, -60 - (idx % 2) * 20]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        repeatType: "loop",
                        delay: idx * 0.2 
                      }}
                      className="absolute left-[45%] top-[45%] text-amber-400"
                    >
                      <Star size={14} fill="currentColor" />
                    </motion.div>
                  ))}
                </div>
              )}

            </div>

            <div className="space-y-1 w-full px-4 relative z-10">
              <h3 className="font-display font-extrabold text-base text-text-primary">
                {interactiveProgress < 0.5 ? t.distractedPerson : t.focusedPerson}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed transition-all duration-300">
                {interactiveProgress < 0.5 ? t.chaosState : t.flowState}
              </p>
            </div>
          </div>

          {/* Center Block: Interactive Morphing SVG Threads (lg:col-span-4) */}
          <div className="lg:col-span-4 h-96 relative hidden lg:flex items-center justify-center overflow-visible">
            {/* Thread wires svg container */}
            <svg 
              className="w-full h-full absolute inset-0 pointer-events-none overflow-visible" 
              viewBox="0 0 500 400"
              style={{ direction: 'ltr' }} // Force standard direction for canvas-style path alignment
            >
              <defs>
                <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>

                <linearGradient id="straightLaser" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                </linearGradient>
              </defs>

              {/* Drawing dynamic paths */}
              {[1, 2, 3, 4].map((idx) => {
                const pathD = getPathData(idx, interactiveProgress);
                const isStraight = interactiveProgress >= 0.98;
                return (
                  <g key={idx}>
                    {/* Shadow guide road */}
                    <motion.path 
                      d={pathD}
                      fill="none"
                      stroke={isStraight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.03)'}
                      strokeWidth={isStraight ? 5 : 3}
                      transition={{ duration: 0.1 }}
                    />
                    
                    {/* Active glowing thread */}
                    <motion.path 
                      d={pathD}
                      fill="none"
                      stroke={isStraight ? "url(#straightLaser)" : "url(#laserGrad)"}
                      strokeWidth={isStraight ? 3 : 2}
                      strokeDasharray={isStraight ? "none" : "8, 3"}
                      className={isStraight ? "" : "animate-pulse"}
                      transition={{ duration: 0.1 }}
                      animate={isStraight ? {} : {
                        strokeDashoffset: [-20, 20],
                      }}
                      // @ts-ignore
                      animate-duration="2s"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Block: Aligned Target Dashboards (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-3 relative w-full lg:max-w-none">
            
            {/* Widget 1: Smart Task Boards */}
            <motion.div 
              style={{
                scale: lirp(interactiveProgress, 0.93, 1),
                opacity: lirp(interactiveProgress, 0.35, 1),
                borderColor: interactiveProgress > 0.4 ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.05)',
                boxShadow: interactiveProgress > 0.5 ? '0 10px 25px -5px rgba(99, 102, 241, 0.15)' : 'none'
              }}
              className="p-3 rounded-2xl border bg-bg-secondary/40 backdrop-blur-md flex items-center gap-3 transition-colors duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center flex-shrink-0">
                <ListTodo className="text-accent" size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                  <span>{t.taskWidgetTitle}</span>
                  {interactiveProgress > 0.6 && <CheckCircle2 size={12} className="text-accent" />}
                </h4>
                <p className="text-[10px] text-text-secondary truncate">{t.taskWidgetDesc}</p>
              </div>
            </motion.div>

            {/* Widget 2: Habit Tracker Streaks */}
            <motion.div 
              style={{
                scale: lirp(interactiveProgress, 0.91, 1),
                opacity: lirp(interactiveProgress, 0.35, 1),
                borderColor: interactiveProgress > 0.6 ? 'rgba(239, 104, 30, 0.4)' : 'rgba(255,255,255,0.05)',
                boxShadow: interactiveProgress > 0.7 ? '0 10px 25px -5px rgba(239, 104, 30, 0.15)' : 'none'
              }}
              className="p-3 rounded-2xl border bg-bg-secondary/40 backdrop-blur-md flex items-center gap-3 transition-colors duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
                <Flame className="text-orange-500" size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                  <span>{t.habitWidgetTitle}</span>
                  {interactiveProgress > 0.8 && (
                    <span className="text-[9px] font-black uppercase text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">
                      5 Streak 🔥
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-text-secondary truncate">{t.habitWidgetDesc}</p>
              </div>
            </motion.div>

            {/* Widget 3: Deep Pomodoro focused interval */}
            <motion.div 
              style={{
                scale: lirp(interactiveProgress, 0.89, 1),
                opacity: lirp(interactiveProgress, 0.35, 1),
                borderColor: interactiveProgress > 0.75 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255,255,255,0.05)',
                boxShadow: interactiveProgress > 0.8 ? '0 10px 25px -5px rgba(244, 63, 94, 0.15)' : 'none'
              }}
              className="p-3 rounded-2xl border bg-bg-secondary/40 backdrop-blur-md flex items-center gap-3 transition-colors duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center flex-shrink-0">
                <Hourglass className="text-rose-500 animate-spin-slow" size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                  <span>{t.pomoWidgetTitle}</span>
                  {interactiveProgress > 0.9 && (
                    <span className="text-[8px] font-mono text-rose-500 uppercase tracking-widest animate-pulse">
                      Active
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-text-secondary truncate">{t.pomoWidgetDesc}</p>
              </div>
            </motion.div>

            {/* Widget 4: AI Career Coach Chat */}
            <motion.div 
              style={{
                scale: lirp(interactiveProgress, 0.87, 1),
                opacity: lirp(interactiveProgress, 0.35, 1),
                borderColor: interactiveProgress > 0.9 ? 'rgba(129, 140, 248, 0.4)' : 'rgba(255,255,255,0.05)',
                boxShadow: interactiveProgress > 1.0 ? '0 10px 25px -5px rgba(129, 140, 248, 0.15)' : 'none'
              }}
              className="p-3 rounded-2xl border bg-bg-secondary/40 backdrop-blur-md flex items-center gap-3 transition-colors duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                <Brain className="text-indigo-400" size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                  <span>{t.coachWidgetTitle}</span>
                  {interactiveProgress > 0.95 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </h4>
                <p className="text-[10px] text-text-secondary truncate">{t.coachWidgetDesc}</p>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
};
