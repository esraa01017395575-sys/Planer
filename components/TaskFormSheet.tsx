import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useAppContext } from "../context/AppContext";
import {
  useUpdateTask,
  useCreateTask,
  useDeleteTask,
  useToggleFavorite,
} from "../lib/hooks";
import { supabase } from "../lib/supabase";

interface TaskFormSheetProps {
  currentUser: any;
  editingTask: any;
  isAdding: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskFormSheet: React.FC<TaskFormSheetProps> = ({
  currentUser,
  editingTask,
  isAdding,
  onClose,
  onSuccess,
}) => {
  const { t, language, addNotification } = useAppContext();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: deleteTask } = useDeleteTask();
  const { toggleFavorite } = useToggleFavorite();

  const [title, setTitle] = useState("");
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dueDate, setDueDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [priority, setPriority] = useState("medium");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("projects")
            .select("id, title")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (data) {
            setProjects(data);
          }
        }
      } catch (e) {
        console.error("Error fetching projects in sheet:", e);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setSubtasks(editingTask.subtasks || []);
      setSelectedProjectId(editingTask.project_id || "");
      setDueDate(editingTask.due_date || format(new Date(), "yyyy-MM-dd"));
      setPriority(editingTask.priority || "medium");
    } else {
      setTitle("");
      setSubtasks([]);
      setSelectedProjectId("");
      setDueDate(format(new Date(), "yyyy-MM-dd"));
      setPriority("medium");
    }
  }, [editingTask, isAdding]);

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const generateSubtasks = async () => {
    if (!title) {
      addNotification(
        language === "ar"
          ? "يرجى إدخال عنوان المهمة أولاً"
          : "Please enter the task title first",
        "error"
      );
      return;
    }

    setIsGeneratingSubtasks(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a list of 3-5 clear, actionable subtasks for the task: "${title}". Return as a JSON array of strings. Language: ${
            language === "ar" ? "Arabic" : "English"
          }.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
        }),
      });

      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const generated = JSON.parse(data.text || "[]");
      const newSubtasks = generated.map((tStr: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: tStr,
        completed: false,
      }));
      setSubtasks((prev) => [...prev, ...newSubtasks]);
      addNotification(
        language === "ar"
          ? "تم إنشاء المهام الفرعية بنجاح"
          : "Subtasks generated successfully",
        "success"
      );
    } catch (err) {
      console.error(err);
      addNotification(
        language === "ar"
          ? "فشل إنشاء المهام الفرعية"
          : "Failed to generate subtasks",
        "error"
      );
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(
        { id },
        {
          onSuccess: () => {
            addNotification(
              language === "ar"
                ? "تم حذف المهمة بنجاح"
                : "Task deleted successfully",
              "success"
            );
            onSuccess();
            onClose();
          },
        }
      );
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const formData = new FormData(formEl);

    const isToday = dueDate === format(new Date(), "yyyy-MM-dd");

    const taskData = {
      title,
      description: formData.get("description"),
      status: formData.get("status") || "todo",
      priority: priority || "medium",
      scheduled_time: formData.get("start_time"),
      estimated_min: parseInt(formData.get("duration") as string) || 25,
      due_date: dueDate,
      subtasks: subtasks,
      daily_schedule: isToday ? dueDate : null,
      category: "work",
      xp_reward: 20,
      project_id: selectedProjectId || null,
    };

    if (editingTask) {
      updateTask(
        { id: editingTask.id, data: taskData },
        {
          onSuccess: () => {
            addNotification(t("task_updated"), "success");
            onSuccess();
            onClose();
          },
        }
      );
    } else {
      createTask(
        { data: taskData },
        {
          onSuccess: (newTask: any) => {
            addNotification(t("task_added"), "success");
            onSuccess();
            onClose();
          },
          onError: (error: any) => {
            console.error("Task Creation Error:", error);
            addNotification(
              error.message === "User not found"
                ? t("please_login")
                : t("error_saving_task"),
              "error"
            );
          },
        }
      );
    }
  };

  if (!isAdding && !editingTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-bg-primary border border-border rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold font-display text-text-primary">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>
            <button
              onClick={onClose}
              className="p-3 bg-bg-secondary rounded-2xl hover:scale-110 transition-transform"
            >
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>

          <form onSubmit={handleSaveTask} className="space-y-8 pb-12">
            <div className="space-y-4">
              <input
                id="task-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task Title"
                required
                className="w-full bg-transparent border-none text-3xl font-bold font-display placeholder:text-text-secondary/20 focus:ring-0 p-0 text-text-primary"
              />

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                    Subtasks
                  </label>
                  <button
                    type="button"
                    onClick={generateSubtasks}
                    disabled={isGeneratingSubtasks}
                    className="text-xs font-bold text-accent hover:opacity-80 flex items-center gap-1.5 bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/20 disabled:opacity-50"
                  >
                    {isGeneratingSubtasks ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                    Generate Steps
                  </button>
                </div>

                <div className="space-y-3">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-bg-secondary/30 border border-border/50 group hover:border-accent/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSubtask(st.id)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            st.completed ? "bg-accent border-accent" : "border-border"
                          }`}
                        >
                          {st.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                        <span
                          className={`text-sm font-medium ${
                            st.completed
                              ? "text-text-secondary line-through"
                              : "text-text-primary"
                          }`}
                        >
                          {st.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-text-secondary hover:text-red-500 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="relative group/input">
                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within/input:text-accent" />
                    <input
                      type="text"
                      placeholder="Add next step..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            setSubtasks((prev) => [
                              ...prev,
                              {
                                id: Math.random().toString(36).substr(2, 9),
                                title: val,
                                completed: false,
                              },
                            ]);
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                      className="w-full bg-bg-secondary/30 border border-border hover:border-accent/30 rounded-2xl py-3 pl-12 pr-4 text-sm text-text-primary outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
              </div>

              <textarea
                name="description"
                defaultValue={editingTask?.description}
                placeholder="Add reflections or notes..."
                className="w-full bg-transparent border-none text-lg text-text-secondary placeholder:text-text-secondary/20 focus:ring-0 p-0 resize-none min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                  {language === 'ar' ? 'الأولوية' : 'Priority'}
                </label>
                <div className="flex items-center gap-2 bg-bg-secondary/30 p-2 rounded-2xl border border-border">
                  {[
                    { val: "low", label: language === 'ar' ? "سهل" : "Low", activeColor: "bg-green-500 text-white border-green-500 shadow-sm", inactiveColor: "bg-green-500/5 text-green-500 border-green-500/10 hover:bg-green-500/10" },
                    { val: "medium", label: language === 'ar' ? "متوسط" : "Medium", activeColor: "bg-amber-500 text-white border-amber-500 shadow-sm", inactiveColor: "bg-amber-500/5 text-amber-500 border-amber-500/10 hover:bg-amber-500/10" },
                    { val: "high", label: language === 'ar' ? "عاجل" : "High", activeColor: "bg-red-500 text-white border-red-500 shadow-sm", inactiveColor: "bg-red-500/5 text-red-500 border-red-500/10 hover:bg-red-500/10" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setPriority(p.val)}
                      className={`flex-1 py-2 px-1 text-center rounded-xl font-bold text-xs border transition-all ${
                        priority === p.val ? p.activeColor : p.inactiveColor
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDueDate(format(new Date(), "yyyy-MM-dd"))}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        dueDate === format(new Date(), "yyyy-MM-dd")
                          ? "bg-accent/20 text-accent"
                          : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {language === 'ar' ? 'اليوم' : 'Today'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDueDate(format(addDays(new Date(), 1), "yyyy-MM-dd"))}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        dueDate === format(addDays(new Date(), 1), "yyyy-MM-dd")
                          ? "bg-accent/20 text-accent"
                          : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {language === 'ar' ? 'غداً' : 'Tomorrow'}
                    </button>
                  </div>
                </div>
                <input
                  name="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-bg-secondary/30 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-6 bg-bg-secondary/20 p-6 rounded-3xl border border-border">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                Schedule & Pomodoro
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Start Time
                  </label>
                  <input
                    name="start_time"
                    type="time"
                    defaultValue={editingTask?.scheduled_time || "09:00"}
                    className="w-full bg-bg-primary border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">
                    Duration Min
                  </label>
                  <input
                    name="duration"
                    type="number"
                    defaultValue={editingTask?.estimated_min || 45}
                    className="w-full bg-bg-primary border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                Status
              </label>
              <select
                name="status"
                defaultValue={editingTask?.status || "todo"}
                className="w-full bg-bg-secondary/30 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all appearance-none text-sm font-bold"
              >
                <option value="draft">📋 Draft</option>
                <option value="todo">📌 To Do</option>
                <option value="in_progress">⚡ Doing</option>
                <option value="done">✅ Done</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1 flex items-center gap-1.5 hover:text-accent transition-colors">
                <span className="text-accent text-sm">@</span>
                <span>{language === "ar" ? "المشروع المرتبط" : "Linked Project"}</span>
              </label>
              <div className="relative">
                <select
                  name="project_id"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-bg-secondary/30 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all appearance-none text-sm font-bold cursor-pointer"
                >
                  <option value="">{language === "ar" ? "🚫 بدون مشروع" : "None"}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.title || p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-text-secondary bg-bg-secondary hover:bg-bg-secondary/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-[2] bg-accent text-white py-4 rounded-2xl font-bold shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isCreating || isUpdating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : editingTask ? (
                    "Update Challenge"
                  ) : (
                    "Launch Challenge"
                  )}
                </button>
              </div>
              {editingTask && (
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id)}
                  className="w-full py-4 rounded-2xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
