import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { playCastSpellSound } from "../lib/audio-magic";
import {
  useGetTasks,
  useUpdateTask,
  useCreateTask,
  useCompleteTask,
  useRecordPomodoroSession,
} from "../lib/hooks";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { supabase } from "../lib/supabase";

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
  Eye,
  EyeOff,
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
import { TaskHeader } from "../components/tasks/TaskHeader";
import { TaskCalendarView } from "../components/tasks/TaskCalendarView";

const DroppableAny = Droppable as any;

export const Tasks = ({ currentUser }: any) => {
  const { t, language, addNotification, startPomodoroGlobal } = useAppContext();
  const { data: tasksData, loading: isLoading, refetch } = useGetTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: completeTask } = useCompleteTask();
  const { mutate: createTask } = useCreateTask();

  const [hideDraftColumn, setHideDraftColumn] = useState<boolean>(() => {
    return localStorage.getItem("hideDraftColumn") === "true";
  });

  const [hideCancelledColumn, setHideCancelledColumn] = useState<boolean>(() => {
    return localStorage.getItem("hideCancelledColumn") === "true";
  });

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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("projects")
            .select("id, title")
            .eq("user_id", user.id);
          if (data) {
            const mapped = data.map((p) => ({ id: p.id, name: p.title, title: p.title }));
            setProjects(mapped);
          }
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
    const params = new URLSearchParams(window.location.search);
    const editTaskId = params.get("edit");
    if (editTaskId && tasksData && tasksData.length > 0) {
      const taskToEdit = tasksData.find((t: any) => t.id === editTaskId);
      if (taskToEdit) {
        setEditingTask(taskToEdit);
        // Clear the query parameter smoothly
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
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
            playCastSpellSound();
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

  const handleToggleSubtask = (taskId: string, subtaskId: string, completed: boolean) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const updatedSubtasks = (t.subtasks || []).map((st: any) =>
          st.id === subtaskId ? { ...st, completed } : st
        );
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    });
    setTasks(updatedTasks);

    const targetTask = tasks.find((t) => t.id === taskId);
    if (targetTask) {
      const updatedSubtasks = (targetTask.subtasks || []).map((st: any) =>
        st.id === subtaskId ? { ...st, completed } : st
      );
      updateTask(
        { id: taskId, data: { subtasks: updatedSubtasks } },
        {
          onSuccess: () => {
            refetch(true);
          }
        }
      );
    }
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
      <TaskHeader
        t={t}
        language={language}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isFocusMode={isFocusMode}
        setIsFocusMode={setIsFocusMode}
        view={view}
        setView={setView}
        onNewTask={() => {
          setEditingTask(null);
          setIsAdding(true);
        }}
      />

      {view === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 flex overflow-x-auto gap-3.5 min-h-0 pb-4 no-scrollbar scroll-smooth snap-x px-1">
            {columns.map((column) => {
              const columnTasks = filteredTasks.filter((t) => {
                const cleanDue = t.due_date ? String(t.due_date).trim().slice(0, 10) : null;
                const isOverdue = cleanDue && cleanDue < format(selectedDate, "yyyy-MM-dd") && t.status !== "done" && t.status !== "cancelled";

                if (column.id === "draft") {
                  return t.status === "draft" || (t.status === "todo" && isOverdue);
                }

                // If a task is a todo and overdue, it has already been relegated to the 'draft' column above.
                if (t.status === "todo" && isOverdue) {
                  return false;
                }

                return t.status === column.id;
              });
              const isDoing = column.id === "in_progress";
              const isFaded = isFocusMode && !isDoing;

              const isDraft = column.id === "draft";
              const isCancelledCol = column.id === "cancelled";
              const isCollapsed = (isDraft && hideDraftColumn) || (isCancelledCol && hideCancelledColumn);

              return (
                <div
                  key={column.id}
                  className={`flex flex-col transition-all duration-300 ${
                    isCollapsed ? "flex-shrink-0 w-full md:w-[48px] px-1" : "md:flex-1 md:min-w-[280px]"
                  } md:snap-center space-y-4.5 h-full min-h-0 p-3 rounded-[2rem] transition-opacity duration-500 ${
                    column.bg
                  } ${
                    isFaded
                      ? "opacity-30 grayscale blur-[1px] pointer-events-none"
                      : "opacity-100"
                  }`}
                >
                  {isCollapsed ? (
                    <div className="flex flex-col items-center gap-6 py-5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm bg-bg-secondary text-text-secondary shadow-sm">
                        {column.icon}
                      </div>
                      <span className="text-[10px] font-black text-text-secondary bg-bg-secondary/80 w-6 h-6 flex items-center justify-center rounded-lg border border-border/50">
                        {columnTasks.length}
                      </span>
                      <button
                        onClick={() => {
                          if (isDraft) {
                            setHideDraftColumn(false);
                            localStorage.setItem("hideDraftColumn", "false");
                          } else {
                            setHideCancelledColumn(false);
                            localStorage.setItem("hideCancelledColumn", "false");
                          }
                        }}
                        className="p-1.5 text-text-secondary hover:text-accent hover:bg-accent/15 rounded-xl transition-all cursor-pointer"
                        title={language === 'ar' ? 'عرض العمود' : 'Show Column'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3">
                      <div className="flex items-center gap-2">
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
                          className={`text-xs md:text-sm font-bold uppercase tracking-widest ${
                            isDoing ? "text-orange-500" : "text-text-secondary"
                          }`}
                        >
                          {column.title === "DOING"
                            ? "Active Focus"
                            : column.title === "Pending from yesterday" && language === "ar"
                            ? "معلقة من أمس"
                            : column.title === "🚫 CANCELLED" && language === "ar"
                            ? "ملغية 🚫"
                            : column.title}
                        </h2>
                        {(isDraft || isCancelledCol) && (
                          <button
                            onClick={() => {
                              if (isDraft) {
                                setHideDraftColumn(true);
                                localStorage.setItem("hideDraftColumn", "true");
                              } else {
                                setHideCancelledColumn(true);
                                localStorage.setItem("hideCancelledColumn", "true");
                              }
                            }}
                            className="p-1 text-text-secondary hover:text-accent transition-all cursor-pointer"
                            title={language === 'ar' ? 'إخفاء العمود' : 'Hide Column'}
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-xs font-bold text-text-secondary bg-bg-secondary/80 px-2.5 py-1 rounded-lg border border-border/50">
                        {columnTasks.length}
                      </span>
                    </div>
                  )}

                  {!isCollapsed && (
                    <DroppableAny droppableId={column.id} ignoreContainerClipping>
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
                            onToggleSubtask={handleToggleSubtask}
                            onStartPomodoro={(t) => {
                              startPomodoroGlobal(t);
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
                  )}
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        <TaskCalendarView
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          tasks={tasks}
          setEditingTask={setEditingTask}
        />
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
