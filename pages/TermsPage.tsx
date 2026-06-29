import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Shield, CheckCircle, Globe, Home } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const translations = {
  en: {
    back: "Back to Home",
    termsTitle: "Terms of Service",
    lastUpdated: "Last updated: June 2026",
    introTitle: "1. Acceptance of Terms",
    introDesc: "By accessing or using Life OS (\"Service\"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our service. We provide an AI-augmented workspace, task boards, habit trackers, and performance coaching solutions.",
    userAccountsTitle: "2. User Accounts & Security",
    userAccountsDesc: "You are responsible for maintaining the confidentiality of your credentials and all activities occurring under your account. You agree to notify us immediately of any unauthorized access.",
    aiCoachUsageTitle: "3. AI Coaching & Content Disclaimer",
    aiCoachDesc: "Our AI Performance Coach provides custom blueprints, motivational checks, and tactical strategies. These recommendations are for creative, informational, and educational purposes. They do not constitute official medical, psychological, legal, or financial professional advice.",
    premiumAudioTitle: "4. Premium Audio & Assets",
    premiumAudioDesc: "All synthetic clock ticks, chime alerts, and level-up audio sequences provided on Life OS are intellectual property or licensed. These sounds are meant exclusively for interactive usage and deep focus enhancement within the application.",
    terminationTitle: "5. Termination of Service",
    terminationDesc: "We reserve the right to suspend or block access to accounts that violate user security, cause unexpected system interference, or violate copyright declarations.",
    limitOfLiabilityTitle: "6. Limitation of Liability",
    limitOfLiabilityDesc: "To the maximum extent permitted by law, Life OS shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the interactive dashboard.",
    arabicPrompt: "اقرأ باللغة العربية",
    englishPrompt: "Read in English",
    summaryTitle: "Quick Summary",
    summary1: "You own your personal task data and habit streaks.",
    summary2: "The AI performance coach is an educational mentor, not a legally binding advisor.",
    summary3: "We protect your account credentials, and you should never share your secrets.",
    summary4: "Premium sounds are provided to level up your workflow gracefully."
  },
  ar: {
    back: "العودة للرئيسية",
    termsTitle: "شروط الخدمة والأحكام",
    lastUpdated: "آخر تحديث: يونيو ٢٠٢٦",
    introTitle: "١. الموافقة على الشروط",
    introDesc: "من خلال الوصول إلى أو استخدام نظام إدارة الحياة المتكامل (Life OS)، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق، يرجى التوقف عن استخدام الخدمة. نحن نوفر مساحة عمل معززة بالذكاء الاصطناعي، ولوحات مهام، ومتتبع العادات وكذا الاستشارات والأصوات التفاعلية الفخمة.",
    userAccountsTitle: "٢. حسابات المستخدمين والأمان",
    userAccountsDesc: "أنت مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات اعتمادك وكلمات مرورك وجميع الأنشطة التي تحدث تحت حسابك الشخصي. وتتعهد بإبلاغنا فوراً بأي اختراق أو دخول غير مصرح به.",
    aiCoachUsageTitle: "٣. كوتش الذكاء الاصطناعي وإخلاء المسؤولية",
    aiCoachDesc: "يوفر كوتش الأداء والتطوير المهني بالذكاء الاصطناعي خطط عمل مخصصة، واقتراحات باللهجة المصرية أو الإنجليزية. هذه التوجيهات هي لأغراض تنظيمية وتعليمية وتحفيزية فقط، ولا يمكن اعتبارها بديلاً عن مشورة طبية، نفسية، قانونية، أو مالية معتمدة.",
    premiumAudioTitle: "٤. الأصوات المدمجة والمؤثرات",
    premiumAudioDesc: "جميع التكتكات والمؤثرات الصوتية والرقمنة السمعية المتوفرة على المنصة هي ملكية فكرية للمنظومة لتعزيز التركيز. يقتصر استخدامها داخل واجهة الموقع لتعميق حالة التدفق (Flow State).",
    terminationTitle: "٥. إنهاء الخدمة والحسابات",
    terminationDesc: "نحتفظ بالحق في تعليق أو حظر الحسابات التي تسيء الاستخدام أو تخالف شروط السلامة الرقمية، أو تحاول التلاعب بخدمات تجميع البيانات أو الاستهلاك غير المعقول لموارد الذكاء الاصطناعي.",
    limitOfLiabilityTitle: "٦. حدود المسؤولية القانونية",
    limitOfLiabilityDesc: "بأقصى حد يسمح به القانون، لا يتحمل نظام (Life OS) أي مسؤولية عن أي أضرار غير مباشرة أو عرضية ناتجة عن استخدام أو عدم القدرة على استخدام لوحات التحكم والواجهات الرقمية.",
    arabicPrompt: "اقرأ باللغة العربية",
    englishPrompt: "Read in English",
    summaryTitle: "ملخص سريع للأحكام",
    summary1: "بياناتك وعاداتك ومهامك ملك لك بالكامل.",
    summary2: "موجه الذكاء الاصطناعي كوتش تحفيزي رائع، وليس مستشاراً قانونياً أو طبياً.",
    summary3: "نحن نؤمن سريتك ويجب عليك ألا تشارك كلمات المرور مع الآخرين.",
    summary4: "نوفر مؤثرات صوتية فخمة لترقية أسلوب عملك بسلاسة."
  }
};

export const TermsPage = () => {
  const { language, setLanguage } = useAppContext();
  const isAr = language === 'ar';
  const t = translations[isAr ? 'ar' : 'en'];

  const toggleLanguage = () => {
    setLanguage(isAr ? 'en' : 'ar');
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary relative font-sans selection:bg-accent/30 overflow-x-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Dynamic Aesthetic Blur Orbs */}
      <div className={`absolute top-[-5%] ${isAr ? 'right-[-5%]' : 'left-[-5%]'} w-[40%] h-[35%] bg-accent/15 blur-[120px] rounded-full pointer-events-none`} />
      <div className={`absolute bottom-[-5%] ${isAr ? 'left-[-5%]' : 'right-[-5%]'} w-[40%] h-[35%] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none`} />

      <header className="border-b border-border/30 bg-bg-card/45 backdrop-blur-md sticky top-0 z-50 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-xs md:text-sm text-text-secondary hover:text-text-primary transition-all cursor-pointer bg-bg-secondary/40 border border-border/20 px-3 py-1.5 rounded-full">
              <ArrowLeft size={14} className={isAr ? "rotate-180" : ""} />
              <span>{t.back}</span>
            </button>
          </Link>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="text-xs font-bold text-accent cursor-pointer border border-accent/20 px-3 py-1.5 rounded-full bg-accent/5 hover:bg-accent/10 transition-colors flex items-center gap-1.5"
            >
              <Globe size={13} />
              <span>{isAr ? t.englishPrompt : t.arabicPrompt}</span>
            </button>
            <Link href="/">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-md">
                L
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 md:py-16 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        
        {/* Left Side: Summary Panel (3 columns on lg) */}
        <div className="lg:col-span-4 order-last lg:order-first">
          <div className="glass-card p-6 rounded-3xl border border-border/50 bg-bg-secondary/30 sticky top-24 space-y-5">
            <div className="flex items-center gap-2.5 text-accent">
              <Shield size={20} className="animate-pulse" />
              <h3 className="font-display font-black text-sm uppercase tracking-wider">{t.summaryTitle}</h3>
            </div>
            
            <div className="space-y-4 text-xs md:text-sm text-text-secondary">
              <div className="flex items-start gap-2.5">
                <CheckCircle size={15} className="mt-0.5 text-accent flex-shrink-0" />
                <p>{t.summary1}</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle size={15} className="mt-0.5 text-accent flex-shrink-0" />
                <p>{t.summary2}</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle size={15} className="mt-0.5 text-accent flex-shrink-0" />
                <p>{t.summary3}</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle size={15} className="mt-0.5 text-accent flex-shrink-0" />
                <p>{t.summary4}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/10">
              <p className="text-[10px] text-text-secondary/70 font-mono text-center">
                Life OS Compliance Engine v1.1
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Legal Contents (8 columns on lg) */}
        <div className="lg:col-span-8 space-y-8 md:space-y-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-xs uppercase tracking-widest">
              <FileText size={13} />
              <span>{isAr ? "شروطنا" : "Our Terms"}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-text-primary to-text-primary/70">
              {t.termsTitle}
            </h1>
            <p className="text-xs font-mono text-text-secondary">
              {t.lastUpdated}
            </p>
          </div>

          <div className="space-y-8 text-sm md:text-base text-text-secondary leading-relaxed">
            
            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.introTitle}</span>
              </h2>
              <p>{t.introDesc}</p>
            </div>

            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.userAccountsTitle}</span>
              </h2>
              <p>{t.userAccountsDesc}</p>
            </div>

            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2 text-accent">
                <span>{t.aiCoachUsageTitle}</span>
              </h2>
              <p>{t.aiCoachDesc}</p>
            </div>

            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.premiumAudioTitle}</span>
              </h2>
              <p>{t.premiumAudioDesc}</p>
            </div>

            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.terminationTitle}</span>
              </h2>
              <p>{t.terminationDesc}</p>
            </div>

            <div className="space-y-2">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.limitOfLiabilityTitle}</span>
              </h2>
              <p>{t.limitOfLiabilityDesc}</p>
            </div>

          </div>

          <div className="pt-8 border-t border-border/20 text-center">
            <Link href="/">
              <button className="px-6 py-3 rounded-2xl bg-accent text-white font-bold text-xs hover:bg-accent-glow transition-all active:scale-95 cursor-pointer">
                {isAr ? "الموافقة والعودة للرئيسية" : "I understand, Back to Home"}
              </button>
            </Link>
          </div>
        </div>

      </main>

      <footer className="border-t border-border/30 py-8 bg-bg-secondary/10 mt-16 text-center text-xs text-text-secondary font-mono">
        © {new Date().getFullYear()} Life OS. All rights reserved.
      </footer>
    </div>
  );
};

export default TermsPage;
