import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
  MessageSquare,
  Loader2,
  X,
  Trash2,
  Calendar,
  Edit2,
  Sparkles,
  Check,
  ListTodo,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import {
  useGetGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCreateMilestone,
  useGetPlanMilestones,
  useCreateTask,
} from "../lib/hooks";

const GOAL_CATEGORIES = [
  "career",
  "health",
  "personal",
  "finance",
  "education",
] as const;

export const Plans = ({
  onAskAI: propsOnAskAI,
}: {
  onAskAI?: (content: string) => void;
}) => {
  const { t, language, addNotification } = useAppContext();
  const isAr = language === "ar";
  const { data: goals, loading, refetch } = useGetGoals();
  const { mutate: deleteGoal } = useDeleteGoal();
  const [location, setLocation] = useLocation();

  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);
  const [loadingMonthlyPlans, setLoadingMonthlyPlans] = useState(false);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);

  const fetchMonthlyPlans = async () => {
    try {
      setLoadingMonthlyPlans(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch("/api/monthly-plans", {
        headers: {
          "x-user-id": user.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyPlans(data);
      }
    } catch (err) {
      console.error("Error fetching monthly plans:", err);
    } finally {
      setLoadingMonthlyPlans(false);
    }
  };

  const generateMonthlyPlan = async (monthStr: string) => {
    try {
      setGeneratingMonthly(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const res = await fetch("/api/monthly-plans/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({ month: monthStr })
      });
      if (res.ok) {
        const data = await res.json();
        addNotification(language === 'ar' ? "تم توليد الخطة الشهرية بالذكاء الاصطناعي بنجاح!" : "AI Monthly roadmap generated successfully!", "success");
        fetchMonthlyPlans();
      } else {
        addNotification(language === 'ar' ? "فشل توليد الخطة الاستراتيجية للشهر." : "Failed to generate monthly roadmap.", "error");
      }
    } catch (err) {
      console.error("Monthly plan generation error:", err);
      addNotification(language === 'ar' ? "حدث خطأ غير متوقع أثناء توليد الخطة." : "Unexpected error while generating roadmap.", "error");
    } finally {
      setGeneratingMonthly(false);
    }
  };

  useEffect(() => {
    fetchMonthlyPlans();
  }, []);

  const onAskAI =
    propsOnAskAI ||
    ((prompt: string) => {
      setLocation(`/chat?prompt=${encodeURIComponent(prompt)}`);
    });

  const [activeTab, setActiveTab] = useState<
    "monthly" | "quarterly" | "yearly" | "half_year"
  >("monthly");
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [addTaskGoal, setAddTaskGoal] = useState<any>(null);

  const toggleExpand = (id: string) => {
    setExpandedPlanId(expandedPlanId === id ? null : id);
  };

  const handleAddTaskForToday = (goal: any) => {
    onAskAI(`I want to add a task for today based on my plan: ${goal.title}`);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("confirmDelete"))) {
      deleteGoal(
        { id },
        {
          onSuccess: () => {
            addNotification(t("note_deleted"), "success");
            refetch();
          },
        },
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">
          {t("long_term_plans")}
        </h1>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-xl border border-border">
            {[
              { id: "monthly", icon: "🗓️" },
              { id: "quarterly", icon: "📅" },
              { id: "half_year", icon: "🎯" },
              { id: "yearly", icon: "🏆" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:text-text-primary"}`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{t(tab.id)}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-accent text-white font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("new_plan")}
          </button>
        </div>
      </header>

      {activeTab === "monthly" && (
        <div className="bg-gradient-to-br from-accent/5 to-indigo-500/5 border border-accent/20 rounded-2xl p-6 md:p-8 space-y-6 mb-8 relative overflow-hidden backdrop-blur-xl animate-in fade-in duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
            <Sparkles size={160} className="text-accent" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-black tracking-widest text-accent uppercase mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                {isAr ? "الخطة الاستراتيجية الشهرية للذكاء الاصطناعي" : "MONTHLY AI STRATEGIC COACH"}
              </h2>
              <h1 className="text-xl md:text-2xl font-bold font-display text-text-primary tracking-tight">
                {new Date().toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" })}
              </h1>
              <p className="text-xs text-text-secondary opacity-75 mt-1">
                {isAr ? "توجيهات استراتيجية وأولويات مخصصة لبناء المسار المهني مع الكوتش." : "AI Coach strategic guidelines and prioritized roadmap for your profile."}
              </p>
            </div>

            <button
              type="button"
              disabled={generatingMonthly}
              onClick={() => {
                const mStr = new Date().toISOString().substring(0, 7) + "-01";
                generateMonthlyPlan(mStr);
              }}
              className="w-full md:w-auto px-5 py-2.5 bg-accent hover:bg-accent-glow text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-accent/15 cursor-pointer"
            >
              {generatingMonthly ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin animate-infinite" />
                  <span>{isAr ? "جاري التوليد..." : "Generating Roadmap..."}</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? "توليد خارطة طريق مع الكوتش" : "Generate Coach Roadmap"}</span>
                </>
              )}
            </button>
          </div>

          {/* Display active monthly plan if present */}
          {monthlyPlans && monthlyPlans.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border/40">
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-xs font-black text-text-secondary uppercase tracking-wider">
                  {isAr ? "ملخص الكوتش الاستراتيجي" : "Strategy Highlights"}
                </h4>
                <div className="text-sm leading-relaxed text-text-primary bg-bg-secondary/40 border border-border/20 rounded-xl p-4 md:p-5 italic font-sans whitespace-pre-line">
                  {monthlyPlans[0].ai_summary}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-text-secondary uppercase tracking-wider">
                  {isAr ? "مجالات التركيز المقترحة" : "Core Focus Disciplines"}
                </h4>
                <div className="space-y-2.5">
                  {Array.isArray(monthlyPlans[0].focus_areas) && monthlyPlans[0].focus_areas.length > 0 ? (
                    monthlyPlans[0].focus_areas.map((focus: any, fIdx: number) => (
                      <div key={fIdx} className="bg-bg-card/65 border border-border/30 rounded-xl p-3.5 hover:border-accent/30 transition-all flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-text-primary leading-tight">
                            {focus.title}
                          </h5>
                          <p className="text-[11px] text-text-secondary leading-normal mt-1">
                            {focus.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-secondary italic">
                      {isAr ? "لا توجد مجالات تركيز مقترحة بعد." : "No explicit focus areas identified yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            !generatingMonthly && (
              <div className="border border-dashed border-border/70 rounded-xl p-8 text-center bg-bg-secondary/20">
                <Sparkles className="w-8 h-8 text-accent/40 mx-auto mb-2.5" />
                <p className="text-xs text-text-primary font-bold">
                  {isAr ? "لم يتم توليد خارطة طريق لهذا الشهر بعد!" : "Navigate this month with high alignment!"}
                </p>
                <p className="text-[11px] text-text-secondary mt-1">
                  {isAr ? "اضغط على زر التوليد في الأعلى ليساعدك الكوتش الذكي في وضع اتجاهاتك الاستراتيجية." : "Tap the generate button above to formulate your personalized strategic plan."}
                </p>
              </div>
            )
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 pb-12">
        {goals
          ?.filter((p) => p.timeframe === activeTab)
          .map((goal) => (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-8 space-y-6 group hover:border-accent/30 transition-all relative overflow-hidden flex flex-col ${expandedPlanId === goal.id ? "row-span-2 ring-2 ring-accent/20" : ""}`}
            >
              {/* Existing Card Content */}
              <div className="absolute top-8 right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                <button
                  onClick={() => setEditingGoal(goal)}
                  className="p-2 text-text-secondary hover:text-accent transition-all bg-bg-primary rounded-lg border border-border"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 text-text-secondary hover:text-red-500 transition-all bg-bg-primary rounded-lg border border-border"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-lg">
                      {goal.category}
                    </span>
                    <span className="text-[10px] font-bold text-text-secondary opacity-60 flex items-center gap-1">
                      <Clock size={10} /> {goal.timeframe}
                    </span>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-text-primary group-hover:text-accent transition-colors">
                    {goal.title}
                  </h3>
                  {goal.target_date && (
                    <p className="text-xs text-text-secondary flex items-center gap-1 opacity-60">
                      <Calendar size={12} /> Target:{" "}
                      {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-accent/10 rounded-2xl">
                  <Target className="w-8 h-8 text-accent" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-text-primary">
                    {goal.progress || 0}% complete
                  </span>
                  <span className="text-accent uppercase text-[9px] tracking-[0.2em]">
                    {goal.status}
                  </span>
                </div>
                <div className="h-3 bg-bg-secondary rounded-full overflow-hidden border border-border/50">
                  <motion.div
                    className="h-full bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress || 0}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  ></motion.div>
                </div>
                <p className="text-[10px] text-text-secondary font-medium">
                  Current phase:{" "}
                  <span className="text-text-primary uppercase tracking-wider">
                    {goal.metadata?.current_phase || "Foundations"}
                  </span>
                </p>
              </div>

              {goal.description && (
                <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed border-l-2 border-accent/20 pl-4 py-1 italic">
                  {goal.description}
                </p>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-4 mt-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(goal.id);
                  }}
                  className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${expandedPlanId === goal.id ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-secondary/80 border border-border"}`}
                >
                  <Calendar className="w-4 h-4" />
                  {expandedPlanId === goal.id
                    ? (isAr ? "إخفاء الخطة" : "Hide Plan")
                    : (isAr ? "عرض الخطة" : "Show Plan")}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddTaskGoal(goal);
                  }}
                  className="py-3 px-4 bg-bg-secondary text-text-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-accent hover:border-accent transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isAr ? "إضافة مهمة" : "Add Task"}
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    let stepsText = "";
                    try {
                      const { data: mData } = await supabase
                        .from("plan_milestones")
                        .select("title")
                        .eq("plan_id", goal.id);
                      const { data: tData } = await supabase
                        .from("tasks")
                        .select("title, status")
                        .eq("goal_id", goal.id);
                      
                      if (mData && mData.length > 0) {
                        stepsText += isAr 
                          ? "\n\nالمراحل الحالية المحددة:\n" 
                          : "\n\nGenerated roadmap milestones:\n";
                        mData.forEach((m, idx) => {
                          stepsText += `- Phase ${idx + 1}: ${m.title}\n`;
                        });
                      }
                      if (tData && tData.length > 0) {
                        stepsText += isAr 
                          ? "\nالخطوات والمهام المترابطة بالخطة:\n" 
                          : "\nLinked action steps/tasks:\n";
                        tData.forEach((t) => {
                          stepsText += `- [${t.status === 'done' ? '✓' : ' '}] ${t.title}\n`;
                        });
                      }
                    } catch (err) {
                      console.error("Error fetching steps for discussion:", err);
                    }

                    const prompt = isAr
                      ? `أريد مناقشة هذه الخطة بالتفصيل:\n\nاسم الخطة: ${goal.title}\nالوصف: ${goal.description || 'لا يوجد وصف'}\nالتصنيف: ${goal.category}\nالفترة الزمنية: ${goal.timeframe}${stepsText}\n\nكيف يمكنني تحسين وتطبيق هذه الخطوات للحصول على نتائج ممتازة؟`
                      : `I want to discuss this performance plan:\n\nPlan: ${goal.title}\nDescription: ${goal.description || 'No description provided'}\nCategory: ${goal.category}\nTimeframe: ${goal.timeframe}${stepsText}\n\nHow can I enhance and execute these steps successfully?`;
                    setLocation(`/chat?prompt=${encodeURIComponent(prompt)}`);
                  }}
                  className="py-3 px-4 bg-bg-secondary text-text-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-accent hover:border-accent transition-all flex items-center justify-center gap-2 col-span-2 lg:col-span-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  {isAr ? "مناقشة الخطة" : "Discuss"}
                </button>
              </div>

              <AnimatePresence>
                {expandedPlanId === goal.id && (
                  <PlanDetails
                    goal={goal}
                    onAskAI={onAskAI}
                    onRefetchGoals={refetch}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}

        {goals?.filter((p) => p.timeframe === activeTab).length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center glass-card border-dashed">
            <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mb-4 text-text-secondary opacity-20">
              <Target size={32} />
            </div>
            <p className="text-text-secondary font-bold">
              No {activeTab} goals yet
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 text-accent text-sm font-bold hover:underline"
            >
              + Add your first {activeTab} goal
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {addTaskGoal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setAddTaskGoal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-bg-primary border border-border rounded-[2rem] w-full max-w-lg p-8 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setAddTaskGoal(null)}
                className="absolute top-6 right-6 p-2 h-10 w-10 flex items-center justify-center bg-bg-secondary rounded-xl hover:scale-110 transition-all"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
              <h2 className="text-2xl font-bold mb-6">
                Add Task for: {addTaskGoal.title}
              </h2>
              <QuickTaskForm
                goal={addTaskGoal}
                onSuccess={() => setAddTaskGoal(null)}
              />
            </motion.div>
          </div>
        )}
        {(isAdding || editingGoal) && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => {
              setIsAdding(false);
              setEditingGoal(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-bg-primary border border-border rounded-[2.5rem] w-full max-w-2xl relative shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingGoal(null);
                  }}
                  className="absolute top-8 right-8 p-2 h-10 w-10 flex items-center justify-center bg-bg-secondary rounded-xl hover:scale-110 transition-all z-10"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>

                <h2 className="text-3xl font-display font-bold text-text-primary mb-8">
                  {editingGoal ? "Edit Plan" : "Add New Plan"}
                </h2>

                <AddPlanForm
                  editingGoal={editingGoal}
                  onClose={() => {
                    setIsAdding(false);
                    setEditingGoal(null);
                    refetch();
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlanDetails = ({
  goal,
  onAskAI,
  onRefetchGoals,
}: {
  goal: any;
  onAskAI: (c: string) => void;
  onRefetchGoals: () => void;
}) => {
  const { language, addNotification } = useAppContext();
  const isAr = language === "ar";

  const {
    data: milestones,
    loading: milestonesLoading,
    refetch: refetchMilestones,
  } = useGetPlanMilestones(goal.id);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("goal_id", goal.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching plan tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [goal.id]);

  const handleToggleTask = async (task: any) => {
    const isDone = task.status === "done";
    const nextStatus = isDone ? "todo" : "done";

    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus } : t,
    );
    setTasks(updatedTasks);

    const completedCount = updatedTasks.filter(
      (t) => t.status === "done",
    ).length;
    const totalCount = updatedTasks.length;
    const nextProgress =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    try {
      const { error: tErr } = await supabase
        .from("tasks")
        .update({ status: nextStatus })
        .eq("id", task.id);
      if (tErr) throw tErr;

      const { error: gErr } = await supabase
        .from("goals")
        .update({ progress: nextProgress })
        .eq("id", goal.id);
      if (gErr) throw gErr;

      addNotification(
        isAr
          ? `تم تحديث الخطوة لـ "${task.title}". معدل تقدم الخطة: ${nextProgress}% 🚀`
          : `Step updated to "${task.title}". Plan progress is now ${nextProgress}% 🚀`,
        "success",
      );

      onRefetchGoals();
    } catch (err) {
      console.error(err);
      addNotification(
        isAr ? "فشل تحديث حالة المهمة" : "Failed to update task status",
        "error",
      );
    }
  };

  const handleUpdateViaAI = async () => {
    try {
      setIsUpdating(true);
      addNotification(
        isAr
          ? "جاري تفتيت الأهداف وتوليد خطوات إضافية مخصصة... 🤖"
          : "AI is generating strategic action steps for your goal... 🤖",
        "info",
      );

      const res = await fetch(`/api/goals/${goal.id}/generate-ai-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": goal.user_id,
        },
        body: JSON.stringify({
          title: goal.title,
          description: goal.description,
          timeframe: goal.timeframe,
          category: goal.category,
        }),
      });

      if (res.ok) {
        addNotification(
          isAr
            ? "اكتمل التوليد بنجاح! تم تفصيل مراحل الخطة وإضافتها لقائمتك. 🎉"
            : "AI Generation Successful! High-impact steps and milestones are live. 🎉",
          "success",
        );
        refetchMilestones();
        fetchTasks();
        onRefetchGoals();
      } else {
        const errText = await res.text();
        console.error("Failed AI plan generation:", errText);
        addNotification(
          isAr
            ? "فشل توليد الخطة بالذكاء الاصطناعي"
            : "Failed to generate plan via AI",
          "error",
        );
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (milestonesLoading)
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
      </div>
    );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden pt-8 space-y-8 border-t border-border mt-6 shrink-0 text-right"
      style={{ direction: isAr ? "rtl" : "ltr" }}
    >
      {/* 1. Loading States */}
      {isUpdating && (
        <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl flex flex-col items-center justify-center gap-3 animate-pulse">
          <Sparkles className="w-8 h-8 text-accent animate-spin" />
          <p className="text-xs font-bold text-accent">
            {isAr
              ? "جاري إعادة رسم الخطة والخطوات بالذكاء الاصطناعي..."
              : "AI is redesigning your performance roadmap..."}
          </p>
        </div>
      )}

      {/* 2. Milestones / Roadmap timeline */}
      {!isUpdating &&
        (milestonesLoading ? (
          <div className="p-4 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-accent" />
          </div>
        ) : (
          milestones &&
          milestones.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-accent" />
                {isAr ? "مراحل الخطة الزمنية" : "Timeframe Roadmap"}
              </h4>
              <div
                className={`relative pr-4 space-y-4 mr-1 ${isAr ? "border-r border-border/20 pl-0 pr-4" : "border-l border-border/20 pl-4 pr-0"}`}
              >
                {milestones.map((milestone, idx) => (
                  <div key={milestone.id} className="relative">
                    <span
                      className={`absolute top-1.5 w-2 h-2 rounded-full bg-accent ring-4 ring-accent/10 ${isAr ? "-right-[20px]" : "-left-[20px]"}`}
                    />
                    <div className="space-y-1">
                      <p
                        className={`text-xs font-bold leading-none ${isAr ? "text-right" : "text-left"}`}
                      >
                        {isAr ? `المرحلة ${idx + 1}:` : `Phase ${idx + 1}:`}{" "}
                        {milestone.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

      {/* 3. Detailed Actions Checklist */}
      {!isUpdating &&
        !tasksLoading &&
        (tasks && tasks.length > 0 ? (
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-emerald-500" />
              {isAr ? "الخطوات والمهام الذكية المترابطة" : "Linked Action Tasks & Steps"}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {tasks.map((task) => {
                const isCompleted = task.status === "done";
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${isCompleted ? "bg-bg-secondary/40 border-border/40 opacity-60" : "bg-bg-secondary/20 border-border hover:border-accent/40"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-border group-hover:border-accent"}`}
                      >
                        {isCompleted && (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                      </div>
                      <div className="text-right flex-1 min-w-0 pr-2">
                        <p
                          className={`text-xs font-bold ${isAr ? "text-right font-display" : "text-left"} ${isCompleted ? "line-through text-text-secondary w-full truncate" : "text-text-primary w-full truncate"}`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p
                            className={`text-[10px] text-text-secondary mt-0.5 ${isAr ? "text-right font-sans w-full truncate" : "text-left w-full truncate"}`}
                          >
                            {task.description.split("\n\n")[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${task.priority === "high" ? "bg-red-500/10 text-red-400 border border-red-500/10" : task.priority === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" : "bg-blue-500/10 text-blue-400 border border-blue-500/10"}`}
                      >
                        {task.priority || "medium"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          !milestones?.length && (
            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3 text-amber-400 text-xs font-bold justify-center">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                {isAr
                  ? "لا توجد خطوات عمل مولدة لهذه الخطة بعد. انقر على الزر بالأسفل لتوليدها ذكياً!"
                  : "No roadmap or detailed steps have been generated for this plan yet."}
              </span>
            </div>
          )
        ))}

      {/* 4. Actions controls */}
      <div className="p-4 bg-bg-secondary border border-dashed border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
            {isAr
              ? "هل تريد تفتيت أهداف الخطة لمزيد من التفاصيل؟"
              : "Need more specific milestones & tasks?"}
          </p>
          <p className="text-[9px] text-text-secondary opacity-60 font-medium">
            {isAr
              ? "الذكاء الاصطناعي يقوم بصنع خطوات عمل تفصيلية وإضافتها لقائمتك تلقائياً."
              : "AI creates micro-steps and adds direct actionable tasks to your Board."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUpdateViaAI}
            disabled={isUpdating}
            type="button"
            className="px-4 py-2.5 bg-accent hover:bg-accent-glow text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAr ? "تحديث الخطة بالذكاء الاصطناعي" : "Update plan via AI"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AddPlanForm = ({
  editingGoal,
  onClose,
}: {
  editingGoal?: any;
  onClose: () => void;
}) => {
  const { t, language, addNotification } = useAppContext();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const createMilestone = useCreateMilestone();

  const calculateTargetDate = (timeframe: string) => {
    const today = new Date();
    const daysToAdd =
      {
        monthly: 30,
        quarterly: 90,
        half_year: 180,
        yearly: 365,
      }[timeframe] || 30;
    today.setDate(today.getDate() + daysToAdd);
    return today;
  };

  const [formData, setFormData] = useState({
    title: editingGoal?.title || "",
    description: editingGoal?.description || "",
    type: (editingGoal?.timeframe || "monthly") as
      | "monthly"
      | "quarterly"
      | "half_year"
      | "yearly",
    category: editingGoal?.category || "",
    targetDate: editingGoal?.target_date
      ? new Date(editingGoal.target_date)
      : calculateTargetDate(editingGoal?.timeframe || "monthly"),
    milestones: [] as { title: string; dueDate?: string }[],
    useAI: false,
  });

  const handleTimeframeChange = (type: any) => {
    setFormData((prev) => ({
      ...prev,
      type,
      targetDate: calculateTargetDate(type),
    }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { title: "", dueDate: "" }],
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || formData.title.length < 3) {
      addNotification(
        "Please give your plan a title (min 3 characters)",
        "error",
      );
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      timeframe: formData.type,
      target_date: formData.targetDate.toISOString(),
      status: "active",
      progress: editingGoal?.progress || 0,
      metadata: {
        ai_generated: formData.useAI,
        current_phase: "Foundations",
      },
    };

    if (editingGoal) {
      updateGoal.mutate(
        { id: editingGoal.id, data: payload },
        {
          onSuccess: () => {
            addNotification("Plan updated! 🎯", "success");
            onClose();
          },
        },
      );
    } else {
      createGoal.mutate(
        { data: payload },
        {
          onSuccess: (newGoal: any) => {
            if (formData.useAI && newGoal?.id) {
              addNotification(
                language === "ar"
                  ? "تم إنشاء الخطة! جاري تفتيت الأهداف بالذكاء الاصطناعي... 🤖"
                  : "Plan created! AI is generating your milestones & tasks... 🤖",
                "info",
              );
              fetch(`/api/goals/${newGoal.id}/generate-ai-plan`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": newGoal.user_id,
                },
                body: JSON.stringify({
                  title: formData.title,
                  description: formData.description,
                  timeframe: formData.type,
                  category: formData.category,
                }),
              })
                .then((res) => {
                  if (res.ok) {
                    addNotification(
                      language === "ar"
                        ? "اكتمل التوليد! تم تفتيت الخطة بنجاح وإضافة الخطوات والمهام لقائمتك. 🚀"
                        : "AI Generation Complete! Roadmaps and action tasks are now live in your list! 🚀",
                      "success",
                    );
                  } else {
                    console.error("AI Plan fail");
                  }
                  onClose();
                })
                .catch((err) => {
                  console.error(err);
                  onClose();
                });
            } else if (
              !formData.useAI &&
              formData.milestones.length > 0 &&
              newGoal?.id
            ) {
              Promise.all(
                formData.milestones.map((m, i) =>
                  createMilestone.mutateAsync({
                    plan_id: newGoal.id,
                    title: m.title,
                    due_date: m.dueDate || null,
                    is_done: false,
                    order_index: i,
                  }),
                ),
              ).then(() => {
                addNotification(
                  language === "ar"
                    ? "تم إنشاء الخطة والمراحل بنجاح! 🎯"
                    : "Plan and milestones created successfully! 🎯",
                  "success",
                );
                onClose();
              });
            } else {
              addNotification(
                language === "ar"
                  ? "تم إنشاء الخطة بنجاح! 🎯"
                  : "Plan created successfully! 🎯",
                "success",
              );
              onClose();
            }
          },
        },
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Plan Title */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">
          What do you want to achieve? *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Learn Backend Development, Get Fit, Start a Side Business"
          className="w-full bg-bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-text-primary outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-bold text-lg"
          required
        />
      </div>

      {/* 2. Plan Type (Cards) */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">
          Timeframe *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "monthly", label: "Monthly", icon: "🗓️", desc: "1 month" },
            {
              id: "quarterly",
              label: "Quarterly",
              icon: "📅",
              desc: "3 months",
            },
            {
              id: "half_year",
              label: "Half-Year",
              icon: "🎯",
              desc: "6 months",
            },
            { id: "yearly", label: "Yearly", icon: "🏆", desc: "12 months" },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleTimeframeChange(type.id)}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-1 ${formData.type === type.id ? "bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-105" : "bg-bg-secondary border-border text-text-secondary hover:border-accent/40"}`}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-tight">
                {type.label}
              </span>
              <span className="text-[9px] opacity-60 font-bold">
                {type.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Description */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">
          Why is this important to you?
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="I want to switch careers into tech... / I want to improve my health..."
          rows={3}
          className="w-full bg-bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-text-primary outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all resize-none font-medium text-sm leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 5. Category */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full bg-bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-text-primary outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-bold appearance-none cursor-pointer"
          >
            <option value="">Select category</option>
            <option value="career">💼 Career</option>
            <option value="learning">📚 Learning</option>
            <option value="health">💪 Health & Fitness</option>
            <option value="spiritual">🤲 Spiritual</option>
            <option value="personal">🌱 Personal Development</option>
            <option value="finance">💰 Financial</option>
            <option value="creative">🎨 Creative</option>
            <option value="home">🏡 Home & Lifestyle</option>
          </select>
        </div>

        {/* 4. Target Date */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">
            Target completion date *
          </label>
          <input
            type="date"
            value={formData.targetDate.toISOString().split("T")[0]}
            onChange={(e) =>
              setFormData({ ...formData, targetDate: new Date(e.target.value) })
            }
            className="w-full bg-bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-text-primary outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-bold cursor-pointer"
            required
          />
        </div>
      </div>

      {/* 6. Milestones */}
      {!formData.useAI && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">
              Break it into milestones (optional)
            </label>
            <button
              type="button"
              onClick={addMilestone}
              className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add milestone
            </button>
          </div>
          <div className="space-y-3">
            {formData.milestones.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-bg-secondary/30 p-2 rounded-2xl border border-border"
              >
                <input
                  type="text"
                  value={m.title}
                  onChange={(e) =>
                    updateMilestone(idx, "title", e.target.value)
                  }
                  placeholder={`Milestone ${idx + 1}`}
                  className="flex-1 bg-transparent border-none text-sm font-bold placeholder:opacity-30 focus:ring-0"
                />
                <input
                  type="date"
                  value={m.dueDate}
                  onChange={(e) =>
                    updateMilestone(idx, "dueDate", e.target.value)
                  }
                  className="bg-transparent border-none text-[10px] font-bold text-text-secondary focus:ring-0 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
                  className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. AI Toggle */}
      <div
        onClick={() => setFormData({ ...formData, useAI: !formData.useAI })}
        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${formData.useAI ? "bg-accent/5 border-accent shadow-inner" : "bg-bg-secondary/30 border-border opacity-70 hover:opacity-100"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${formData.useAI ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary"}`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">
              Let AI generate milestones and tasks
            </p>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">
              Fully automated roadmap
            </p>
          </div>
        </div>
        <div
          className={`w-12 h-6 rounded-full p-1 transition-all ${formData.useAI ? "bg-accent" : "bg-bg-secondary"}`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-all ${formData.useAI ? "translate-x-6" : "translate-x-0"}`}
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-5 bg-bg-secondary text-text-primary border border-border rounded-3xl font-bold hover:bg-bg-secondary/80 transition-all"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={createGoal.isPending || updateGoal.isPending}
          className="flex-3 py-5 bg-accent text-white rounded-3xl font-bold shadow-2xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {createGoal.isPending || updateGoal.isPending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : editingGoal ? (
            "Save Changes"
          ) : (
            "Create Plan →"
          )}
        </button>
      </div>
    </form>
  );
};

const QuickTaskForm = ({
  goal,
  onSuccess,
}: {
  goal: any;
  onSuccess: () => void;
}) => {
  const { mutate: createTask, isPending } = useCreateTask();
  const { addNotification } = useAppContext();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createTask(
      {
        data: {
          title: formData.get("title") as string,
          description: `Task related to plan: ${goal.title}\n\n${formData.get("description")}`,
          priority: formData.get("priority") as any,
          due_date: format(new Date(), "yyyy-MM-dd"),
          status: "todo",
          goal_id: goal.id,
        },
      },
      {
        onSuccess: () => {
          addNotification("Task added to your dashboard!", "success");
          onSuccess();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
          Task Title
        </label>
        <input
          name="title"
          required
          autoFocus
          placeholder="What needs to be done?"
          className="w-full bg-bg-secondary border border-border rounded-xl py-4 px-6 text-text-primary outline-none focus:border-accent transition-all font-bold"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
          Notes
        </label>
        <textarea
          name="description"
          placeholder="Any specific details..."
          className="w-full bg-bg-secondary border border-border rounded-xl py-4 px-6 text-text-primary outline-none focus:border-accent transition-all min-h-[100px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
          Priority
        </label>
        <select
          name="priority"
          className="w-full bg-bg-secondary border border-border rounded-xl py-4 px-6 text-text-primary outline-none focus:border-accent appearance-none transition-all font-bold"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-5 bg-accent text-white rounded-2xl font-bold shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          "Add to Dashboard"
        )}
      </button>
    </form>
  );
};
