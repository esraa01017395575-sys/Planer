import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import {
  useGetTasks,
  useUpdateTask,
  useCreateTask,
  useCompleteTask,
  useRecordPomodoroSession,
} from "../lib/hooks";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { supabase } from "../lib/supabase";

const getFormattedDate = (date: Date, lang: string) => {
  if (lang === "ar") {
    try {
      const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
      return new Intl.DateTimeFormat("ar-EG", options).format(date);
    } catch (e) {
      console.error("Intl formatting support missing", e);
    }
  }
  return format(date, "dd MMMM");
};

const getFormattedDayName = (date: Date, lang: string) => {
  if (lang === "ar") {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: "long" };
      return new Intl.DateTimeFormat("ar-EG", options).format(date);
    } catch (e) {
      console.error("Intl formatting support missing", e);
    }
  }
  return format(date, "EEEE");
};
import {
  Play,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronRight,
  Zap,
  Circle,
  XCircle,
  Settings,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
} from "date-fns";
import { FullScreenPomodoro } from "../components/FullScreenPomodoro";
import { TaskItemCard } from "../components/TaskItemCard";
import { TaskFormSheet } from "../components/TaskFormSheet";
import { MiniFloatingPomodoro } from "../components/MiniFloatingPomodoro";

const DroppableAny = Droppable as any;

export const Tasks = ({ currentUser }: any) => {
  const { t, language, addNotification } = useAppContext();
  const { data: tasksData, loading: isLoading, refetch } = useGetTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: completeTask } = useCompleteTask();
  const { mutate: createTask } = useCreateTask();

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

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await supabase.from("projects").select("id, name");
        if (data) {
          setProjects(data);
        }
      } catch (err) {
        console.error("Error fetching projects in Tasks:", err);
      }
    };
    fetchProjects();
  }, []);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((proj) => {
      if (proj.id && proj.name) {
        map[proj.id] = proj.name;
      }
    });
    return map;
  }, [projects]);

  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(false);
  const [isFullScreenPomodoroOpen, setIsFullScreenPomodoroOpen] =
    useState(false);
  const [pomodoroStartTask, setPomodoroStartTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (tasksData) {
      const sorted = [...tasksData].sort((a, b) => {
        const timeA = a.scheduled_time || "00:00";
        const timeB = b.scheduled_time || "00:00";
        return timeA.localeCompare(timeB);
      });
      setTasks(sorted);
    }
  }, [tasksData]);

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
          "success"
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
    
    // Check if task is moved from yesterday's pending column (draft) to any active column
    const isMovingFromYesterday = source.droppableId === "draft" && destination.droppableId !== "draft";
    const updateData: any = { status: newStatus };
    if (isMovingFromYesterday) {
      updateData.due_date = format(new Date(), "yyyy-MM-dd");
    }

    const updatedTasks = tasks.map((t) =>
      t.id === draggableId ? { ...t, ...updateData } : t
    );
    setTasks(updatedTasks);

    if (newStatus === "done") {
      completeTask(
        { id: draggableId },
        {
          onSuccess: () => {
            addNotification(t("task_completed_xp"), "success");
            refetch(true);
          },
          onError: () => {
            addNotification(t("error_saving_task"), "error");
            setTasks(tasks);
          },
        }
      );
    } else {
      updateTask(
        { id: draggableId, data: updateData },
        {
          onSuccess: () => refetch(true),
          onError: () => {
            addNotification(t("error_saving_task"), "error");
            setTasks(tasks);
          },
        }
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

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const isShowingToday = isSameDay(selectedDate, new Date());

    result = result.filter((t) => {
      const cleanDue = t.due_date ? String(t.due_date).trim().slice(0, 10) : null;
      const cleanSched = t.daily_schedule ? String(t.daily_schedule).trim().slice(0, 10) : null;

      // 1. Exact date match (due_date or daily_schedule)
      if (cleanDue === dateStr || cleanSched === dateStr) {
        return true;
      }

      // 2. Overdue or no-due-date tasks if viewing today
      if (isShowingToday) {
        if (t.status !== "done" && t.status !== "cancelled") {
          if (!cleanDue) return true; // No due date
          if (cleanDue < dateStr) return true; // Overdue
        }
      }

      // 3. Match creation date if no due date specified
      if (!cleanDue && t.created_at && isSameDay(selectedDate, new Date(t.created_at))) {
        return true;
      }

      return false;
    });

    if (searchQuery) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return [...result].sort((a, b) => {
      const dateA = a.due_date || "9999-12-31";
      const dateB = b.due_date || "9999-12-31";
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = a.scheduled_time || "23:59";
      const timeB = b.scheduled_time || "23:59";
      return timeA.localeCompare(timeB);
    });
  }, [tasks, searchQuery, selectedDate]);

  const handleStatusChange = (id: string, newStatus: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    updateTask(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          addNotification(`Status updated to ${newStatus}`, "success");
          refetch(true);
        },
        onError: () => {
          addNotification("Failed to update status", "error");
          setTasks(tasks);
        },
      }
    );
  };

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

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 flex-1 lg:max-w-xl">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="p-3 bg-bg-secondary border border-border text-text-secondary hover:text-accent hover:border-accent rounded-2xl transition-all shadow-sm active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>

              <div className="flex flex-col items-center min-w-[140px] relative cursor-pointer group">
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) {
                      const parts = e.target.value.split("-");
                      const picked = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                      setSelectedDate(picked);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                />
                <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">
                  {isSameDay(selectedDate, new Date())
                    ? (language === "ar" ? "اليوم" : t("today"))
                    : getFormattedDate(selectedDate, language)}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent opacity-80 mt-1 group-hover:underline">
                  {getFormattedDayName(selectedDate, language)} 📅
                </span>
              </div>

              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-3 bg-bg-secondary border border-border text-text-secondary hover:text-accent hover:border-accent rounded-2xl transition-all shadow-sm active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {!isSameDay(selectedDate, new Date()) && (
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                }}
                className="text-xs font-bold text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-xl hover:bg-accent/20 transition-all shrink-0 cursor-pointer"
              >
                {language === "ar" ? "العودة لليوم ↩" : "Back to Today"}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              isFocusMode
                ? "bg-orange-500/10 border-orange-500 text-orange-500"
                : "bg-bg-secondary border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            <Zap className={`w-4 h-4 ${isFocusMode ? "fill-current" : ""}`} />
            Focus Mode
          </button>

          <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setView("kanban")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                view === "kanban"
                  ? "bg-accent text-white shadow-lg shadow-accent/20"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                view === "calendar"
                  ? "bg-accent text-white shadow-lg shadow-accent/20"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsAdding(true);
            }}
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
              const columnTasks = filteredTasks.filter((t) => {
                const cleanDue = t.due_date ? String(t.due_date).trim().slice(0, 10) : null;
                const isOverdue = cleanDue && cleanDue < format(selectedDate, "yyyy-MM-dd") && t.status !== "done" && t.status !== "cancelled";
                const hasNoDueDate = !cleanDue && t.status !== "done" && t.status !== "cancelled";

                if (column.id === "draft") {
                  return t.status === "draft" || isOverdue || hasNoDueDate;
                }

                return t.status === column.id && !isOverdue && !hasNoDueDate;
              });
              const isDoing = column.id === "in_progress";
              const isFaded = isFocusMode && !isDoing;

              return (
                <div
                  key={column.id}
                  className={`flex flex-col flex-shrink-0 w-full md:w-[340px] md:snap-center space-y-5 h-full min-h-0 p-4 rounded-3xl transition-opacity duration-500 ${
                    column.bg
                  } ${
                    isFaded
                      ? "opacity-30 grayscale blur-[1px] pointer-events-none"
                      : "opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between px-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                          isDoing
                            ? "bg-orange-500 text-white animate-pulse"
                            : "bg-bg-secondary text-text-secondary"
                        }`}
                      >
                        {column.icon}
                      </div>
                      <h2
                        className={`text-sm font-bold uppercase tracking-widest ${
                          isDoing ? "text-orange-500" : "text-text-secondary"
                        }`}
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
                        {columnTasks.map((task, index) => (
                          <TaskItemCard
                            key={task.id}
                            task={task}
                            index={index}
                            projectMap={projectMap}
                            onEdit={(t) => {
                              setEditingTask(t);
                              setIsAdding(false);
                            }}
                            onStatusChange={handleStatusChange}
                            onStartPomodoro={(t) => {
                              if (t.status === "todo") {
                                handleStatusChange(t.id, "in_progress");
                              }
                              setPomodoroTime(t.estimated_min ? t.estimated_min * 60 : 25 * 60);
                              setInitialPomodoroTime(t.estimated_min ? t.estimated_min * 60 : 25 * 60);
                              setActivePomodoro(t);
                              setPomodoroStartTask(t);
                              setIsFullScreenPomodoroOpen(true);
                              setIsPomodoroRunning(true);
                            }}
                            onDeleted={(id) => {
                              setTasks((prev) => prev.filter((tk) => tk.id !== id));
                            }}
                          />
                        ))}

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
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      if (quickAddTitle.trim()) {
                                        createTask(
                                          {
                                            data: {
                                              title: quickAddTitle.trim(),
                                              status: column.id,
                                              priority: "medium",
                                              user_id: currentUser.id,
                                              due_date: format(selectedDate, "yyyy-MM-dd"),
                                            },
                                          },
                                          {
                                            onSuccess: (newTask: any) => {
                                              setTasks((prev) => [newTask, ...prev]);
                                              setQuickAddColumn(null);
                                              setQuickAddTitle("");
                                              addNotification(
                                                "Task added quick!",
                                                "success"
                                              );
                                            },
                                          }
                                        );
                                      }
                                    } else if (e.key === "Escape") {
                                      e.preventDefault();
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
                            ) : null}
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
                const targetStr = format(date, "yyyy-MM-dd");
                const dayTasks = tasks.filter((t) => {
                  const cleanDue = t.due_date ? String(t.due_date).trim().slice(0, 10) : null;
                  const cleanSched = t.daily_schedule ? String(t.daily_schedule).trim().slice(0, 10) : null;
                  return cleanDue === targetStr || cleanSched === targetStr;
                });
                const isCurrentMonth =
                  date.getMonth() === selectedDate.getMonth();
                const isToday = isSameDay(date, new Date());

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[120px] p-2 border-r border-b border-border last:border-r-0 flex flex-col gap-1 transition-all cursor-pointer hover:bg-bg-primary/40 ${
                      !isCurrentMonth ? "opacity-20 grayscale" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20 scale-105"
                            : "text-text-secondary"
                        }`}
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
      <MiniFloatingPomodoro
        activePomodoro={activePomodoro}
        isPomodoroMinimized={isPomodoroMinimized}
        pomodoroPhase={pomodoroPhase}
        pomodoroTime={pomodoroTime}
        isPomodoroRunning={isPomodoroRunning}
        setIsPomodoroRunning={setIsPomodoroRunning}
        setIsPomodoroMinimized={setIsPomodoroMinimized}
        onClose={() => setActivePomodoro(null)}
      />

      {/* Slide-out flyout Task Details & Edit Panel */}
      <AnimatePresence>
        {(isAdding || editingTask) && (
          <TaskFormSheet
            currentUser={currentUser}
            editingTask={editingTask}
            isAdding={isAdding}
            onClose={() => {
              setEditingTask(null);
              setIsAdding(false);
            }}
            onSuccess={() => {
              refetch(true);
            }}
          />
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
