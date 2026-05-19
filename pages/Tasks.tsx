import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import {
  useGetTasks,
  useUpdateTask,
  useCreateTask,
  useDeleteTask,
  useCompleteTask,
  useRecordPomodoroSession,
  useToggleFavorite,
  useGetFavorites,
} from "../lib/hooks";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProps,
  DraggableProps,
} from "@hello-pangea/dnd";
import {
  Star,
  MessageCircleQuestion,
  Play,
  MoreHorizontal,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  Sparkles,
  Timer,
  Pause,
  RotateCcw,
  ChevronRight,
  Settings,
  Flag,
  Minus,
  Search,
  GripVertical,
  Check,
  ChevronDown,
  Zap,
  Circle,
  FileText,
  XCircle,
  ArrowUpRight,
  ArrowRight,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Router, Route, Switch, Redirect, useLocation } from "wouter";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  addMinutes,
  isWithinInterval,
} from "date-fns";
import { FullScreenPomodoro } from "../components/FullScreenPomodoro";

const DroppableAny = Droppable as any;
const DraggableAny = Draggable as any;

export const Tasks = ({ currentUser }: any) => {
  const { t, language, addNotification } = useAppContext();
  const { data: tasksData, loading: isLoading, refetch } = useGetTasks();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: completeTask } = useCompleteTask();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [view, setView] = useState<"kanban" | "calendar">("kanban");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activePomodoro, setActivePomodoro] = useState<any>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [initialPomodoroTime, setInitialPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState<"work" | "break">("work");
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const { mutate: recordPomodoro } = useRecordPomodoroSession();
  const { data: favoritesData, refetch: refetchFavorites } = useGetFavorites();
  const { toggleFavorite } = useToggleFavorite();
  const [reflectionText, setReflectionText] = useState<Record<string, string>>(
    {},
  );
  const [showReflectionId, setShowReflectionId] = useState<string | null>(null);

  const isFavorited = (id: string) =>
    favoritesData?.some((f) => f.source_id === id);
  const getFavorite = (id: string) =>
    favoritesData?.find((f) => f.source_id === id);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isFullScreenPomodoroOpen, setIsFullScreenPomodoroOpen] =
    useState(false);
  const [pomodoroStartTask, setPomodoroStartTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (tasksData) {
      // Sort tasks by scheduled_time ascending
      const sorted = [...tasksData].sort((a, b) => {
        const timeA = a.scheduled_time || "00:00";
        const timeB = b.scheduled_time || "00:00";
        return timeA.localeCompare(timeB);
      });
      setTasks(sorted);
    }
  }, [tasksData]);

  useEffect(() => {
    if (editingTask) {
      // Sync subtasks only if we're not transitioning from an AI-generated set
      if (
        subtasks.length === 0 ||
        (editingTask.subtasks &&
          editingTask.subtasks.length > 0 &&
          subtasks.every((st) => !st.id.toString().includes("-")))
      ) {
        setSubtasks(editingTask.subtasks || []);
      }
    } else if (!isAdding) {
      setSubtasks([]);
    }
  }, [editingTask, isAdding]);

  useEffect(() => {
    let interval: any;
    if (isPomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (isPomodoroRunning && pomodoroTime === 0) {
      if (pomodoroPhase === "work") {
        const newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
        const isDeepWork = initialPomodoroTime >= 50 * 60;
        const breakTime =
          newCount % 4 === 0 ? (isDeepWork ? 20 : 15) : isDeepWork ? 10 : 5;

        recordPomodoro({
          task_id: activePomodoro?.id,
          duration_minutes: Math.round(initialPomodoroTime / 60),
        });
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Focus Complete", { body: "Time for a break!" });
        }

        setPomodoroPhase("break");
        setPomodoroTime(breakTime * 60);
        addNotification(
          `Work session complete! Take a ${breakTime} min break.`,
          "success",
        );
      } else {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Break Complete", { body: "Ready to focus again?" });
        }
        setPomodoroPhase("work");
        setPomodoroTime(initialPomodoroTime);
        setIsPomodoroRunning(false);
        addNotification("Break over! Back to work.", "success");
      }
    }
    return () => clearInterval(interval);
  }, [
    isPomodoroRunning,
    pomodoroTime,
    pomodoroPhase,
    pomodoroCount,
    initialPomodoroTime,
    activePomodoro,
    addNotification,
    recordPomodoro,
  ]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const updatedTasks = tasks.map((t) =>
      t.id === draggableId ? { ...t, status: newStatus } : t,
    );
    setTasks(updatedTasks);

    if (newStatus === "done") {
      completeTask(
        { id: draggableId },
        {
          onSuccess: () => {
            addNotification(t("task_completed_xp"), "success");
            refetch();
          },
          onError: () => {
            addNotification(t("error_saving_task"), "error");
            setTasks(tasks);
          },
        },
      );
    } else {
      updateTask(
        { id: draggableId, data: { status: newStatus } },
        {
          onSuccess: () => refetch(),
          onError: () => {
            addNotification(t("error_saving_task"), "error");
            setTasks(tasks); // Revert
          },
        },
      );
    }
  };

  const columns = [
    {
      id: "draft",
      title: "Pending from yesterday",
      icon: <Clock className="w-4 h-4" />,
      bg: "bg-amber-500/5",
    },
    {
      id: "todo",
      title: "📌 TO DO",
      icon: <Circle className="w-4 h-4" />,
      bg: "bg-slate-500/5",
    },
    {
      id: "in_progress",
      title: "⚡ DOING",
      icon: <Zap className="w-4 h-4" />,
      bg: "bg-orange-500/10",
    },
    {
      id: "done",
      title: "✅ DONE",
      icon: <CheckCircle2 className="w-4 h-4" />,
      bg: "bg-emerald-500/5",
    },
    {
      id: "cancelled",
      title: "🚫 CANCELLED",
      icon: <XCircle className="w-4 h-4" />,
      bg: "bg-red-500/5",
    },
  ];

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by selected date
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    result = result.filter(
      (t) =>
        t.due_date === dateStr ||
        (!t.due_date && isSameDay(selectedDate, new Date(t.created_at))),
    );

    if (searchQuery) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort by proximity: due_date then scheduled_time
    return [...result].sort((a, b) => {
      const dateA = a.due_date || "9999-12-31";
      const dateB = b.due_date || "9999-12-31";
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = a.scheduled_time || "23:59";
      const timeB = b.scheduled_time || "23:59";
      return timeA.localeCompare(timeB);
    });
  }, [tasks, searchQuery]);

  const handleStatusChange = (id: string, newStatus: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, status: newStatus } : t,
    );
    setTasks(updatedTasks);

    updateTask(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          addNotification(`Status updated to ${newStatus}`, "success");
          refetch();
        },
        onError: () => {
          addNotification("Failed to update status", "error");
          setTasks(tasks); // Revert
        },
      },
    );
  };

  const handleAIAction = async (
    task: any,
    action: "star" | "help" | "deep_help",
  ) => {
    if (action === "deep_help") {
      const prompt = `how to do ${task.title} in the best way?`;
      setLocation(`/chat?prompt=${encodeURIComponent(prompt)}`);
      return;
    }

    addNotification(
      action === "star"
        ? "AI is reviewing your task..."
        : "AI is figuring out steps...",
      "info",
    );
    try {
      const prompt =
        action === "star"
          ? `Given the task "${task.title}" and description "${task.description}", give a very short motivational optimization tip (10 words max).`
          : `Given the task "${task.title}", what are the 3 critical first steps to start? Return as a short list.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const text = data.text || "Could not generate AI response.";
      addNotification(text, "success");
    } catch (err) {
      console.error(err);
      addNotification("AI interaction failed", "error");
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(
        { id },
        {
          onSuccess: () => {
            addNotification("Task deleted successfully", "success");
            setTasks(tasks.filter((t) => t.id !== id));
            setEditingTask(null);
          },
        },
      );
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const dueDate =
      formData.get("due_date") || format(new Date(), "yyyy-MM-dd");
    const isToday = dueDate === format(new Date(), "yyyy-MM-dd");

    const memoryNote = formData.get("memory_note") as string;

    const taskData = {
      title: formData.get("title"),
      description: formData.get("description"),
      memory_note: memoryNote,
      status: formData.get("status") || "todo",
      priority: formData.get("priority") || "medium",
      scheduled_time: formData.get("start_time"),
      estimated_min: parseInt(formData.get("duration") as string) || 25,
      due_date: dueDate,
      subtasks: subtasks,
      daily_schedule: isToday ? dueDate : null, // Store date string instead of boolean to match DB column type
      category: "work", // Default category as it's required in schema
      xp_reward: 20,
    };

    if (editingTask) {
      updateTask(
        { id: editingTask.id, data: taskData },
        {
          onSuccess: () => {
            if (memoryNote && memoryNote.trim().length > 0) {
              toggleFavorite({
                type: "task",
                item_id: editingTask.id,
                title: taskData.title as string,
                content: memoryNote,
                metadata: {
                  priority: taskData.priority,
                  scheduled_time: taskData.scheduled_time,
                },
              });
            }
            addNotification(t("task_updated"), "success");
            setEditingTask(null);
            refetch();
          },
        },
      );
    } else {
      createTask(
        { data: taskData },
        {
          onSuccess: (newTask: any) => {
            if (memoryNote && memoryNote.trim().length > 0 && newTask?.id) {
              toggleFavorite({
                type: "task",
                item_id: newTask.id,
                title: taskData.title as string,
                content: memoryNote,
                metadata: {
                  priority: taskData.priority,
                  scheduled_time: taskData.scheduled_time,
                },
              });
            }
            addNotification(t("task_added"), "success");
            setIsAdding(false);
            refetch();
          },
          onError: (error: any) => {
            console.error("Task Creation Error:", error);
            addNotification(
              error.message === "User not found"
                ? t("please_login")
                : t("error_saving_task"),
              "error",
            );
          },
        },
      );
    }
  };

  const generateSubtasks = async () => {
    const title = (document.getElementsByName("title")[0] as HTMLInputElement)
      ?.value;
    if (!title) {
      addNotification("يرجى إدخال عنوان المهمة أولاً", "error");
      return;
    }

    setIsGeneratingSubtasks(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a list of 3-5 clear, actionable subtasks for the task: "${title}". Return as a JSON array of strings. Language: ${language === "ar" ? "Arabic" : "English"}.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY", // Note: passed as string in JSON usually, or just use responseMimeType
              items: { type: "STRING" },
            },
          },
        }),
      });

      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const generated = JSON.parse(data.text || "[]");
      const newSubtasks = generated.map((title: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        title,
        completed: false,
      }));
      setSubtasks([...subtasks, ...newSubtasks]);
      addNotification("تم إنشاء المهام الفرعية بنجاح", "success");
    } catch (err) {
      console.error(err);
      addNotification("فشل إنشاء المهام الفرعية", "error");
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const toggleSubtaskVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st,
      ),
    );
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const dateStrip = useMemo(() => {
    const dates = [];
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    for (let i = -7; i < 14; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  }, [selectedDate]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4 lg:space-y-8 animate-in fade-in duration-500 overflow-hidden px-2 lg:px-0">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 pb-2">
        <div className="flex items-center gap-6 flex-1">
          <div className="hidden md:block">
            <h1 className="text-3xl font-display font-bold text-text-primary tracking-tight">
              {t("tasks")}
            </h1>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest opacity-60">
              Flow Console
            </p>
          </div>

          {/* Date Selection Strip */}
          <div className="flex items-center justify-center gap-8 flex-1 lg:max-w-xl">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-3 bg-bg-secondary border border-border text-text-secondary hover:text-accent hover:border-accent rounded-2xl transition-all shadow-sm active:scale-90"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>

            <div className="flex flex-col items-center min-w-[120px]">
              <h3 className="text-xl font-bold text-text-primary">
                {isSameDay(selectedDate, new Date())
                  ? t("today")
                  : format(selectedDate, "dd MMMM")}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent opacity-80 mt-1">
                {format(selectedDate, "EEEE")}
              </span>
            </div>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-3 bg-bg-secondary border border-border text-text-secondary hover:text-accent hover:border-accent rounded-2xl transition-all shadow-sm active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${isFocusMode ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-bg-secondary border-border text-text-secondary hover:text-text-primary"}`}
          >
            <Zap className={`w-4 h-4 ${isFocusMode ? "fill-current" : ""}`} />
            Focus Mode
          </button>

          <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setView("kanban")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === "kanban" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:text-text-primary"}`}
            >
              <Settings className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === "calendar" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:text-text-primary"}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="bg-accent text-accent-foreground px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>
      </header>

      {view === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 flex overflow-x-auto gap-8 min-h-0 pb-4 no-scrollbar scroll-smooth snap-x">
            {columns.map((column) => {
              const columnTasks = filteredTasks.filter(
                (t) => t.status === column.id,
              );
              const isDoing = column.id === "in_progress";
              const isDone = column.id === "done";
              const isFaded = isFocusMode && !isDoing;

              return (
                <div
                  key={column.id}
                  className={`flex flex-col flex-shrink-0 w-full md:w-[340px] md:snap-center space-y-5 h-full min-h-0 p-4 rounded-3xl transition-opacity duration-500 ${column.bg} ${isFaded ? "opacity-30 grayscale blur-[1px] pointer-events-none" : "opacity-100"}`}
                >
                  <div className="flex items-center justify-between px-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${isDoing ? "bg-orange-500 text-white animate-pulse" : "bg-bg-secondary text-text-secondary"}`}
                      >
                        {column.icon}
                      </div>
                      <h2
                        className={`text-sm font-bold uppercase tracking-widest ${isDoing ? "text-orange-500" : "text-text-secondary"}`}
                      >
                        {column.title === "DOING"
                          ? "Active Focus"
                          : column.title}
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-text-secondary bg-bg-secondary/80 px-2.5 py-1 rounded-lg border border-border/50">
                      {columnTasks.length}
                    </span>
                  </div>

                  <DroppableAny droppableId={column.id}>
                    {(provided: any) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 space-y-4 p-2 rounded-2xl bg-bg-secondary/30 border border-dashed border-border/50 overflow-y-auto no-scrollbar"
                      >
                        {columnTasks.map((task, index) => {
                          const isDoingStatus = task.status === "in_progress";
                          const isDoneStatus = task.status === "done";

                          return (
                            <DraggableAny
                              draggableId={task.id.toString()}
                              index={index}
                              key={task.id}
                            >
                              {(draggableProvided: any) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  className="group relative"
                                >
                                  <motion.div
                                    onClick={() => setEditingTask(task)}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className={`glass-card p-5 border-l-[6px] transition-all duration-300 relative overflow-hidden group/card ${
                                      isDoingStatus
                                        ? "border-orange-500 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
                                        : isDoneStatus
                                          ? "border-emerald-500 opacity-60"
                                          : "border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Flag
                                          className={`w-4 h-4 ${
                                            task.priority === "high"
                                              ? "text-red-500 fill-red-500"
                                              : task.priority === "medium"
                                                ? "text-blue-500"
                                                : "text-emerald-500"
                                          }`}
                                        />
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite({
                                              type: "task",
                                              item_id: task.id,
                                              title: task.title,
                                              content: task.description,
                                              metadata: {
                                                priority: task.priority,
                                                scheduled_time:
                                                  task.scheduled_time,
                                              },
                                            })
                                              .then((res) => {
                                                if (res.added) {
                                                  addNotification(
                                                    t("favorite_added"),
                                                    "success",
                                                  );
                                                  setShowReflectionId(task.id);
                                                } else {
                                                  addNotification(
                                                    t("favorite_removed"),
                                                    "info",
                                                  );
                                                  setShowReflectionId(null);
                                                }
                                                refetchFavorites();
                                              })
                                              .catch(() => {
                                                addNotification(
                                                  t("error_saving_favorite"),
                                                  "error",
                                                );
                                              });
                                          }}
                                          className={`p-1 transition-colors ${isFavorited(task.id) ? "text-red-500" : "text-text-secondary hover:text-red-500"}`}
                                          title="Add to Favorites"
                                        >
                                          <Heart
                                            className={`w-3.5 h-3.5 ${isFavorited(task.id) ? "fill-current" : ""}`}
                                          />
                                        </button>
                                        <div className="p-1 text-text-secondary">
                                          <GripVertical className="w-3.5 h-3.5 cursor-grab" />
                                        </div>
                                      </div>
                                    </div>

                                    <h3
                                      className={`text-lg font-bold text-text-primary leading-snug mb-3 group-hover/card:text-accent transition-colors ${isDoneStatus ? "line-through opacity-50" : ""}`}
                                    >
                                      {task.title}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4">
                                      <div className="flex items-center gap-1.5 text-text-secondary">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-xs font-mono font-bold">
                                          {task.scheduled_time
                                            ? format(
                                                parseISO(
                                                  `2000-01-01T${task.scheduled_time}`,
                                                ),
                                                "hh:mm a",
                                              )
                                            : "09:00 AM"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-text-secondary">
                                        <Timer className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">
                                          {task.estimated_min || 45}m
                                        </span>
                                      </div>
                                    </div>

                                    {task.subtasks?.length > 0 && (
                                      <div className="space-y-1.5 py-3 border-t border-border/30">
                                        {task.subtasks
                                          .slice(0, 2)
                                          .map((st: any) => (
                                            <div
                                              key={st.id}
                                              className="flex items-center gap-2 text-[11px] text-text-secondary"
                                            >
                                              <div
                                                className={`w-3 h-3 rounded-full border ${st.completed ? "bg-accent border-accent" : "border-border"}`}
                                              >
                                                {st.completed && (
                                                  <Check className="w-2 h-2 text-white mx-auto" />
                                                )}
                                              </div>
                                              <span
                                                className={`line-clamp-1 ${st.completed ? "line-through opacity-40" : ""}`}
                                              >
                                                {st.title}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    )}

                                    <AnimatePresence>
                                      {(isFavorited(task.id) ||
                                        showReflectionId === task.id) && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="pt-3 mt-1 border-t border-border/30 space-y-2 pb-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                                              🧠 Memory Reflection
                                            </label>
                                            <textarea
                                              placeholder="Add reflections or notes..."
                                              defaultValue={
                                                getFavorite(task.id)?.content ||
                                                ""
                                              }
                                              onBlur={(e) => {
                                                const val = e.target.value;
                                                toggleFavorite(
                                                  {
                                                    type: "task",
                                                    item_id: task.id,
                                                    title: task.title,
                                                    content: task.description,
                                                  },
                                                  val,
                                                ).then(() => {
                                                  refetchFavorites();
                                                });
                                              }}
                                              className="w-full bg-accent/5 border border-dashed border-accent/20 rounded-xl p-3 text-[11px] text-text-primary placeholder:text-accent/30 focus:ring-0 focus:border-accent transition-all resize-none min-h-[60px]"
                                            />
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/30 relative">
                                      <div className="flex gap-2">
                                        {task.status === "draft" ? (
                                          <>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingTask(task);
                                              }}
                                              className="bg-accent/10 text-accent px-3 py-2 rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-all shadow-sm border border-accent/20"
                                            >
                                              {t("reschedule")}
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(
                                                  task.id,
                                                  "cancelled",
                                                );
                                              }}
                                              className="bg-red-500/10 text-red-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"
                                            >
                                              {t("cancel")}
                                            </button>
                                          </>
                                        ) : task.status === "cancelled" ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Delete current and open editing (without id) for new creation
                                              const taskData = { ...task };
                                              deleteTask(
                                                { id: task.id },
                                                {
                                                  onSuccess: () => {
                                                    setTasks(
                                                      tasks.filter(
                                                        (t) => t.id !== task.id,
                                                      ),
                                                    );
                                                    // Open create modal with prefilled data
                                                    setEditingTask(null);
                                                    setIsAdding(true);
                                                    // We need to pass data to the form.
                                                    // Actually, let's just use setEditingTask with a new object but no ID.
                                                    setEditingTask({
                                                      ...taskData,
                                                      id: undefined,
                                                      status: "todo",
                                                    });
                                                  },
                                                },
                                              );
                                            }}
                                            className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all shadow-md border border-red-500/20 flex items-center gap-2"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            {language === "ar"
                                              ? "مسح وإعادة جدولة"
                                              : "Delete & Reschedule"}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (isDoneStatus) return;
                                              if (task.status === "todo") {
                                                handleStatusChange(
                                                  task.id,
                                                  "in_progress",
                                                );
                                              }
                                              setPomodoroStartTask(task);
                                              setIsFullScreenPomodoroOpen(true);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                                              isDoingStatus
                                                ? "bg-orange-500 text-white shadow-orange-500/20 hover:scale-105"
                                                : isDoneStatus
                                                  ? "bg-emerald-100 text-emerald-600 shadow-none cursor-default"
                                                  : "bg-accent text-white shadow-accent/20 hover:scale-105"
                                            }`}
                                          >
                                            <Play className="w-4 h-4 fill-current" />
                                            {t("start_pomodoro")}
                                          </button>
                                        )}
                                      </div>

                                      <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </DraggableAny>
                          );
                        })}

                        {columnTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 text-center opacity-30 border-2 border-dashed border-border/20 rounded-3xl">
                            <Plus className="w-8 h-8 mb-2 text-text-secondary" />
                            <p className="text-sm font-bold">
                              No tasks here 👀
                            </p>
                            <p className="text-[10px] uppercase tracking-widest mt-1">
                              Drag tasks or create one
                            </p>
                          </div>
                        )}
                        {provided.placeholder}

                        {column.id !== "done" && column.id !== "cancelled" && (
                          <div className="mt-2 group/add">
                            {quickAddColumn === column.id ? (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-bg-card border border-accent/30 rounded-2xl p-3 shadow-xl shadow-accent/5 ring-1 ring-accent/10"
                              >
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="What needs to be done?"
                                  value={quickAddTitle}
                                  onChange={(e) =>
                                    setQuickAddTitle(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && quickAddTitle) {
                                      createTask(
                                        {
                                          data: {
                                            title: quickAddTitle,
                                            status: column.id,
                                            priority: "medium",
                                            user_id: currentUser.id,
                                          },
                                        },
                                        {
                                          onSuccess: (newTask: any) => {
                                            setTasks([newTask, ...tasks]);
                                            setQuickAddColumn(null);
                                            setQuickAddTitle("");
                                            addNotification(
                                              "Task added quick!",
                                              "success",
                                            );
                                          },
                                        },
                                      );
                                    } else if (e.key === "Escape") {
                                      setQuickAddColumn(null);
                                      setQuickAddTitle("");
                                    }
                                  }}
                                  className="w-full bg-transparent border-none text-sm font-bold text-text-primary focus:ring-0 placeholder:text-text-secondary/30 p-0"
                                />
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-[9px] font-bold text-text-secondary opacity-40 uppercase tracking-tighter">
                                    Enter to save • Esc to cancel
                                  </span>
                                  <button
                                    onClick={() => setQuickAddColumn(null)}
                                    className="p-1 hover:bg-bg-secondary rounded-md"
                                  >
                                    <X className="w-3 h-3 text-text-secondary" />
                                  </button>
                                </div>
                              </motion.div>
                            ) : (
                              <div /> // Removed "+ Add Challenge" button
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </DroppableAny>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        <div className="flex-1 bg-bg-secondary/30 rounded-[3rem] border border-border overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-border bg-bg-primary/50 backdrop-blur-md">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-text-secondary border-r border-border last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-7">
            {(() => {
              const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
              const calendarDates = [];
              for (let i = 0; i < 35; i++) {
                calendarDates.push(addDays(start, i));
              }
              return calendarDates.map((date, idx) => {
                const dayTasks = tasks.filter(
                  (t) => t.due_date === format(date, "yyyy-MM-dd"),
                );
                const isCurrentMonth =
                  date.getMonth() === selectedDate.getMonth();
                const isToday = isSameDay(date, new Date());

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[120px] p-2 border-r border-b border-border last:border-r-0 flex flex-col gap-1 transition-all cursor-pointer hover:bg-bg-primary/40 ${!isCurrentMonth ? "opacity-20 grayscale" : ""}`}
                  >
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span
                        className={`text-xs font-bold ${isToday ? "w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20 scale-105" : "text-text-secondary"}`}
                      >
                        {format(date, "d")}
                      </span>
                      {dayTasks.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                      {dayTasks.slice(0, 4).map((task) => (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                          }}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold truncate transition-all ${
                            task.status === "done"
                              ? "bg-emerald-500/10 text-emerald-500 line-through"
                              : task.status === "in_progress"
                                ? "bg-orange-500/10 text-orange-500 ring-1 ring-orange-500"
                                : task.status === "cancelled"
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-accent/10 text-accent ring-1 ring-accent/20"
                          }`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 4 && (
                        <div className="text-[8px] font-bold text-text-secondary px-2">
                          + {dayTasks.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Mini Floating Pomodoro */}
      <AnimatePresence>
        {activePomodoro && isPomodoroMinimized && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <div className="glass-card p-4 flex items-center gap-4 bg-bg-card border-border">
              <div className="flex flex-col">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${pomodoroPhase === "work" ? "text-accent" : "text-emerald-500"}`}
                >
                  {pomodoroPhase === "work" ? "Focus" : "Break"}
                </span>
                <span className="font-mono text-lg font-bold text-text-primary">
                  {Math.floor(pomodoroTime / 60)}:
                  {String(pomodoroTime % 60).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-text-secondary max-w-[100px] truncate">
                  {activePomodoro.title}
                </span>
              </div>

              <div className="flex items-center gap-2 border-l border-border pl-4">
                <button
                  onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                  className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/40 hover:scale-105 transition-all"
                >
                  {isPomodoroRunning ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-1" />
                  )}
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setIsPomodoroMinimized(false)}
                    className="p-1.5 rounded-lg bg-bg-secondary text-text-secondary hover:text-text-primary transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setActivePomodoro(null)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:text-white hover:bg-red-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isAdding || editingTask) && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingTask(null);
                setIsAdding(false);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-bg-primary h-full shadow-2xl overflow-y-auto border-l border-border"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold font-display text-text-primary">
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </h2>
                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setIsAdding(false);
                    }}
                    className="p-2 hover:bg-bg-secondary rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-text-secondary" />
                  </button>
                </div>

                <form onSubmit={handleSaveTask} className="space-y-8 pb-12">
                  <div className="space-y-4">
                    <input
                      id="task-title"
                      name="title"
                      defaultValue={editingTask?.title}
                      placeholder="Task Title"
                      required
                      className="w-full bg-transparent border-none text-3xl font-bold font-display placeholder:text-text-secondary/20 focus:ring-0 p-0 text-text-primary"
                    />

                    {/* Subtasks moved here, directly under title */}
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
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${st.completed ? "bg-accent border-accent" : "border-border"}`}
                              >
                                {st.completed && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                )}
                              </button>
                              <span
                                className={`text-sm font-medium ${st.completed ? "text-text-secondary line-through" : "text-text-primary"}`}
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
                                const val = (e.target as HTMLInputElement)
                                  .value;
                                if (val) {
                                  setSubtasks([
                                    ...subtasks,
                                    {
                                      id: Math.random()
                                        .toString(36)
                                        .substr(2, 9),
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

                    <div className="pt-4 border-t border-border/50">
                      <label className="text-[10px] font-black uppercase tracking-widest text-accent mb-2 block">
                        🧠 Memory Reflection (Auto-saves to Favorites)
                      </label>
                      <textarea
                        name="memory_note"
                        defaultValue={editingTask?.memory_note}
                        placeholder="What did you learn? Any key insights to remember?"
                        className="w-full bg-accent/5 border border-dashed border-accent/20 rounded-2xl p-4 text-sm text-text-primary placeholder:text-accent/30 focus:ring-0 focus:border-accent transition-all resize-none min-h-[100px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                        Priority
                      </label>
                      <div className="flex items-center gap-3 bg-bg-secondary/30 p-2.5 rounded-2xl border border-border">
                        {[
                          { val: "low", color: "bg-green-500" },
                          {
                            val: "medium",
                            color: "bg-white border border-border shadow-sm",
                          },
                          { val: "high", color: "bg-red-500" },
                        ].map((p) => (
                          <label key={p.val} className="flex-1 cursor-pointer">
                            <input
                              type="radio"
                              name="priority"
                              value={p.val}
                              defaultChecked={
                                editingTask?.priority === p.val ||
                                (!editingTask && p.val === "medium")
                              }
                              className="peer sr-only"
                            />
                            <div
                              className={`aspect-square rounded-xl flex items-center justify-center transition-all border-2 border-transparent peer-checked:border-accent/40 peer-checked:scale-110 hover:bg-bg-secondary`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full ${p.color}`}
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                        Date
                      </label>
                      <input
                        name="due_date"
                        type="date"
                        defaultValue={
                          editingTask?.due_date ||
                          format(new Date(), "yyyy-MM-dd")
                        }
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

                  <div className="flex flex-col gap-4 pt-4">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(null);
                          setIsAdding(false);
                        }}
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
        )}
      </AnimatePresence>
      <FullScreenPomodoro
        isOpen={isFullScreenPomodoroOpen}
        onClose={() => setIsFullScreenPomodoroOpen(false)}
        initialTask={pomodoroStartTask}
      />
    </div>
  );
};
