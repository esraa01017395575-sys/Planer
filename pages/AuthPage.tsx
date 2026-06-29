import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ArrowRight, Loader2, User, Phone, Github, Chrome, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const { addNotification } = useAppContext();
  const [, setLocation] = useLocation();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      addNotification("كلمات المرور غير متطابقة", "error");
      return;
    }

    if (!isLogin && !agreeTerms) {
      addNotification("يرجى الموافقة على الشروط والأحكام", "error");
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }
          throw error;
        }
        addNotification("تم تسجيل الدخول بنجاح", "success");
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            }
          }
        });
        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('هذا المستخدم مسجل بالفعل');
          }
          throw error;
        }
        addNotification("تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني", "success");
      }
      setLocation('/dashboard');
    } catch (err: any) {
      addNotification(err.message || 'حدث خطأ أثناء العملية', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      addNotification(err.message || 'فشل تسجيل الدخول بجوجل', "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4] dark:bg-bg-primary flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white dark:bg-bg-secondary rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side - Illustration (Visible on MD+) */}
        <div className="hidden md:flex md:w-5/12 bg-[#D1E8E2] dark:bg-accent/20 relative p-12 flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-display font-bold text-[#2D5A4C] dark:text-accent tracking-widest uppercase"
            >
              Welcome
            </motion.h2>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none">
             {/* Simple Nature Scene Placeholder */}
             <svg viewBox="0 0 400 400" className="w-full h-full p-8">
                <path d="M0 400 Q100 350 200 400 T400 400 V400 H0 Z" fill="#2D5A4C" fillOpacity="0.2" />
                <path d="M0 400 Q150 300 300 400 T400 350 V400 H0 Z" fill="#2D5A4C" fillOpacity="0.1" />
                <circle cx="300" cy="100" r="40" fill="#FFD700" fillOpacity="0.2" />
                {/* Deer silhouettes could go here */}
             </svg>
          </div>

          <div className="relative z-10">
             <p className="text-[#2D5A4C] dark:text-text-secondary font-medium italic">
               "The best way to predict the future is to create it."
             </p>
          </div>

          {/* Wavy Divider */}
          <div className="absolute top-0 right-0 h-full w-16 bg-white dark:bg-bg-secondary" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0% 100%, 100% 50%, 0% 0%)' }}></div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 bg-[#2D5A4C] dark:bg-bg-secondary p-8 md:p-12 flex flex-col justify-center relative">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                Hello!
              </h1>
              <p className="text-white/80">
                We are glad to see you :)
              </p>
            </div>

            {/* Social Logins */}
            <div className="mb-8">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-[#2D5A4C] hover:bg-white/90 active:scale-[0.98] border border-transparent rounded-full py-3 px-6 flex items-center justify-center gap-3 font-semibold text-sm transition-all shadow-md cursor-pointer group"
              >
                <Chrome className="w-5 h-5 text-accent group-hover:rotate-12 transition-transform duration-300" />
                <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative px-4 bg-[#2D5A4C] dark:bg-bg-secondary text-white/40 text-xs uppercase tracking-widest">Or</span>
            </div>

            <form onSubmit={handleEmailAuth} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {!isLogin && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-full py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm"
                        placeholder="John Doe"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Phone</label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-full py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm"
                        placeholder="+123456789"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className={`space-y-1 ${isLogin ? 'sm:col-span-2' : ''}`}>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-full py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-full py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm"
                    placeholder="xxxxxxxx"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest ml-1">Repeat Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-full py-3 px-4 text-white outline-none focus:border-white/40 transition-all text-sm"
                      placeholder="xxxxxxxx"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border border-white/20 flex items-center justify-center transition-all ${agreeTerms ? 'bg-white/20 border-white/40' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    {agreeTerms && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-[10px] text-white/60">
                    I agree to the <Link href="/terms"><span className="text-white underline cursor-pointer hover:text-accent transition-colors">Terms of Service</span></Link> and <Link href="/privacy"><span className="text-white underline cursor-pointer hover:text-accent transition-colors">Privacy Policy</span></Link>
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2 mt-6">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D1E8E2] hover:bg-[#B8D8D0] text-[#2D5A4C] py-3 rounded-full font-bold shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    isLogin ? 'Sign In' : 'Sign Up'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-medium text-white/60 hover:text-white transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
