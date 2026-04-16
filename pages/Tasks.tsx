import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useGetTasks, useUpdateTask, useCreateTask, useDeleteTask } from '../lib/hooks';
import { DragDropContext, Droppable, Draggable, DroppableProps, DraggableProps } from '@hello-pangea/dnd';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Star, MessageCircleQuestion, Play, MoreHorizontal, Plus, X, Loader2, 
  CheckCircle2, AlertCircle, Clock, Calendar, Trash2, Edit2, Sparkles, 
  Timer, Pause, RotateCcw, ChevronRight, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, parseISO, addMinutes, isWithinInterval } from 'date-fns';

export const Tasks = ({ currentUser }: any) => {
  const { t, language, addNotification } = useAppContext();
  const { data: tasksData, loading: isLoading, refetch } = useGetTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const { mutate: deleteTask } = useDeleteTask();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activePomodoro, setActivePomodoro] = useState<any>(null);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [initialPomodoroTime, setInitialPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  useEffect(() => {
    if (tasksData) {
      setTasks(tasksData);
    }
  }, [tasksData]);

  useEffect(() => {
    if (editingTask) {
      setSubtasks(editingTask.subtasks || []);
    } else {
      setSubtasks([]);
    }
  }, [editingTask]);

  useEffect(() => {
    let interval: any;
    if (isPomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsPomodoroRunning(false);
      addNotification(pomodoroPhase === 'work' ? 'Work session complete! Take a break.' : 'Break over! Back to work.', 'success');
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroTime, pomodoroPhase, addNotification]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const updatedTasks = tasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    updateTask({ id: draggableId, data: { status: newStatus } }, {
      onError: () => {
        addNotification("فشل تحديث حالة المهمة", "error");
        setTasks(tasks); // Revert
      }
    });
  };

  const columns = [
    { id: 'draft', title: 'DRAFT', icon: '📝' },
    { id: 'todo', title: 'TO DO', icon: '📌' },
    { id: 'doing', title: 'DOING', icon: '⚡' },
    { id: 'done', title: 'DONE', icon: '✅' },
  ];

  const startPomodoro = (task: any) => {
    setActivePomodoro(task);
    const workTime = (task.estimated_min || 25) * 60;
    setPomodoroTime(workTime);
    setInitialPomodoroTime(workTime);
    setIsPomodoroRunning(true);
    setPomodoroPhase('work');
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
      deleteTask({ id }, {
        onSuccess: () => {
          addNotification("تم حذف المهمة", "success");
          setTasks(tasks.filter(t => t.id !== id));
          setEditingTask(null);
        }
      });
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description'),
      status: formData.get('status'),
      priority: formData.get('priority'),
      scheduled_time: formData.get('start_time'),
      estimated_min: parseInt(formData.get('duration') as string) || 25,
      due_date: format(new Date(), 'yyyy-MM-dd'),
      subtasks: subtasks,
    };

    if (editingTask) {
      updateTask({ id: editingTask.id, data: taskData }, {
        onSuccess: () => {
          addNotification("تم تحديث المهمة", "success");
          setEditingTask(null);
          refetch();
        }
      });
    } else {
      createTask({ data: taskData }, {
        onSuccess: () => {
          addNotification("تمت إضافة المهمة", "success");
          setIsAdding(false);
          refetch();
        },
        onError: (error: any) => {
          console.error('Task Creation Error:', error);
          addNotification(error.message === 'User not found' ? "يرجى التأكد من تسجيل الدخول" : "حدث خطأ أثناء حفظ المهمة", "error");
        }
      });
    }
  };

  const generateSubtasks = async () => {
    const title = (document.getElementsByName('title')[0] as HTMLInputElement)?.value;
    if (!title) {
      addNotification("يرجى إدخال عنوان المهمة أولاً", "error");
      return;
    }

    setIsGeneratingSubtasks(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a list of 3-5 clear, actionable subtasks for the task: "${title}". Return as a JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const generated = JSON.parse(response.text || '[]');
      const newSubtasks = generated.map((title: string) => ({
        id: Math.random().toString(36).substr(2, 9),
        title,
        completed: false
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

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">{t('tasks')}</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your daily flow and long-term goals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-xl border border-border">
            <button 
              onClick={() => setView('kanban')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'kanban' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Settings className="w-4 h-4" />
              {t('grid')}
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'calendar' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Calendar className="w-4 h-4" />
              {t('calendar')}
            </button>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('add_task')}
          </button>
        </div>
      </header>

      {view === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map(column => (
              <div key={column.id} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{column.icon}</span>
                    <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">{column.title}</h2>
                  </div>
                  <span className="text-xs font-bold text-text-secondary bg-bg-secondary/50 px-2 py-1 rounded-md">
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>

                {(() => {
                  const DroppableAny = Droppable as any;
                  return (
                    <DroppableAny droppableId={column.id}>
                      {(provided: any) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4 min-h-[500px] p-2 rounded-2xl bg-bg-secondary/30 border border-dashed border-border/50"
                        >
                      {tasks.filter(t => t.status === column.id).map((task, index) => {
                        const DraggableAny = Draggable as any;
                        return (
                          <DraggableAny draggableId={task.id.toString()} index={index} key={task.id}>
                            {(provided: any) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="group"
                              >
                              <motion.div 
                                onClick={() => setEditingTask(task)}
                                className="glass-card p-5 space-y-4 hover:border-accent/40 transition-all cursor-pointer relative overflow-hidden"
                              >
                                <div className={`absolute top-0 bottom-0 w-1 bg-accent/20 ${language === 'ar' ? 'right-0' : 'left-0'}`}>
                                  <div className={`w-full bg-accent shadow-[0_0_10px_rgba(13,148,136,0.5)] ${task.status === 'done' ? 'h-full' : 'h-1/3'}`} />
                                </div>

                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{task.priority}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-text-primary bg-bg-secondary px-2 py-0.5 rounded-md border border-border">
                                      {task.scheduled_time || '09:00'}
                                    </span>
                                  </div>

                                  <h3 className={`font-bold text-text-primary group-hover:text-accent transition-colors ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
                                    {task.title}
                                  </h3>

                                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                    <div className="flex items-center gap-1">
                                      <button onClick={(e) => { e.stopPropagation(); startPomodoro(task); }} className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-all">
                                        <Timer className="w-4 h-4" />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); setEditingTask(task); }} className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-all">
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); startPomodoro(task); }}
                                      className="px-3 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-bold hover:bg-accent hover:text-white transition-all flex items-center gap-1"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      Start
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          )}
                          </DraggableAny>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </DroppableAny>
                );
              })()}
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="glass-card p-8 text-center text-text-secondary">
          Calendar view is coming soon...
        </div>
      )}

      {/* Pomodoro Modal */}
      <AnimatePresence>
        {activePomodoro && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card w-full max-w-md p-8 text-center space-y-8 relative"
            >
              <button 
                onClick={() => setActivePomodoro(null)}
                className="absolute top-4 right-4 p-2 hover:bg-bg-secondary/50 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-text-secondary" />
              </button>

              <div className="space-y-2">
                <span className={`text-xs font-bold uppercase tracking-widest ${pomodoroPhase === 'work' ? 'text-accent' : 'text-emerald-500'}`}>
                  {pomodoroPhase === 'work' ? 'Focus Session' : 'Break Time'}
                </span>
                <h2 className="text-2xl font-bold text-text-primary">{activePomodoro.title}</h2>
              </div>

              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="8" className="text-bg-secondary" />
                  <motion.circle
                    cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="8"
                    strokeDasharray="553"
                    initial={{ strokeDashoffset: 553 }}
                    animate={{ strokeDashoffset: 553 - (553 * (pomodoroTime / initialPomodoroTime)) }}
                    className={pomodoroPhase === 'work' ? 'text-accent' : 'text-emerald-500'}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-mono font-bold text-text-primary">
                    {Math.floor(pomodoroTime / 60)}:{String(pomodoroTime % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setPomodoroTime(initialPomodoroTime)} className="p-4 rounded-2xl bg-bg-secondary text-text-secondary hover:text-text-primary transition-all">
                  <RotateCcw className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                  className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/40 hover:scale-105 transition-all"
                >
                  {isPomodoroRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                <button 
                  onClick={() => {
                    const newPhase = pomodoroPhase === 'work' ? 'break' : 'work';
                    const newTime = (newPhase === 'work' ? (activePomodoro.estimated_min || 25) : 5) * 60;
                    setPomodoroPhase(newPhase);
                    setPomodoroTime(newTime);
                    setInitialPomodoroTime(newTime);
                  }}
                  className="p-4 rounded-2xl bg-bg-secondary text-text-secondary hover:text-text-primary transition-all"
                >
                  <Timer className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {(editingTask || isAdding) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl p-8 relative"
            >
              <button onClick={() => { setEditingTask(null); setIsAdding(false); }} className="absolute top-4 right-4 p-2 hover:bg-bg-secondary rounded-full transition-colors">
                <X className="w-6 h-6 text-text-secondary" />
              </button>

              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>

              <form onSubmit={handleSaveTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Title</label>
                  <input 
                    name="title"
                    type="text" 
                    required
                    defaultValue={editingTask?.title || ''}
                    className="w-full bg-bg-secondary/50 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Status</label>
                    <select name="status" defaultValue={editingTask?.status || 'todo'} className="w-full bg-bg-secondary/50 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all appearance-none">
                      <option value="draft">Draft</option>
                      <option value="todo">To Do</option>
                      <option value="doing">Doing</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Priority</label>
                    <select name="priority" defaultValue={editingTask?.priority || 'medium'} className="w-full bg-bg-secondary/50 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all appearance-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Start Time</label>
                    <input name="start_time" type="time" defaultValue={editingTask?.scheduled_time || '09:00'} className="w-full bg-bg-secondary/50 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Duration (min)</label>
                    <input name="duration" type="number" defaultValue={editingTask?.estimated_min || 25} className="w-full bg-bg-secondary/50 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Subtasks</label>
                    <button 
                      type="button"
                      onClick={generateSubtasks}
                      disabled={isGeneratingSubtasks}
                      className="text-xs font-bold text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {isGeneratingSubtasks ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Generate with AI
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary/30 border border-border/50 group">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => toggleSubtask(st.id)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${st.completed ? 'bg-accent border-accent' : 'border-border'}`}
                          >
                            {st.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </button>
                          <span className={`text-sm ${st.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                            {st.title}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeSubtask(st.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-500 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Add subtask..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              setSubtasks([...subtasks, { id: Math.random().toString(36).substr(2, 9), title: val, completed: false }]);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="w-full bg-transparent border-b border-border py-2 px-1 text-sm text-text-primary outline-none focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingTask ? 'Update Task' : 'Create Task')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
