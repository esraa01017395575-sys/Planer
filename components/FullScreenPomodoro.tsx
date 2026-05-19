import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, Calendar as CalendarIcon, Clock, ChevronLeft, 
  ChevronRight, Play, Pause, RotateCcw, CheckCircle2,
  Flag, ListTodo, Activity, X, Maximize2, Minimize2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useGetTasks } from '../lib/hooks';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { PomodoroTimer, FloatingPomodoro } from './PomodoroTimer';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: any;
};

export const FullScreenPomodoro = ({ isOpen, onClose, initialTask }: Props) => {
  const { language } = useAppContext();
  const { data: tasksData } = useGetTasks();
  const [selectedTask, setSelectedTask] = useState<any>(initialTask || null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (initialTask) setSelectedTask(initialTask);
  }, [initialTask]);

  // Filter out 'done' tasks and sort
  const activeTasks = useMemo(() => {
    if (!tasksData) return [];
    return tasksData
      .filter((t: any) => t.status !== 'done')
      .sort((a: any, b: any) => {
        const pValues: any = { high: 0, medium: 1, low: 2 };
        if (pValues[a.priority] !== pValues[b.priority]) {
          return pValues[a.priority] - pValues[b.priority];
        }
        return (a.scheduled_time || '00:00').localeCompare(b.scheduled_time || '00:00');
      });
  }, [tasksData]);

  // Calendar logic
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = addDays(start, 41);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-bg-primary overflow-hidden flex flex-col"
      >
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-20 grayscale brightness-50"
          style={{ 
            backgroundImage: `url('/assets/images/focus_background.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Animated Orbs for Depth */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <header className="px-8 py-6 flex items-center justify-between border-b border-border/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                <Timer className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-text-primary tracking-tight">Focus Session</h1>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold opacity-60">Deep Work Mode</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-3 hover:bg-bg-secondary rounded-full transition-all text-text-secondary hover:text-red-500 hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Left Column: Pomodoro Hero */}
              <div className="lg:col-span-7 space-y-8">
                <div className="glass-card p-12 relative overflow-hidden bg-white/5 border-white/10 shadow-2xl backdrop-blur-3xl">
                  <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                    {selectedTask ? (
                      <div className="w-full max-w-md mx-auto scale-125 my-12">
                         {!isMinimized && (
                           <PomodoroTimer 
                             taskId={selectedTask.id} 
                             taskTitle={selectedTask.title}
                             onClose={() => setSelectedTask(null)}
                             onMinimize={() => setIsMinimized(true)}
                             autoStart={true}
                             customFocusMinutes={selectedTask.estimated_min}
                           />
                         )}
                      </div>
                    ) : (
                      <div className="py-20 space-y-8">
                        <div className="w-32 h-32 bg-accent/10 rounded-full flex items-center justify-center mx-auto ring-[12px] ring-accent/5 animate-pulse">
                          <Timer className="w-14 h-14 text-accent" />
                        </div>
                        <div className="space-y-3">
                          <h2 className="text-3xl font-display font-bold text-text-primary">Ready to Focus?</h2>
                          <p className="text-text-secondary max-w-xs mx-auto text-lg">Select a task from the timeline to start your session</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline View */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <ListTodo className="w-6 h-6 text-accent" />
                    <h2 className="text-2xl font-display font-bold text-text-primary">Tasks Timeline</h2>
                  </div>
                  
                  <div className="space-y-4 relative before:absolute before:inset-0 before:left-[19px] before:w-[2px] before:bg-gradient-to-b before:from-accent/50 before:via-border/20 before:to-transparent pl-2 pb-12">
                    {activeTasks.length > 0 ? (
                      activeTasks.map((task: any, index: number) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`relative flex items-start gap-8 group transition-all duration-300 ${selectedTask?.id === task.id ? 'scale-[1.02]' : ''}`}
                        >
                          <div className={`mt-3 w-10 h-10 rounded-full border-4 border-bg-primary z-10 flex items-center justify-center transition-all shadow-md font-bold ${selectedTask?.id === task.id ? 'bg-accent text-white border-accent/20 scale-110' : 'bg-bg-secondary text-text-secondary group-hover:bg-accent/10'}`}>
                             {index + 1}
                          </div>
                          
                          <div 
                            onClick={() => { setSelectedTask(task); setIsMinimized(false); }}
                            className={`flex-1 glass-card p-6 cursor-pointer transition-all border-l-[6px] ${
                              selectedTask?.id === task.id 
                                ? 'border-l-accent bg-accent/10 shadow-xl shadow-accent/5' 
                                : 'border-l-border hover:border-l-accent/50 hover:bg-bg-secondary/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Flag className={`w-4 h-4 ${task.priority === 'high' ? 'text-red-500 fill-red-500' : task.priority === 'medium' ? 'text-yellow-500 fill-yellow-500' : 'text-green-500 fill-green-500'}`} />
                                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{task.priority}</span>
                              </div>
                              <div className="flex items-center gap-2 text-text-secondary">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-mono font-bold">{task.scheduled_time || '09:00'}</span>
                              </div>
                            </div>
                            <h3 className="font-bold text-text-primary text-xl group-hover:text-accent transition-colors">{task.title}</h3>
                            {task.description && (
                              <p className="text-text-secondary text-base mt-2 line-clamp-2 opacity-80">{task.description}</p>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="glass-card p-20 text-center text-text-secondary flex flex-col items-center gap-4 border-dashed border-2">
                        <CheckCircle2 className="w-16 h-16 opacity-10" />
                        <p className="text-xl font-display">All tasks completed. Great job!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Calendar & Stats */}
              <div className="lg:col-span-5 space-y-8">
                <div className="glass-card p-8 border-accent/10 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-display font-bold text-text-primary flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-accent" />
                      Personal Calendar
                    </h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentDate(addDays(currentDate, -30))} className="p-2 hover:bg-bg-secondary rounded-xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={() => setCurrentDate(addDays(currentDate, 30))} className="p-2 hover:bg-bg-secondary rounded-xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-[10px] font-bold text-text-secondary text-center uppercase py-2 tracking-widest">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {monthDays.map((day, idx) => {
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const hasTask = tasksData?.some(t => isSameDay(new Date(t.due_date), day));
                      const today = isToday(day);

                      return (
                        <div 
                          key={idx}
                          className={`
                            aspect-square rounded-2xl flex flex-col items-center justify-center text-sm relative transition-all cursor-default border border-transparent
                            ${isCurrentMonth ? 'text-text-primary font-bold' : 'text-text-secondary opacity-20'}
                            ${today ? 'bg-accent text-white shadow-xl shadow-accent/40 scale-105 border-accent' : 'hover:bg-bg-secondary hover:border-border'}
                          `}
                        >
                          <span>{day.getDate()}</span>
                          {hasTask && !today && (
                            <div className="absolute bottom-2 w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-card p-8 bg-gradient-to-br from-accent to-accent-glow text-white border-white/20 shadow-2xl shadow-accent/20">
                  <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-3">
                    <Activity className="w-6 h-6 border-2 border-white/30 rounded-full p-1" />
                    Focus Analytics
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/5">
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Sessions</span>
                        <span className="text-4xl font-display font-bold">4</span>
                     </div>
                     <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/5">
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Minutes</span>
                        <span className="text-4xl font-display font-bold">100</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Timer when minimized */}
        {selectedTask && isMinimized && (
          <FloatingPomodoro 
            taskId={selectedTask.id} 
            taskTitle={selectedTask.title}
            onClose={() => { setSelectedTask(null); setIsMinimized(false); }}
            autoStart={true}
            customFocusMinutes={selectedTask.estimated_min}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
