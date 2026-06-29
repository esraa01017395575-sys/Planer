import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Brain, Sparkles, Target, 
  Calendar, ArrowRight, Zap, ListTodo, Shield, Star, Globe, Compass, Play, FileText, BarChart,
  Volume2, Heart, Award, Flame, Hourglass, HelpCircle, Check, RotateCcw, MessageSquare, Bell, ArrowLeft
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { ScrollTransformation } from '../components/ScrollTransformation';

// High-fidelity sound effects using browser Web Audio API
const playLandingSound = (type: 'chime' | 'tick' | 'success') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setTargetAtTime(880, now, 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);

      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setTargetAtTime(1318.51, ctx.currentTime, 0.08);
          gain2.gain.setValueAtTime(0.06, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.4);
        } catch (e) {}
      }, 70);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
          } catch(e){}
        }, idx * 100);
      });
    }
  } catch(e) {
    console.warn("Web Audio not supported yet or gesture blocked:", e);
  }
};

const translations = {
  en: {
    badge: "The ultimate AI-powered system",
    title1: "Organize your life.",
    title2: "Empower your future.",
    subtitle: "More than just a to-do list. Life OS is your personal AI-powered workspace to manage tasks, track habits, build plans, and unlock your highest potential with premium sounds and interactive mentoring.",
    getStarted: "Start Your Journey",
    viewDemo: "Sign In",
    exploreSandbox: "Play With Life OS Simulator Below! 👇",
    exploreSandboxAr: "جرب محاكي النظام التفاعلي بالأسفل! 👇",
    featuresTitle: "Everything you need to thrive",
    featuresSubtitle: "A seamlessly integrated ecosystem of tools designed for deep work.",
    aiCoachTitle: "AI Career & Performance Coach",
    aiCoachDesc: "Chat with a specialized AI assistant that acts as a performance coach. Generates actionable step-by-step strategies, breaks down massive goals, and gives daily feedback in conversational Egyptian Arabic or English.",
    tasksTitle: "Smart Task Boards",
    tasksDesc: "Kanban boards with subtask automation, rescheduling workflow, and timezone-aligned alerts.",
    habitsTitle: "Habits Tracker",
    habitsDesc: "Build unbreakable habits with fire streaks, custom emoji indicators, and localized alarms.",
    pomoTitle: "Pomodoro & Deep Focus",
    pomoDesc: "Enter absolute flow state with integrated Pomodoro timers, ticking clock cues, and a distraction-free widget.",
    plansTitle: "Strategic Roadmapping",
    plansDesc: "Formulate custom monthly blueprints designed by your AI mentor aligning with your active goals.",
    howItWorks: "How It Works",
    howItWorksDesc: "Three quick steps to full life mastery.",
    step1Title: "1. Create Your Profile",
    step1Desc: "Setup your life onboarding parameters and preferred mentoring styles.",
    step2Title: "2. Define Goals & Habits",
    step2Desc: "Set up multi-timeframe targets and configure daily repetition habits.",
    step3Title: "3. Perform with AI Coaching",
    step3Desc: "Track daily checklists, get tactical AI guidance, and build continuous streaks.",
    ctaTitle: "Ready to transform your lifestyle?",
    ctaDesc: "Join high-performers who have taken absolute control of their time and accelerated their growth.",
    ctaBtn: "Create Free Account",
    footerText: "Life OS. All rights reserved.",
    backToDashboard: "Go to Dashboard"
  },
  ar: {
    badge: "نظام الإنتاجية المتكامل بالذكاء الاصطناعي",
    title1: "نظّم حياتك اليومية.",
    title2: "ابنِ مستقبلك المثالي.",
    subtitle: "أكثر من مجرد قائمة مهام عادية. نظام إدارة الحياة المتكامل (Life OS) هو مساحتك الشخصية الذكية لإدارة المهام، تتبع عاداتك، وضع الخطط الاستراتيجية، وإطلاق كامل قواك الإبداعية مع أصوات تفاعلية كلاسيكية.",
    getStarted: "ابدأ رحلتك الآن",
    viewDemo: "تسجيل الدخول",
    exploreSandbox: "جرب محاكي النظام التفاعلي بالأسفل! 👇",
    exploreSandboxAr: "جرب محاكي النظام التفاعلي بالأسفل! 👇",
    featuresTitle: "كل ما تحتاجه للتميز والنمو",
    featuresSubtitle: "منظومة متكاملة من الأدوات الإبداعية المصممة خصيصاً للعمل العميق وجلسات التركيز الفائقة.",
    aiCoachTitle: "الكوتش وموجه التطوير المهني بالذكاء الاصطناعي",
    aiCoachDesc: "تحدث مع المساعد الشخصي الذي يعمل ككوتش لتطوير أدائك اليومي والمهني، وتوليد خطط استراتيجية مخصصة، وتفتيت الأهداف الكبيرة، وتوفير التوجيه باللهجة المصرية العامية أو إنجليزية.",
    tasksTitle: "لوحة المهام الذكية",
    tasksDesc: "لوحات كانبان متطورة، وجدولة ذكية للمهام وجدولة معلقة، مع تنبيهات وتذكيرات دقيقة متوافقة مع توقيتك المحلي.",
    habitsTitle: "متتبع العادات اليومية",
    habitsDesc: "بنِ عادات يومية حاسمة مع سلاسل الالتزام (Streaks)، وتذكيرات إشعارات مخصصة، وإحصائيات بصرية لتقدم تقدمك.",
    pomoTitle: "بومودورو والتركيز العميق",
    pomoDesc: "ادخل في حالة التركيز القصوى مع مؤقت البومودورو المدمج، مدعوماً بأصوات النبض وساعة الحائط التنبيهية الهادفة.",
    plansTitle: "الخطط الاستراتيجية الشهرية",
    plansDesc: "صمم خطط عمل تفصيلية لشهرك بالتنسيق مع أهدافك النشطة وبدعم مباشر ومؤثر من كوتش الذكاء الاصطناعي.",
    howItWorks: "كيف تعمل المنظومة؟",
    howItWorksDesc: "ثلاث خطوات بسيطة نحو السيطرة الكاملة على يومك وجدول أعمالك.",
    step1Title: "١. أنشئ ملفك التعريفي",
    step1Desc: "أجب عن بعض أسئلة حول اهتماماتك وطريقة التوجيه والمتابعة المفضلة لديك.",
    step2Title: "٢. حدد أهدافك وعاداتك",
    step2Desc: "ضع أهدافك قصيرة وطويلة الأمد، واقرنها بـالعادات اليومية التي تبني نجاحك.",
    step3Title: "٣. ابدأ الإنتاج مع كوتش الذكاء الاصطناعي",
    step3Desc: "تابع عاداتك اليومية، وتلقّى اقتراحات ذكية يومية، وابنِ سلاسل متكاملة بلا انقطاع.",
    ctaTitle: "هل أنت مستعد لتغيير أسلوب حياتك تماماً؟",
    ctaDesc: "انضم الآن إلى النخبة والمتميزين الذين استعادوا السيطرة الكاملة على أوقاتهم وضاعفوا كفاءتهم اليومية.",
    ctaBtn: "أنشئ حسابك المجاني",
    footerText: "جميع الحقوق محفوظة لنظام إدارة الحياة الذكي.",
    backToDashboard: "الذهاب للوحة التحكم"
  }
};

export const LandingPage = () => {
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useAppContext();
  const [hasSession, setHasSession] = useState(false);

  // Playground Sandbox State
  const [activeTab, setActiveTab] = useState<'tasks' | 'habits' | 'pomo' | 'ai'>('tasks');
  const [xpPoints, setXpPoints] = useState(120);
  const [floatingXps, setFloatingXps] = useState<{id: number, text: string, x: number, y: number}[]>([]);
  
  // Custom interactive simulator data
  const [playTasks, setPlayTasks] = useState([
    { id: 1, text: 'Analyze Q3 Tech Strategy with Coach 🧠', completed: false },
    { id: 2, text: 'Record English-Arabic pitch guidelines 🎙️', completed: false },
    { id: 3, text: 'Deploy custom sound effects 🔔', completed: false },
  ]);

  const [playHabits, setPlayHabits] = useState([
    { id: 1, title: 'Deep Work Session 💻', streak: 5, completed: false },
    { id: 2, title: 'Gym Workout & Breathing 🧘', streak: 12, completed: false },
  ]);

  // Pomodoro Simulator State
  const [pomoSecs, setPomoSecs] = useState(15);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoFinished, setPomoFinished] = useState(false);

  // AI Conversational Coach simulator
  const [aiCoachVibe, setAiCoachVibe] = useState<'strategic' | 'egyptian'>('egyptian');
  const [chatMessages, setChatMessages] = useState<{sender: 'user' | 'coach', text: string}[]>([
    { sender: 'coach', text: 'أهلاً بيك يا بطل! جاهز نكتسح المهام النهاردة ونبني عادات جبارة؟ قولي حاسس بإيه؟ 🚀' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Personality Quiz State
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  const isAr = language === 'ar';
  const t = translations[isAr ? 'ar' : 'en'];

  const handleGetStarted = () => {
    setLocation(hasSession ? '/dashboard' : '/auth');
  };

  const toggleLanguage = () => {
    setLanguage(isAr ? 'en' : 'ar');
  };

  // Helper to trigger floating XP gain visual bubbles
  const triggerXpGain = (amount: number, label: string = '+XP') => {
    setXpPoints(p => p + amount);
    const id = Date.now();
    const x = Math.floor(Math.random() * 80) + 10;
    const y = Math.floor(Math.random() * 40) + 10;
    setFloatingXps(prev => [...prev, { id, text: `${label} +${amount}`, x, y }]);
    setTimeout(() => {
      setFloatingXps(prev => prev.filter(item => item.id !== id));
    }, 1200);
  };

  // 1. Task Simulation Handler
  const togglePlayTask = (id: number) => {
    setPlayTasks(prev => prev.map(task => {
      if (task.id === id) {
        const nextState = !task.completed;
        if (nextState) {
          playLandingSound('chime');
          triggerXpGain(15, 'DONE');
        }
        return { ...task, completed: nextState };
      }
      return task;
    }));
  };

  // 2. Habit Simulation Handler
  const togglePlayHabit = (id: number) => {
    setPlayHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const nextState = !habit.completed;
        if (nextState) {
          playLandingSound('success');
          triggerXpGain(25, 'STREAK 🔥');
          return { ...habit, completed: true, streak: habit.streak + 1 };
        } else {
          return { ...habit, completed: false, streak: habit.streak - 1 };
        }
      }
      return habit;
    }));
  };

  // 3. Pomodoro simulation interval
  useEffect(() => {
    let interval: any;
    if (isPomoRunning && pomoSecs > 0) {
      interval = setInterval(() => {
        setPomoSecs(s => {
          if (s <= 1) {
            setIsPomoRunning(false);
            setPomoFinished(true);
            playLandingSound('success');
            triggerXpGain(50, 'FOCUS COMPLETED 🎯');
            return 15;
          }
          playLandingSound('tick');
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPomoRunning, pomoSecs]);

  // 4. AI Coach simulated replies
  const handleAiSampleClick = (promptIndex: number) => {
    if (isAiTyping) return;
    
    let userText = '';
    let coachReply = '';

    if (promptIndex === 1) {
      userText = isAr ? 'عندي تسويف رهيب ومش قادر أبدأ مذاكرة 🥱' : 'I am procrastinating and cannot start studying...';
      coachReply = aiCoachVibe === 'egyptian' 
        ? 'بص بقا يا بطل، سيبك من الدلع والندم اللي فات ده! دلوقتي حالا هتشغل بومودورو للتركيز لمدة ١٠ دقايق بس جرب تضغط وتبدأ، وصدقني هتدخل الزون فوراً! أنا معاك وهراقب تقدمك! ⏳🔥'
        : 'Understandable. Let us break your goals down. Initiate a 10-minute micro-timer now to build dynamic momentum. High-achievers master the first 5 minutes.';
    } else if (promptIndex === 2) {
      userText = isAr ? 'أنا حاسس بضغط كبير وأفكاري عشوائية 🤯' : 'I feel deeply stressed and chaotic right now.';
      coachReply = aiCoachVibe === 'egyptian'
        ? 'على الهادي يا كوتش! نفسك طويل كدة واهدى. رتبتلك أهم تلات حاجات لازم تخلصهم وتغلق الباقي. افتح صفحة التخطيط الشهري هتلاقي خارطة طريق جهزتهالك مخصوص، يلا بينا؟ 💪🌟'
        : 'Priority dilution is normal. I have created a structured monthly action blueprint under your roadmap. Start by writing down exactly one focus task.';
    } else {
      userText = isAr ? 'عايز خطة سريعة للتطوير المهني 📈' : 'Give me a fast career blueprint!';
      coachReply = aiCoachVibe === 'egyptian' 
        ? 'يا هلا بالمهندس! جهّزتلك مسار مخصص لمهارات الذكاء الاصطناعي والتواصل. هنبني عادات يومية حاسمة للكودينج والقراءة، ونعمل مراجعات دورية كل أسبوع بالنقاط! قولي موافق نبدأ؟ 🎯🚀'
        : 'Excellent. Focus on full-stack React refinement, leverage the daily Deep Work habit, and we will formulate your next milestone by Sunday.';
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsAiTyping(true);

    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'coach', text: coachReply }]);
      setIsAiTyping(false);
      playLandingSound('chime');
      triggerXpGain(20, 'COACH BONUS 🧠');
    }, 1500);
  };

  // 5. Personality Quiz Handlers
  const handleQuizAnswer = (option: string) => {
    const nextAnswers = [...quizAnswers, option];
    setQuizAnswers(nextAnswers);
    playLandingSound('tick');
    if (quizStep < 3) {
      setQuizStep(prev => prev + 1);
    } else {
      setQuizFinished(true);
      playLandingSound('success');
    }
  };

  const resetQuiz = () => {
    setQuizStep(1);
    setQuizAnswers([]);
    setQuizFinished(false);
  };

  const getQuizResult = () => {
    const q1 = quizAnswers[0] || 'A';
    const q2 = quizAnswers[1] || 'A';
    
    if (q1 === 'A' && q2 === 'A') {
      return {
        title: isAr ? "الحالم العشوائي الكسول 🌌" : "The Chaotic Dreamer 🌌",
        desc: isAr 
          ? "أنت ذكي ولديك طموح مذهل، لكن الكسل والتصفح اللانهائي يسرقان وقتك الثمين! تحتاج بشدة للكوتش المصري ليوقظك بأسلوبه الصارم المحفز." 
          : "You possess high ambitions and massive potential, but lazy scrolling and dynamic delays steal your focus. You need the intense Egyptian coach style to keep you fully accountable!",
        advice: isAr ? "توصيتنا: ابدأ فورا بإنشاء عادة 'Deep Work' وفعّل أصوات التنبيهات!" : "Recommendation: Set up a dedicated 'Deep Work' daily checklist and enable audio reminders.",
        xpBoost: 150
      };
    } else if (q1 === 'B' || q2 === 'B') {
      return {
        title: isAr ? "المُثالي المُجهد دائماً 📈" : "The Burned-out Perfectionist 📈",
        desc: isAr 
          ? "أنت مبدع ومنظم لكنك ترهق نفسك بالمهام الكثيرة ثم تُصاب بالإحباط. مؤقت بومودورو مع أصوات الحائط الهادئة سيساعدك على الإنجاز بسلاسة وسلام."
          : "You manage tasks perfectly but drown in heavy workloads, resulting in exhaustion. The Life OS Pomodoro widget with ticking cues is your perfect remedy.",
        advice: isAr ? "توصيتنا: قسّم مهامك الكبيرة لأولويات أصغر واستخدم مؤقت الـ 10 دقائق." : "Recommendation: Fragment your massive plans and run atomic 10-minute focus loops.",
        xpBoost: 200
      };
    } else {
      return {
        title: isAr ? "بطل اللحظات الأخيرة المشتعل 🔥" : "The Fire Survival Specialist 🔥",
        desc: isAr 
          ? "تنجز أفضل أعمالك تحت ضغط اللحظات الأخيرة وفي حالة رعب اقتراب المواعيد! ستحب بالتأكيد التذكيرات الزمنية المتناسقة مع توقيتك المحلي وتنبيهات الكوتش."
          : "You survive on chaotic close calls and eleventh-hour stress peaks. Life OS timezone-aligned alerts and the tactical rescheduled workspace are your lifelines.",
        advice: isAr ? "توصيتنا: اعتمد على الجدولة التلقائية لغداً مع إلغاء المهام الزائدة." : "Recommendation: Automate to-do rescheduling options smoothly and clear backlog clutter.",
        xpBoost: 180
      };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { delayChildren: 0.1, staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 220, damping: 20 } 
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden relative font-sans selection:bg-accent/30" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Decorative Interactive Background Particle/Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Dynamic Aesthetic Blur Orbs */}
      <div className={`absolute top-[-5%] ${isAr ? 'right-[-5%]' : 'left-[-5%]'} w-[45%] h-[40%] bg-accent/20 blur-[130px] rounded-full pointer-events-none animate-pulse`} />
      <div className={`absolute top-[60%] ${isAr ? 'left-[-10%]' : 'right-[-10%]'} w-[40%] h-[35%] bg-indigo-500/12 blur-[140px] rounded-full pointer-events-none`} />

      {/* Modern Fixed Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="glass-card px-4 md:px-6 py-3 flex items-center justify-between border border-border/40 rounded-full shadow-lg backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center text-white font-black shadow-md shadow-accent/25">
                L
              </div>
              <span className="font-display font-extrabold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-primary/70">
                Life OS
              </span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              {/* Language Switcher */}
              <button 
                onClick={toggleLanguage}
                className="px-3 py-1.5 hover:bg-bg-secondary/80 rounded-full text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold border border-border/15"
              >
                <Globe size={14} className="text-accent animate-spin-slow" />
                <span>{isAr ? "English" : "عربي"}</span>
              </button>

              {hasSession ? (
                <Link href="/dashboard">
                  <span className="text-xs font-bold text-accent hover:text-accent-glow hover:underline transition-colors cursor-pointer px-1">
                    {t.backToDashboard}
                  </span>
                </Link>
              ) : (
                <Link href="/auth">
                  <span className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer px-1">
                    {t.viewDemo}
                  </span>
                </Link>
              )}

              <button 
                onClick={handleGetStarted}
                className="bg-accent text-white px-4 md:px-5 py-2 rounded-full text-xs font-bold hover:bg-accent-glow hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer shadow-md shadow-accent/15 flex items-center gap-1.5"
              >
                <span>{hasSession ? t.backToDashboard : t.getStarted}</span>
                <ArrowRight size={13} className={isAr ? "rotate-180" : ""} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 md:pt-32 pb-24 px-4 max-w-6xl mx-auto relative z-10">
        
        {/* Animated Hero section with live interactive sound showcase */}
        <motion.section 
          className="text-center max-w-4xl mx-auto mt-8 md:mt-16 mb-20 md:mb-28 space-y-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants} 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent font-black text-xs tracking-wide shadow-inner cursor-pointer hover:bg-accent/15 transition-colors"
            onClick={() => playLandingSound('chime')}
          >
            <Sparkles size={13} className="animate-pulse text-accent" />
            <span>{isAr ? "اضغط هنا لسماع الرنين التفاعلي! 🔔" : "Click here to hear responsive audio! 🔔"}</span>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants} 
            className="text-4xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.12]"
          >
            {t.title1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-indigo-400 to-indigo-500">
              {t.title2}
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants} 
            className="text-sm md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            {t.subtitle}
          </motion.p>
          
          <motion.div 
            variants={itemVariants} 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          >
            <button 
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-accent hover:bg-accent-glow text-white font-bold text-sm shadow-lg shadow-accent/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{hasSession ? t.backToDashboard : t.getStarted}</span>
              <ArrowRight size={16} className={isAr ? "rotate-180" : ""} />
            </button>
            <a 
              href="#sandbox"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl glass-card border border-border/40 hover:border-accent/40 text-text-primary text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap size={15} className="text-accent text-amber-400 animate-pulse" />
              <span>{isAr ? "جرب لوحة التحكم التفاعلية" : "Try Interactive Board"}</span>
            </a>
          </motion.div>

          {/* Quick Sound Showcase center */}
          <motion.div 
            variants={itemVariants}
            className="pt-6 flex flex-wrap justify-center gap-2 max-w-md mx-auto"
          >
            <p className="w-full text-[10px] uppercase tracking-widest font-bold text-text-secondary/70 mb-1">
              {isAr ? "استمع للمؤثرات الصوتية الفخمة المتكاملة للإنتاجية والـ Pomodoro" : "Test our retro dynamic acoustic notifications"}
            </p>
            <button 
              onClick={() => playLandingSound('chime')}
              className="px-3.5 py-1.5 rounded-xl bg-bg-secondary text-xs text-text-primary border border-border/30 hover:border-accent/40 hover:bg-bg-card transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 size={13} className="text-accent" />
              <span>{isAr ? "🔔 رنين الإنجاز (Chime)" : "🔔 Achievement (Chime)"}</span>
            </button>
            <button 
              onClick={() => playLandingSound('tick')}
              className="px-3.5 py-1.5 rounded-xl bg-bg-secondary text-xs text-text-primary border border-border/30 hover:border-accent/40 hover:bg-bg-card transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 size={13} className="text-orange-400" />
              <span>{isAr ? "⏰ تكتكة التركيز (Ticks)" : "⏰ Focus Ticks"}</span>
            </button>
            <button 
              onClick={() => playLandingSound('success')}
              className="px-3.5 py-1.5 rounded-xl bg-bg-secondary text-xs text-text-primary border border-border/30 hover:border-accent/40 hover:bg-bg-card transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 size={13} className="text-emerald-400" />
              <span>{isAr ? "🏆 مستوى أعلى (Level Up)" : "🏆 Level Up"}</span>
            </button>
          </motion.div>
        </motion.section>

        {/* COMPREHENSIVE INTERACTIVE SCROLL TRANSFORMATION: CHAOS TO FOCUS AND ORDER */}
        <ScrollTransformation language={language} playLandingSound={playLandingSound} />

        {/* SECTION 1: EXCITING INTERACTIVE SYSTEM SANDBOX / SIMULATOR */}
        <section id="sandbox" className="mb-24 md:mb-32 relative scroll-mt-24">
          <div className="absolute inset-0 bg-accent/5 rounded-[2.5rem] blur-3xl pointer-events-none" />
          
          <div className="text-center mb-10 space-y-2 relative z-10">
            <span className="text-[10px] font-black uppercase text-accent tracking-widest bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
              {isAr ? "محاكي لوحة التحكم التفاعلي" : "LIVE SYSTEM PLAYGROUND"}
            </span>
            <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight">
              {isAr ? "جرّب نظام Life OS كالعضو الحقيقي" : "Play with Life OS Live Dashboard"}
            </h2>
            <p className="text-xs md:text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
              {isAr ? "قم بالنقر على الأزرار بالأسفل، تفقد الإشعارات الصوتية، واكتشف مدى روعة وانسجام الأدوات الذكية والمتابعة!" : "Interact with the demo widget below to complete tasks, earn XP, run micro-intervals, and chat with your Coach!"}
            </p>
          </div>

          <div className="glass-card rounded-[2rem] border border-border/60 bg-bg-card/75 shadow-2xl relative overflow-hidden z-10">
            
            {/* Simulator Header / Status Bar */}
            <div className="border-b border-border/30 p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 bg-bg-secondary/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <span className="text-xs font-black tracking-wider uppercase text-text-secondary">{isAr ? "الوضع التجريبي الحسابي" : "LIFE OS DEMO WORKSPACE"}</span>
                  <div className="text-[11px] font-mono text-text-secondary/70 flex items-center gap-1.5">
                    <span>{isAr ? "متطابق مع توقيتك المحلي" : "Timezone aligned to browser"}</span>
                    <span>•</span>
                    <span className="text-accent inline-block font-bold">100% Client Sync</span>
                  </div>
                </div>
              </div>

              {/* Live XP Counter Tracker Bar */}
              <div className="flex items-center gap-3 bg-bg-primary/95 border border-border/30 rounded-xl px-4 py-2 relative overflow-hidden min-w-[150px]">
                <Award className="text-accent w-4 h-4 animate-bounce" />
                <div className="flex-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-text-secondary">
                    <span>XP Points</span>
                    <span className="text-accent">{xpPoints} XP</span>
                  </div>
                  <div className="w-full bg-bg-secondary h-1.5 rounded-full overflow-hidden mt-1">
                    <motion.div 
                      className="bg-accent h-full" 
                      initial={{ width: '40%' }}
                      animate={{ width: `${Math.min(100, (xpPoints / 300) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Floating XP Animates */}
                <AnimatePresence>
                  {floatingXps.map(item => (
                    <motion.span 
                      key={item.id}
                      initial={{ opacity: 0, y: 15, scale: 0.8 }}
                      animate={{ opacity: 1, y: -25, scale: 1.1 }}
                      exit={{ opacity: 0, y: -45 }}
                      className="absolute left-4 top-2 text-[10px] font-black text-amber-400 bg-black/80 px-1.5 py-0.5 rounded border border-amber-400/30"
                    >
                      {item.text}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Main Tabs Selection */}
            <div className="flex border-b border-border/30 bg-bg-secondary/10 overflow-x-auto">
              <button 
                onClick={() => { setActiveTab('tasks'); playLandingSound('tick'); }}
                className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'tasks' ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-text-secondary'}`}
              >
                <ListTodo size={14} />
                <span>{isAr ? "قائمة المهام الذكية" : "List Dashboard"}</span>
              </button>
              <button 
                onClick={() => { setActiveTab('habits'); playLandingSound('tick'); }}
                className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'habits' ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-text-secondary'}`}
              >
                <Target size={14} />
                <span>{isAr ? "متتبع العادات" : "Habits Streak"}</span>
              </button>
              <button 
                onClick={() => { setActiveTab('pomo'); playLandingSound('tick'); }}
                className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'pomo' ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-text-secondary'}`}
              >
                <Hourglass size={14} className="animate-spin-slow" />
                <span>{isAr ? "بومودورو والتركيز" : "Turbo Focus Timer"}</span>
              </button>
              <button 
                onClick={() => { setActiveTab('ai'); playLandingSound('tick'); }}
                className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'ai' ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-text-secondary'}`}
              >
                <Brain size={14} />
                <span>{isAr ? "دردشة الكوتش" : "AI Peer Chat"}</span>
              </button>
            </div>

            {/* Inner Interactive Components Workspace */}
            <div className="p-5 md:p-8 min-h-[300px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                
                {/* Tab 1: Smart Tasks Simulation */}
                {activeTab === 'tasks' && (
                  <motion.div 
                    key="tasks-play"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4 max-w-xl mx-auto w-full"
                  >
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <p className="text-xs uppercase font-bold text-text-secondary">{isAr ? "لوحة اليوم - انقر على الدائرة لإنهاء المهمة" : "Today Checklist - Click tasks to complete"}</p>
                      <span className="text-[10px] font-mono text-accent">+15 XP Each</span>
                    </div>

                    <div className="space-y-2.5">
                      {playTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => togglePlayTask(task.id)}
                          className={`group p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${task.completed ? 'bg-accent/5 border-accent/40 opacity-70 scale-98' : 'bg-bg-secondary/40 border-border/20 hover:border-accent/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-accent border-accent text-white' : 'border-border group-hover:border-accent'}`}>
                              {task.completed && <Check size={12} className="stroke-[3]" />}
                            </div>
                            <span className={`text-xs md:text-sm font-bold ${task.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{task.text}</span>
                          </div>
                          {!task.completed && (
                            <span className="text-[11px] font-mono text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to claim 💎
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-bg-secondary/20 p-2.5 rounded-xl border border-dashed border-border text-center text-[11px] text-text-secondary flex items-center justify-center gap-1.5">
                      <Sparkles size={13} className="text-accent animate-pulse" />
                      <span>{isAr ? "عند تسجيل الدخول الفعلي ستنتقل هذه الإنجازات إلى ملفك!" : "Ready to organize your real workload and synchronize progress?"}</span>
                    </div>
                  </motion.div>
                )}

                {/* Tab 2: Habit Streaks Fire Simulation */}
                {activeTab === 'habits' && (
                  <motion.div 
                    key="habits-play"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4 max-w-xl mx-auto w-full"
                  >
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <p className="text-xs uppercase font-bold text-text-secondary">{isAr ? "العادات النشطة - اضغط لتوليد شعلة الالتزام 🔥" : "Daily Habits - Tap streak fire button"}</p>
                      <span className="text-[10px] font-mono text-orange-400">+25 XP Each</span>
                    </div>

                    <div className="space-y-3">
                      {playHabits.map(habit => (
                        <div 
                          key={habit.id}
                          className="bg-bg-secondary/30 p-4 rounded-xl border border-border/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-orange-400/30 transition-all"
                        >
                          <div>
                            <h4 className="font-bold text-xs md:text-sm text-text-primary">{habit.title}</h4>
                            <p className="text-[11px] text-text-secondary mt-0.5">{isAr ? "عادة يومية مع تذكير مخصص" : "Recurring daily goal tracking with customized sound reminders"}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="bg-background/80 border border-border/30 rounded-lg px-2.5 py-1 flex items-center gap-1">
                              <span className="text-[11px] text-text-secondary">Streak:</span>
                              <span className="text-xs font-black text-orange-500 flex items-center gap-0.5">
                                <Flame size={12} className="animate-pulse fill-orange-500 text-orange-500" />
                                {habit.streak}
                              </span>
                            </div>

                            <button 
                              onClick={() => togglePlayHabit(habit.id)}
                              disabled={habit.completed}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${habit.completed ? 'bg-orange-600/15 text-orange-500 border border-orange-500/30 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer shadow-md'}`}
                            >
                              {habit.completed ? (isAr ? "تفجير 🔥" : "Fired 🔥") : (isAr ? "تسجيل وبناء" : "Fire streak")}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => {
                        setPlayHabits(playHabits.map(h => ({ ...h, completed: false })));
                        playLandingSound('tick');
                      }}
                      className="text-[10px] underline font-mono text-text-secondary block mx-auto hover:text-text-primary cursor-pointer"
                    >
                      Reset habit status list
                    </button>
                  </motion.div>
                )}

                {/* Tab 3: Turbo Pomodoro focused interval */}
                {activeTab === 'pomo' && (
                  <motion.div 
                    key="pomo-play"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="text-center max-w-sm mx-auto w-full space-y-5"
                  >
                    <div>
                      <p className="text-xs uppercase font-bold text-text-secondary">{isAr ? "مؤقت بومودورو المصغر التفاعلي" : "Micro Pomodoro Turbo Box"}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">{isAr ? "شغل المؤقت واسمع تكتكات الساعة المصنوعة خصيصاً!" : "Run 15s timer: hear synthetic clock ticks & alarms"}</p>
                    </div>

                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                      {/* Interactive dynamic visual circle */}
                      <svg className="w-full h-full transform -rotate-90 absolute">
                        <circle cx="64" cy="64" r="56" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="6" fill="transparent" />
                        <motion.circle 
                          cx="64" cy="64" r="56" 
                          stroke="#ff4a4a" strokeWidth="6" fill="transparent" 
                          strokeDasharray={351.8}
                          strokeDashoffset={351.8 - (351.8 * (pomoSecs / 15))}
                          transition={{ ease: 'linear', duration: isPomoRunning ? 1 : 0.3 }}
                        />
                      </svg>
                      
                      <div className="text-center relative z-10 space-y-1">
                        <span className="text-2xl font-mono font-black text-rose-500 tracking-tight">
                          00:{String(pomoSecs).padStart(2, '0')}
                        </span>
                        <div className="text-[9px] uppercase tracking-wider text-text-secondary/70">
                          {isPomoRunning ? (isAr ? "تركيز عميق" : "FOCUSING") : (isAr ? "تفقد" : "STOPPED")}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => {
                          setIsPomoRunning(!isPomoRunning);
                          playLandingSound('chime');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${isPomoRunning ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 hover:bg-rose-500/35' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
                      >
                        {isPomoRunning ? (isAr ? "إيقاف مؤقت" : "Pause Timer") : (isAr ? "ابدأ مؤخرة التركيز" : "Start Turbo focus")}
                      </button>

                      <button 
                        onClick={() => {
                          setIsPomoRunning(false);
                          setPomoSecs(15);
                          setPomoFinished(false);
                          playLandingSound('tick');
                        }}
                        className="p-2 border border-border rounded-xl hover:bg-bg-secondary cursor-pointer text-text-secondary"
                        title="Reset"
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {pomoFinished && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Star size={14} className="animate-spin text-amber-400" />
                          <span>{isAr ? "أحسنت! جلسة رائعة (+50 نقطة!) 🎯🏆" : "Amazing focus loop! Claimed +50 XP!"}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Tab 4: Interactive AI Coach simulator */}
                {activeTab === 'ai' && (
                  <motion.div 
                    key="ai-play"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4 max-w-xl mx-auto w-full"
                  >
                    {/* Chat selection vibe toggle */}
                    <div className="flex items-center justify-between border-b border-border/20 pb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={13} className="text-accent" />
                        <span className="text-xs uppercase font-extrabold text-text-secondary">
                          {isAr ? "تحويل كاريزما الكوتش" : "COACH PERSONALITY MODE:"}
                        </span>
                      </div>
                      
                      <div className="bg-bg-secondary p-1 rounded-lg flex gap-1">
                        <button 
                          onClick={() => { setAiCoachVibe('egyptian'); playLandingSound('tick'); }}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${aiCoachVibe === 'egyptian' ? 'bg-accent text-white shadow-xs' : 'text-text-secondary'}`}
                        >
                          {isAr ? "مصري بلدي 🇪🇬" : "Colloquial Egyptian 🇪🇬"}
                        </button>
                        <button 
                          onClick={() => { setAiCoachVibe('strategic'); playLandingSound('tick'); }}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${aiCoachVibe === 'strategic' ? 'bg-accent text-white shadow-xs' : 'text-text-secondary'}`}
                        >
                          {isAr ? "استراتيجي مهني 📈" : "Corporate Mentor 📈"}
                        </button>
                      </div>
                    </div>

                    {/* Chat Bubble Container Screen */}
                    <div className="bg-bg-primary/95 border border-border/30 rounded-2xl p-4 h-[160px] overflow-y-auto space-y-3 shadow-inner">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-3 max-w-[85%] rounded-2xl text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-accent text-white rounded-br-none' : 'bg-bg-secondary text-text-primary border border-border/20 rounded-bl-none'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}

                      {isAiTyping && (
                        <div className="flex justify-start">
                          <div className="bg-bg-secondary p-3 rounded-2xl rounded-bl-none border border-border/20 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sample user cues templates to tap */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] uppercase font-bold text-text-secondary/70">{isAr ? "إختر شيئاً لتقوله للكوتش الذكي:" : "Pick a message bubble to test coach response:"}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button 
                          onClick={() => handleAiSampleClick(1)}
                          disabled={isAiTyping}
                          className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-bg-secondary/40 border border-border/30 hover:border-accent hover:bg-bg-secondary transition-all cursor-pointer"
                        >
                          {isAr ? "🥱 كسلان ومش قادر أذاكر" : "🥱 Procrastinating heavily"}
                        </button>
                        <button 
                          onClick={() => handleAiSampleClick(2)}
                          disabled={isAiTyping}
                          className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-bg-secondary/40 border border-border/30 hover:border-accent hover:bg-bg-secondary transition-all cursor-pointer"
                        >
                          {isAr ? "🤯 أفكاري متلخبطة ومضغوط" : "🤯 Feeling deeply stressed"}
                        </button>
                        <button 
                          onClick={() => handleAiSampleClick(3)}
                          disabled={isAiTyping}
                          className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-bg-secondary/40 border border-border/30 hover:border-accent hover:bg-bg-secondary transition-all cursor-pointer"
                        >
                          {isAr ? "📈 عايز خطة سريعة للمستقبل" : "📈 Quick development plan"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* SECTION 2: PRODUCTIVITY PERSONALITY IN-DEPTH QUIZ */}
        <section className="mb-24 md:mb-32 relative">
          <div className="max-w-3xl mx-auto glass-card border border-border/40 p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/5 via-accent/3 to-transparent relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
              <Star size={180} className="text-accent" />
            </div>

            <div className="relative z-10">
              
              {!quizFinished ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-accent tracking-widest bg-accent/15 px-3 py-1 rounded-full border border-accent/25">
                      {isAr ? "اختبار شخصيتك الذكي" : "LIFE OS AUDIT QUIZ"}
                    </span>
                    <span className="text-xs font-mono text-text-secondary font-bold">Step {quizStep} of 3</span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="bg-bg-secondary h-2.5 rounded-full overflow-hidden w-full">
                    <motion.div 
                      className="bg-accent h-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(quizStep / 3) * 100}%` }}
                    />
                  </div>

                  {/* QUEST-1 */}
                  {quizStep === 1 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg md:text-xl font-bold text-text-primary">
                        {isAr ? "كيف تبدأ صباحك ويومك الجديد عادةً؟" : "How do you typically launch your morning?"}
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        <button 
                          onClick={() => handleQuizAnswer('A')}
                          className="p-4 text-left font-bold text-xs md:text-sm bg-bg-secondary/40 border border-border/20 rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>{isAr ? "📱 التصفح غير المحدود لسوشيال ميديا مع كوب قهوة وشعور فوري بالذنب!" : "📱 Scroll TikTok/Socials immediately accompanied by quick regret."}</span>
                          <ArrowRight size={14} className="text-text-secondary" />
                        </button>
                        <button 
                          onClick={() => handleQuizAnswer('B')}
                          className="p-4 text-left font-bold text-xs md:text-sm bg-bg-secondary/40 border border-border/20 rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>{isAr ? "🗓️ كتابة قائمة مهام فائقة الدقة بجرام الدقيقة والشعور بالتوتر من الآن!" : "🗓️ Construct highly structured checklist and feel pre-stressed."}</span>
                          <ArrowRight size={14} className="text-text-secondary" />
                        </button>
                        <button 
                          onClick={() => handleQuizAnswer('C')}
                          className="p-4 text-left font-bold text-xs md:text-sm bg-bg-secondary/40 border border-border/20 rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>{isAr ? "⏰ الاستيقاظ المذعور قبل العمل بربع ساعة مع شرب الشوكولاتة في الطريق!" : "⏰ Wake up in complete adrenaline survival panic 15m before shift."}</span>
                          <ArrowRight size={14} className="text-text-secondary" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* QUEST-2 */}
                  {quizStep === 2 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg md:text-xl font-bold text-text-primary">
                        {isAr ? "ما العائق الأكبر الذي تود تحطيمه وبناء عادات بديلة له؟" : "What is the primary roadblock you wish to dissolve?"}
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        <button 
                          onClick={() => handleQuizAnswer('A')}
                          className="p-4 text-left font-bold text-xs md:text-sm bg-bg-secondary/40 border border-border/20 rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>{isAr ? "🎮 التسويف والمماطلة (عندي شغف بس ببقي كسلان)" : "🎮 Procrastination is basically my full-time sport with lazy cycles."}</span>
                          <ArrowRight size={14} className="text-text-secondary" />
                        </button>
                        <button 
                          onClick={() => handleQuizAnswer('B')}
                          className="p-4 text-left font-bold text-xs md:text-sm bg-bg-secondary/40 border border-border/20 rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>{isAr ? "🤯 تشتت التركيز والبدء في ١٥ مشروع ثم الإجهاد والوقوف!" : "🤯 Fragmentation: starting 12 tasks at once, ending in absolute burnout."}</span>
                          <ArrowRight size={14} className="text-text-secondary" />
                        </button>
                        <button 
                          onClick={() => handleQuizAnswer('C')}
                          className="p-4 text-left font-bold text-xs md:text-sm bg-bg-secondary/40 border border-border/20 rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>{isAr ? "⏳ تشتيت وضياع الوقت وصعوبة تنظيم الأنشطة زمنيا" : "⏳ Diluted timeline awareness with difficulty planning weeks."}</span>
                          <ArrowRight size={14} className="text-text-secondary" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* QUEST-3 */}
                  {quizStep === 3 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg md:text-xl font-bold text-text-primary">
                        {isAr ? "ما أسلوب التدريب والمتابعة الذي يجعلك تنجز بالفعل؟" : "What style of mentoring triggers actual results in you?"}
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        <button 
                          onClick={() => handleQuizAnswer('A')}
                          className="p-4 text-left font-bold text-xs md:text-sm bg-bg-secondary/40 border border-border/20 rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>{isAr ? "🇪🇬 نبرة التدريب المصرية المقربة: 'قوم وبلاش دلع ملوش لازمة وعف العافية!'" : "🇪🇬 Close Egyptian Coach vibe: Direct, slightly severe, supportive brother style."}</span>
                          <ArrowRight size={14} className="text-text-secondary" />
                        </button>
                        <button 
                          onClick={() => handleQuizAnswer('B')}
                          className="p-4 text-left font-bold text-xs md:text-sm bg-bg-secondary/40 border border-border/20 rounded-xl hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>{isAr ? "💼 الأرقام الدقيقة والمسارات والنسب المئوية والذكاء الاصطناعي الاستراتيجي" : "💼 Meticulous key indicators, precise stats, strategic and direct pathing."}</span>
                          <ArrowRight size={14} className="text-text-secondary" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                </div>
              ) : (
                // SHOW DYNAMIC RESULTS
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-accent/20 mx-auto flex items-center justify-center text-4xl">
                    🏆
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-text-secondary">{isAr ? "التحليل الاستراتيجي النهائي لشخصيتك" : "AUDIT COMPLETED"}</span>
                    <h3 className="text-2xl md:text-3xl font-display font-black text-text-primary mt-1">
                      {getQuizResult().title}
                    </h3>
                  </div>

                  <div className="bg-bg-secondary/50 border border-border/30 rounded-2xl p-5 text-xs md:text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
                    <p className="font-bold text-text-primary">{getQuizResult().desc}</p>
                    <p className="mt-3 text-accent font-black border-t border-border/20 pt-3">{getQuizResult().advice}</p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-black border border-amber-500/20">
                    <Star size={13} fill="currentColor" />
                    <span>Onboarding Bonus: {getQuizResult().xpBoost} XP Unlocked</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-3">
                    <button 
                      onClick={handleGetStarted}
                      className="px-6 py-3 bg-accent hover:bg-accent-glow text-white font-bold text-xs md:text-sm rounded-xl cursor-pointer shadow-md"
                    >
                      {isAr ? "ابدأ رحلتك وادّعي نقاطك الآن" : "Claim Points & Start Free"}
                    </button>
                    <button 
                      onClick={resetQuiz}
                      className="px-4 py-3 bg-bg-secondary text-text-secondary font-bold text-xs rounded-xl cursor-pointer"
                    >
                      {isAr ? "إعادة الاختبار 🔄" : "Re-take Audit 🔄"}
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </section>

        {/* Feature Grid with Modern Sleek Visual Layout */}
        <section className="mb-24 md:mb-32">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-text-primary tracking-tight">
              {t.featuresTitle}
            </h2>
            <p className="text-xs md:text-sm text-text-secondary max-w-lg mx-auto">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 - Large AI Coach Feature block */}
            <div className="md:col-span-2 glass-card p-6 md:p-8 rounded-[2rem] border border-border/40 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
              <div className={`absolute top-0 ${isAr ? 'left-0' : 'right-0'} w-48 h-48 bg-accent/8 blur-3xl rounded-full pointer-events-none`} />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center mb-5 shadow-inner">
                    <Brain className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2">
                    <span>{t.aiCoachTitle}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-extrabold uppercase">Premium</span>
                  </h3>
                  <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-xl">
                    {t.aiCoachDesc}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-lg bg-bg-secondary font-mono text-text-secondary border border-border/20">Custom Strategies</span>
                  <span className="text-[10px] px-2.5 py-1 rounded-lg bg-bg-secondary font-mono text-text-secondary border border-border/20">Egyptian Colloquial Mentor</span>
                  <span className="text-[10px] px-2.5 py-1 rounded-lg bg-bg-secondary font-mono text-text-secondary border border-border/20">JSON Mode</span>
                </div>
              </div>
            </div>

            {/* Feature 2 - Smart Tasks */}
            <div className="glass-card p-6 rounded-[2rem] border border-border/40 relative overflow-hidden group hover:border-accent/35 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="w-11 h-11 rounded-lg bg-bg-secondary border border-border/20 flex items-center justify-center mb-5">
                    <ListTodo className="text-accent" size={21} />
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{t.tasksTitle}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {t.tasksDesc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between text-[11px] text-text-secondary">
                  <span>Kanban & Calendar View</span>
                  <Compass size={13} className="text-accent" />
                </div>
              </div>
            </div>

            {/* Feature 3 - Habits Tracker */}
            <div className="glass-card p-6 rounded-[2rem] border border-border/40 relative overflow-hidden group hover:border-accent/35 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="w-11 h-11 rounded-lg bg-bg-secondary border border-border/20 flex items-center justify-center mb-5">
                    <Target className="text-orange-400" size={21} />
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{t.habitsTitle}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {t.habitsDesc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between text-[11px] text-text-secondary">
                  <span>Streaks 🔥 Tracker</span>
                  <BarChart size={13} className="text-orange-400" />
                </div>
              </div>
            </div>

            {/* Feature 4 - Pomodoro */}
            <div className="md:col-span-2 glass-card p-6 md:p-8 rounded-[2rem] border border-border/40 relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-3xl rounded-full" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mb-5 shadow-inner">
                    <Zap className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">{t.pomoTitle}</h3>
                  <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-xl">
                    {t.pomoDesc}
                  </p>
                </div>
                <div className="mt-6 flex gap-3 text-xs font-mono text-text-secondary">
                  <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-rose-500" /> Retro Ticks</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-rose-500" /> Floating Widgets</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-rose-500" /> Responsive Alarm</span>
                </div>
              </div>
            </div>

            {/* Feature 5 - Strategic Roadmaps */}
            <div className="glass-card p-6 rounded-[2rem] border border-border/40 relative overflow-hidden group hover:border-accent/35 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-2xl rounded-full" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="w-11 h-11 rounded-lg bg-bg-secondary border border-border/20 flex items-center justify-center mb-5">
                    <Calendar className="text-accent" size={21} />
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{t.plansTitle}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {t.plansDesc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between text-[11px] text-text-secondary">
                  <span>Custom AI Milestones</span>
                  <Sparkles size={13} className="text-accent animate-pulse" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Step by Step Progression Map */}
        <section className="mb-24 md:mb-32 py-12 border-t border-b border-border/20">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-text-primary tracking-tight">
              {t.howItWorks}
            </h2>
            <p className="text-xs md:text-sm text-text-secondary">
              {t.howItWorksDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 bg-bg-secondary/30 border border-border/20 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-200">
              <Compass className="w-8 h-8 text-accent mb-2" />
              <h3 className="text-base font-bold text-text-primary">{t.step1Title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{t.step1Desc}</p>
            </div>
            
            <div className="space-y-3 bg-bg-secondary/30 border border-border/20 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-200">
              <Target className="w-8 h-8 text-accent mb-2" />
              <h3 className="text-base font-bold text-text-primary">{t.step2Title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{t.step2Desc}</p>
            </div>

            <div className="space-y-3 bg-bg-secondary/30 border border-border/20 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-200">
              <Sparkles className="w-8 h-8 text-accent mb-2" />
              <h3 className="text-base font-bold text-text-primary">{t.step3Title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{t.step3Desc}</p>
            </div>
          </div>
        </section>

        {/* Modern Conversion CTA Board */}
        <section className="text-center py-16 md:py-20 px-6 md:px-8 bg-gradient-to-br from-bg-secondary via-bg-card to-accent/[0.03] rounded-[3rem] relative overflow-hidden border border-border/40 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="text-xs md:text-base text-text-secondary leading-relaxed">
              {t.ctaDesc}
            </p>
            <div className="pt-4">
              <button 
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-accent hover:bg-accent-glow text-white font-bold text-base hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl cursor-pointer"
              >
                {hasSession ? t.backToDashboard : t.ctaBtn}
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Structured Footer */}
      <footer className="border-t border-border/35 py-12 bg-bg-secondary/20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              L
            </div>
            <span className="font-display font-bold text-base">Life OS</span>
          </div>
          
          <div className="flex items-center gap-6 text-xs font-medium">
            <Link href="/terms">
              <span className="text-text-secondary hover:text-accent transition-colors cursor-pointer border-b border-transparent hover:border-accent/30 pb-0.5">
                {isAr ? "شروط الخدمة" : "Terms of Service"}
              </span>
            </Link>
            <span className="text-border/40">•</span>
            <Link href="/privacy">
              <span className="text-text-secondary hover:text-accent transition-colors cursor-pointer border-b border-transparent hover:border-accent/30 pb-0.5">
                {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
              </span>
            </Link>
          </div>

          <p className="text-text-secondary text-xs font-mono">
            © {new Date().getFullYear()} {t.footerText}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
