import React from 'react';
import { Link } from 'wouter';
import { FileText, ArrowLeft, ShieldCheck, CheckCircle, Globe, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const translations = {
  en: {
    back: "Back to Home",
    privacyTitle: "Privacy Policy",
    lastUpdated: "Last updated: June 2026",
    dataCollectionTitle: "1. Information We Collect",
    dataCollectionDesc: "At Life OS, we honor your privacy. We collect basic account credentials (email, name, phone) through Supabase authentication, plus interactive user data such as current habits, active tasks, project guidelines, and customized sound settings.",
    useOfParametersTitle: "2. How We Use Your Parameters",
    useOfParametersDesc: "Your local task schedules, Pomodoro logs, and habit streaks are utilized to fuel your daily dashboard and update your global XP points. These are stored securely in Supabase with standard Row Level Security (RLS) layers.",
    aiDisclaimerTitle: "3. AI Processing & Privacy",
    aiDisclaimerDesc: "When interacting with the AI Performance Coach, your conversational messages are proxy-relayed securely to the Gemini model API. We do not expose your email address or sensitive account keys to general search pipelines. The context is only used on demand to structure performance feedback.",
    thirdPartyServicesTitle: "4. Third-Party Integrations",
    thirdPartyServicesDesc: "We implement Supabase for database schemas, user state management, and authentication. Payment configurations or advanced analytics follow industry-standard compliance. None of your logs are sold to commercial advertising networks.",
    cookiesCuesTitle: "5. Browser Storage & Cookies",
    cookiesCuesDesc: "We use browser local storage to quickly capture client preferences like muted sounds, active timer countdown records, and localized language preferences so your flow state is seamless across tabs.",
    securityCommitmentTitle: "6. Security Commitment",
    securityCommitmentDesc: "We apply industry-standard SSL encryption and modern database parameters to defend against unauthorized logins. It is your due diligence to protect your password strengths.",
    arabicPrompt: "اقرأ باللغة العربية",
    englishPrompt: "Read in English",
    summaryTitle: "Our Promise",
    summary1: "Zero ad-trackers. No listing or selling of user information.",
    summary2: "High-grade database encryption protects your habit milestones.",
    summary3: "AI coach processing is treated on-demand under strict guidelines.",
    summary4: "Easy export or account deletion procedures available from profile settings."
  },
  ar: {
    back: "العودة للرئيسية",
    privacyTitle: "سياسة الخصوصية الأمان",
    lastUpdated: "آخر تحديث: يونيو ٢٠٢٦",
    dataCollectionTitle: "١. المعلومات التي نجمعها",
    dataCollectionDesc: "في نظام (Life OS)، نولي أهمية قصوى لخصوصيتك. نجمع فقط بيانات الحساب الأساسية (الاسم، البريد الإلكتروني، ورقم الهاتف) عبر نظام توثيق Supabase الآمن، بالإضافة للبيانات التنظيمية الخاصة بك مثل قائمة المهام، العادات والمهام المنتهية ونقاط الالتزام.",
    useOfParametersTitle: "٢. كيف نستخدم معلوماتك وبياناتك",
    useOfParametersDesc: "تُستخدم مواعيد عاداتك وسجلات البومودورو والمهام اليومية فقط لملء لوحة التحكم الخاصة بك وتعديل ترتيب نقاط الالتزام (XP). تُخزن جميع هذه السجلات في قواعد بيانات Supabase مع تفعيل طبقات الفحص الأمني التلقائي (RLS).",
    aiDisclaimerTitle: "٣. آلية معالجة الذكاء الاصطناعي",
    aiDisclaimerDesc: "عند التحدث بخصوصية مع الكوتش وموجه التطوير المهني بالذكاء الاصطناعي، يتم إرسال نصوص المحادثة عبر بوابات تشفير مخصصة للذكاء الاصطناعي لتأمين الردود. لا نشارك بريدك الإلكتروني أو بياناتك الشخصية أو كلمات المرور مع أي من محركات البحث أو مخازن التدريب العامة.",
    thirdPartyServicesTitle: "٤. الخدمات السحابية والشركاء",
    thirdPartyServicesDesc: "تعتمد البنية التحتية للنظام على Supabase لإدارة قواعد البيانات والتحقق من الهوية. نحن لا نقوم ببيع أو مشاركة أو تأجير أي سجلات حيوية لوكالات تسويق أو أطراف تسويقية مضللة.",
    cookiesCuesTitle: "٥. ذاكرة التخزين المحلية وملفات تعريف الارتباط",
    cookiesCuesDesc: "نستخدم ذاكرة التخزين المحلية في المتصفح الخاص بك (LocalStorage) لتخزين تفضيلاتك السمعية (كتم الصوت)، والمهام المكتوبة مؤخراً، ولغة واجهة المستخدم المفضلة لديك لضمان تجربة فورية وسلسة.",
    securityCommitmentTitle: "٦. نلتزم بحماية حسابك ومستنداتك",
    securityCommitmentDesc: "نقوم بتطبيق خوارزميات أمان متقدمة وتقنيات SSL القياسية ضد الدخول الاحتيالي. نوصيك باختيار كلمة مرور قوية لتأمين مجهودك الاستثماري بالمنصة.",
    arabicPrompt: "اقرأ باللغة العربية",
    englishPrompt: "Read in English",
    summaryTitle: "عهدنا الصادق",
    summary1: "خالٍ تماماً من متعقبات الإعلانات. لا نبيع بياناتك مطلقاً.",
    summary2: "تشفير ممتد وسحابي عالي الكفاءة لحماية عاداتك وإنجازاتك الكبرى.",
    summary3: "معالجة فورية وتأمين بيانات التوجيه من الكوتش.",
    summary4: "يمكنك بسهولة حذف حسابك وبياناتك بالكامل من لوحة الإعدادات."
  }
};

export const PrivacyPage = () => {
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
              <Lock size={20} className="animate-pulse" />
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
                Life OS Security Policy Pro
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Legal Contents (8 columns on lg) */}
        <div className="lg:col-span-8 space-y-8 md:space-y-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-xs uppercase tracking-widest">
              <ShieldCheck size={13} />
              <span>{isAr ? "خصوصيتك" : "Our Privacy"}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-text-primary to-text-primary/70">
              {t.privacyTitle}
            </h1>
            <p className="text-xs font-mono text-text-secondary">
              {t.lastUpdated}
            </p>
          </div>

          <div className="space-y-8 text-sm md:text-base text-text-secondary leading-relaxed">
            
            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.dataCollectionTitle}</span>
              </h2>
              <p>{t.dataCollectionDesc}</p>
            </div>

            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.useOfParametersTitle}</span>
              </h2>
              <p>{t.useOfParametersDesc}</p>
            </div>

            <div className="space-y-3 border-b border-border/10 pb-6 border-accent/10">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2 text-accent">
                <span>{t.aiDisclaimerTitle}</span>
              </h2>
              <p>{t.aiDisclaimerDesc}</p>
            </div>

            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.thirdPartyServicesTitle}</span>
              </h2>
              <p>{t.thirdPartyServicesDesc}</p>
            </div>

            <div className="space-y-3 border-b border-border/10 pb-6">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.cookiesCuesTitle}</span>
              </h2>
              <p>{t.cookiesCuesDesc}</p>
            </div>

            <div className="space-y-2">
              <h2 className="font-bold text-text-primary text-lg md:text-xl flex items-center gap-2">
                <span>{t.securityCommitmentTitle}</span>
              </h2>
              <p>{t.securityCommitmentDesc}</p>
            </div>

          </div>

          <div className="pt-8 border-t border-border/20 text-center">
            <Link href="/">
              <button className="px-6 py-3 rounded-2xl bg-accent text-white font-bold text-xs hover:bg-accent-glow transition-all active:scale-95 cursor-pointer">
                {isAr ? "فهمت وموافق" : "I Agree & Perfect"}
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

export default PrivacyPage;
