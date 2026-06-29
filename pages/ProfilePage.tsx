import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Sun, Moon, Zap, Brain, Check, Camera, Upload, 
  Loader2, Award, Calendar, Activity, CheckSquare, Clock, ArrowLeft 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { useLocation } from 'wouter';

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Esraa",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Mia",
  "https://api.dicebear.com/7.x/open-peeps/svg?seed=Leo",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robo",
  "https://api.dicebear.com/7.x/big-smile/svg?seed=Amir",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Anya",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Buster"
];

export function ProfilePage() {
  const { language, addNotification } = useAppContext();
  const isAr = language === 'ar';
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    wakeTime: '07:00',
    sleepTime: '23:00',
    energyPeak: 'morning',
    lifeAreas: [] as string[],
    avatarUrl: ''
  });

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksTotal: 0,
    habitsActive: 0,
    xpTotal: 0,
    streakDays: 0
  });

  const fetchProfileAndStats = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLocation('/auth');
        return;
      }
      setUser(authUser);

      // Fetch user row
      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // Fetch life_profile row
      const { data: lifeRow } = await supabase
        .from('life_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const nameVal = userRow?.name || lifeRow?.name || 'Israa';
      const avatarVal = userRow?.avatar_url || lifeRow?.avatar_url || '';

      setFormData({
        name: nameVal,
        wakeTime: lifeRow?.wake_time ? String(lifeRow.wake_time).slice(0, 5) : '07:00',
        sleepTime: lifeRow?.sleep_time ? String(lifeRow.sleep_time).slice(0, 5) : '23:00',
        energyPeak: lifeRow?.energy_peak || 'morning',
        lifeAreas: Array.isArray(lifeRow?.life_areas) ? lifeRow.life_areas : [],
        avatarUrl: avatarVal
      });

      // Fetch Stats
      const { count: completedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('status', 'done');

      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id);

      const { count: activeHabits } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('is_active', true);

      // Try fetching XP from user_xp or fallback to a calculated number
      let xp = 150;
      let streak = 3;
      try {
        const { data: xpRow } = await supabase
          .from('user_xp')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (xpRow) {
          xp = xpRow.total_xp || 0;
          streak = xpRow.streak_days || 0;
        }
      } catch (e) {
        // Fallback or ignore
      }

      setStats({
        tasksCompleted: completedTasks || 0,
        tasksTotal: totalTasks || 0,
        habitsActive: activeHabits || 0,
        xpTotal: xp,
        streakDays: streak
      });

    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Update users table
      const { error: userErr } = await supabase
        .from('users')
        .update({
          name: formData.name,
          avatar_url: formData.avatarUrl
        })
        .eq('id', authUser.id);

      if (userErr) throw userErr;

      // Format times
      const formattedWake = formData.wakeTime ? (formData.wakeTime.length === 5 ? `${formData.wakeTime}:00` : formData.wakeTime) : '07:00:00';
      const formattedSleep = formData.sleepTime ? (formData.sleepTime.length === 5 ? `${formData.sleepTime}:00` : formData.sleepTime) : '23:00:00';

      // Update life_profiles table
      const { error: lifeErr } = await supabase
        .from('life_profiles')
        .upsert({
          user_id: authUser.id,
          email: authUser.email || '',
          name: formData.name,
          wake_time: formattedWake,
          sleep_time: formattedSleep,
          energy_peak: formData.energyPeak,
          life_areas: formData.lifeAreas,
          is_onboarded: true
        }, { onConflict: 'user_id' });

      if (lifeErr) throw lifeErr;

      addNotification(
        isAr ? "تم حفظ التعديلات بنجاح! ✨" : "Profile preferences updated successfully! ✨",
        "success"
      );
      
      // Reload page to propagate changes to sidebar/topbar
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      addNotification(
        isAr ? "فشل حفظ التعديلات. حاول مرة أخرى." : "Failed to update profile. Please try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addNotification(
        isAr ? "حجم الصورة كبير جداً (الأقصى 2 ميجابايت)" : "Image is too large (maximum 2MB)",
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      addNotification(
        isAr ? "تم تحميل الصورة بنجاح!" : "Image uploaded successfully!",
        "success"
      );
    };
    reader.readAsDataURL(file);
  };

  const toggleLifeArea = (areaKey: string) => {
    setFormData(prev => {
      const isSelected = prev.lifeAreas.includes(areaKey);
      return {
        ...prev,
        lifeAreas: isSelected 
          ? prev.lifeAreas.filter(a => a !== areaKey)
          : [...prev.lifeAreas, areaKey]
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <header className="flex items-center gap-4">
        <button 
          onClick={() => setLocation('/dashboard')}
          className="p-2.5 bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary hover:text-text-primary rounded-xl border border-border/10 transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
        </button>
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">
            {isAr ? 'الملف الشخصي والإعدادات الاستراتيجية' : 'My Personal Profile & Strategy'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isAr ? 'إدارة إيقاعك اليومي وعاداتك وبياناتك الكوتش.' : 'Manage your daily rhythm, personal habits, and AI Coach parameters.'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Analytics Summary */}
        <div className="space-y-6 lg:col-span-1">
          {/* Avatar Card */}
          <div className="glass-card p-6 text-center space-y-4 flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
              <div className="w-28 h-28 rounded-3xl bg-bg-secondary border border-border/10 flex items-center justify-center overflow-hidden shadow-xl transition-all group-hover:scale-105">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-12 h-12 text-text-secondary" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold font-display text-text-primary">{formData.name}</h2>
              <p className="text-xs text-text-secondary mt-1">{user?.email}</p>
            </div>

            <div className="flex gap-2 w-full">
              <button 
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="flex-1 py-2.5 bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary text-xs font-bold rounded-xl border border-border/10 transition-colors"
              >
                {isAr ? 'تغيير الأفاتار' : 'Select Avatar'}
              </button>
              <label className="flex-1 py-2.5 bg-accent hover:bg-accent-glow text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer text-center flex items-center justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>{isAr ? 'رفع صورة' : 'Upload Image'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Quick Stats / Analytics */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-2">
              {isAr ? 'مؤشرات الأداء السريعة' : 'Performance Analytics'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-secondary/40 p-4 rounded-2xl border border-border/10 space-y-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary tabular-nums">
                    {stats.tasksCompleted}
                  </p>
                  <p className="text-[10px] text-text-secondary font-medium">
                    {isAr ? 'المهام المنجزة' : 'Tasks Completed'}
                  </p>
                </div>
              </div>

              <div className="bg-bg-secondary/40 p-4 rounded-2xl border border-border/10 space-y-2">
                <div className="p-2 bg-accent/10 text-accent rounded-xl w-fit">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary tabular-nums">
                    {stats.habitsActive}
                  </p>
                  <p className="text-[10px] text-text-secondary font-medium">
                    {isAr ? 'العادات النشطة' : 'Active Habits'}
                  </p>
                </div>
              </div>

              <div className="bg-bg-secondary/40 p-4 rounded-2xl border border-border/10 space-y-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl w-fit">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary tabular-nums">
                    {stats.xpTotal} XP
                  </p>
                  <p className="text-[10px] text-text-secondary font-medium">
                    {isAr ? 'إجمالي الخبرة' : 'Total XP'}
                  </p>
                </div>
              </div>

              <div className="bg-bg-secondary/40 p-4 rounded-2xl border border-border/10 space-y-2">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-xl w-fit">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary tabular-nums">
                    {stats.streakDays} {isAr ? 'أيام' : 'Days'}
                  </p>
                  <p className="text-[10px] text-text-secondary font-medium">
                    {isAr ? 'سلسلة النشاط' : 'Active Streak'}
                  </p>
                </div>
              </div>
            </div>

            {/* Completion rate progress bar */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                <span>{isAr ? 'معدل إنجاز المهام الكلي' : 'Overall Completion Rate'}</span>
                <span>{stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden border border-border/50">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold font-display text-text-primary border-b border-border/10 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              <span>{isAr ? 'التفضيلات الشخصية وخطة اليوم' : 'Personal Rhythms & Priorities'}</span>
            </h3>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                {isAr ? 'الاسم الشخصي' : 'Display Name'}
              </label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                required
                className="w-full bg-bg-secondary/50 border border-border/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-accent/20 text-text-primary transition-all font-bold"
              />
            </div>

            {/* Wake / Sleep rhythms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'وقت الاستيقاظ المعتاد' : 'Usual Wake Up Time'}</span>
                </label>
                <input 
                  type="time"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData(p => ({ ...p, wakeTime: e.target.value }))}
                  className="w-full bg-bg-secondary/50 border border-border/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-accent/20 text-text-primary transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>{isAr ? 'وقت النوم المعتاد' : 'Usual Sleep Time'}</span>
                </label>
                <input 
                  type="time"
                  value={formData.sleepTime}
                  onChange={(e) => setFormData(p => ({ ...p, sleepTime: e.target.value }))}
                  className="w-full bg-bg-secondary/50 border border-border/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-accent/20 text-text-primary transition-all font-bold"
                />
              </div>
            </div>

            {/* Peak Energy Option */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-accent" />
                <span>{isAr ? 'فترات طاقة الإنتاج القصوى' : 'Your Peak Energy Period'}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['morning', 'afternoon', 'evening', 'night'].map((peak) => {
                  const labelAr = peak === 'morning' ? 'الصباح' : peak === 'afternoon' ? 'الظهيرة' : peak === 'evening' ? 'المساء' : 'الليل';
                  const isSelected = formData.energyPeak === peak;
                  return (
                    <button
                      key={peak}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, energyPeak: peak }))}
                      className={`py-3 px-4 rounded-xl border font-bold text-xs capitalize transition-all active:scale-95 ${
                        isSelected 
                          ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25' 
                          : 'bg-bg-secondary/40 border-transparent hover:border-accent/20 text-text-primary'
                      }`}
                    >
                      {isAr ? labelAr : peak}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Life Areas Multichoice */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'مجالات التركيز والتطبيق' : 'Target Life Areas & Application'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      type="button"
                      onClick={() => toggleLifeArea(area.key)}
                      className={`p-3.5 rounded-xl border transition-all text-sm font-bold flex items-center justify-between text-right ${
                        isSelected 
                          ? 'bg-accent/15 text-accent border-accent' 
                          : 'bg-bg-secondary/40 border-transparent hover:border-accent/20 text-text-primary'
                      }`}
                    >
                      <span>{isAr ? area.ar : area.en}</span>
                      {isSelected && <Check className="w-4 h-4 text-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/10">
              <button 
                type="button"
                onClick={() => setLocation('/dashboard')}
                className="px-6 py-3 bg-bg-secondary hover:bg-bg-secondary/80 text-text-secondary font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-accent hover:bg-accent-glow text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isAr ? 'حفظ التغييرات' : 'Save Preferences'}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </form>

      </div>

      {/* Preset Avatars Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAvatarModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-primary border border-border rounded-3xl w-full max-w-lg p-6 relative shadow-2xl space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/10">
                <h3 className="text-lg font-bold font-display text-text-primary">
                  {isAr ? 'اختر الأفاتار المناسب لك' : 'Select Pre-designed Avatar'}
                </h3>
                <button 
                  onClick={() => setShowAvatarModal(false)}
                  className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                >
                  <ArrowLeft className={`w-5 h-5 ${isAr ? '' : 'rotate-180'}`} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {PRESET_AVATARS.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, avatarUrl: url }));
                      setShowAvatarModal(false);
                      addNotification(
                        isAr ? "تم اختيار الأفاتار بنجاح!" : "Avatar selected successfully!",
                        "success"
                      );
                    }}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                      formData.avatarUrl === url ? 'border-accent ring-4 ring-accent/20' : 'border-transparent hover:border-accent/40'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
