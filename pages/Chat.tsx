import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  Bot, Loader2, Paperclip, Sparkles, 
  Trash2, MessageSquare, Info, Brain, Check, X, 
  ArrowRight, ArrowBigRightDash, Edit2, Plus, History,
  Layout, Clock, List
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { 
  useGetTasks, useGetHabits, useGetDailySchedule, useCreateTask,
  useCreateHabit,
  useGetChatSessions, useCreateChatSession, useDeleteChatSession, 
  useUpdateChatSession, useGetChatMessages, useSaveChatMessage
} from '../lib/hooks';

const INITIAL_AI_MESSAGE_EN = `Hello! I am your AI Coach. I'm here to help you build healthy habits, plan your day correctly, and achieve your goals.
I can access your current tasks and habits to provide personalized advice. How can I help you organize your life today?`;

const INITIAL_AI_MESSAGE_AR = `مرحباً! أنا مدربك الذكي (AI Coach). أنا هنا لأساعدك في بناء عادات صحية، تخطيط يومك بشكل صحيح، وتحقيق أهدافك.
يمكنني الوصول إلى مهامك وعاداتك الحالية لأقدم لك نصائح مخصصة. كيف يمكنني مساعدتك اليوم في تنظيم حياتك؟`;

const Typewriter = ({ text, speed = 10 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const textRef = useRef(text);
  
  useEffect(() => {
    textRef.current = text;
    let index = 0;
    setDisplayedText("");
    
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        const full = textRef.current;
        if (index >= full.length) {
          clearInterval(interval);
          return full;
        }
        const nextChar = full[index];
        index++;
        return prev + (nextChar !== undefined ? nextChar : "");
      });
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return <span>{displayedText}</span>;
};

type Message = { role: 'user' | 'model', content: string, created_at?: string, timestamp?: Date, file?: File | null };

export const Chat = () => {
  const { addNotification, t, language } = useAppContext();
  const [location, setLocation] = useLocation();

  // Handle prompt query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get('prompt');
    if (prompt) {
      // Small delay to ensure hooks are ready if needed
      const sendInitialMsg = async () => {
        if (!currentSessionId) {
          createSession({ title: prompt.substring(0, 30) || 'New Chat' }, {
            onSuccess: (newSession) => {
              setCurrentSessionId(newSession.id);
              // Set the input message first so sendActualMessage uses it
              setInputMessage(prompt);
              sendActualMessage(newSession.id, prompt);
              refetchSessions();
            }
          });
        } else {
          setInputMessage(prompt);
          sendActualMessage(currentSessionId, prompt);
        }
      };
      
      sendInitialMsg();
      // Clean up URL without refreshing
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: tasks, refetch: refetchTasks } = useGetTasks();
  const { data: habits, refetch: refetchHabits } = useGetHabits();
  const { data: schedule, refetch: refetchSchedule } = useGetDailySchedule();
  const { mutate: createTask } = useCreateTask();
  const { mutate: createHabit } = useCreateHabit();

  const getSystemInstruction = () => `
You are an AI Life OS Coach for the user.
Role:
You are a highly strategic, professional, and deeply empathetic Life Coach and professional development consultant. You specialize in career roadmap analysis, daily habit engineering, long-term strategic planning (up to 1 year), and productivity optimization. Your goal is not to just "distribute tasks" or dump JSON onto the user's dashboard, but to truly understand their lifestyle, psychological status, energy flow, and help them engineer lasting transformations.

Style & Language:
- ALWAYS respond in ${language === 'en' ? 'English' : 'Arabic'}.
- Act as a wise, incredibly warm, and witty Egyptian Life Coach (المدرب الذكي واللايف كوتش الشخصي).
- Speak in the absolute best, most encouraging, clever, and engaging colloquial Egyptian dialect (العامية المصرية المحببة والذكية جدًا). Use phrases like 'يا بطل', 'عاش يا وحش', 'جامد جداً', 'ولا تشيل هم', 'خطوة خطوة وهنوصل يا صاحبي', 'يا بطلة'.

Core Coaching Philosophy & Behavior:
- Diagnose Before You Prescribe (التشخيص والاستفسار أولاً):
  - Do not rush to suggest tasks or habits instantly.
  - Ask clear, reflective questions about the user's current routine, focus levels, daily obstacles, and energy level. Check their context, listen attentively, and ask ONLY one powerful question at a time to stay focused and not overwhelm them.
  
- Task vs. Habit Distinction (التفرقة الذكية بين المهمة والعادة):
  - Actively study and guide the user in classifying habits vs tasks:
    * Habit (عادة): A block of recurring action meant to build consistent automated behavior (e.g., drinking water, studying, sleeping early, reading). Suggest habits when they need consistency.
    * Task (تاسك/مهمة): A finite, one-time specific piece of work with an end state (e.g., submitting an application, buying a tool, fixing a bug).
  - When the user wants automated consistency, offer Habits. If they have a discrete accomplishment, offer Tasks.
  
- Long-Term Planning up to 1 Year (التخطيط الاستراتيجي طويل المدى حتى سنة كاملة):
  - You can draft comprehensive roadmaps for periods up to 1 year (خطط ربع سنوية، نصف سنوية، وسنوية).
  - Break long ranges into Annual Vision, Quarterly Milestones, Monthly sprints, and daily Tasks/Habits. Walk them step-by-step through the journey.

CRITICAL RULES (PREVENT DUPLICATION):
- You MUST study and cross-reference the user's active tasks and habits list in the provided context BEFORE creating any suggestions.
- DO NOT suggest or propose any tasks (with similar names) or habits that already exist in the user's list. Focus ONLY on proposing totally new, fresh, distinct steps or routines, or asking them to modify/upgrade existing ones without creating duplicate records.

EDGE FUNCTIONS & AI TOOLS:
- create_task, update_task_status, create_habit, log_habit_completion, create_goal. Include confirmation cards only when appropriate.
`;

  // Chat Sessions Hooks
  const { data: sessions, refetch: refetchSessions } = useGetChatSessions();
  const { mutate: createSession, isPending: isCreatingSession } = useCreateChatSession();
  const { mutate: deleteSession } = useDeleteChatSession();
  const { mutate: updateSession } = useUpdateChatSession();
  const { mutate: saveMessage } = useSaveChatMessage();

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { data: sessionMessages, loading: loadingMessages, refetch: refetchMessages } = useGetChatMessages(currentSessionId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [triggeredWelcomeSessions, setTriggeredWelcomeSessions] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastLoadedSessionIdRef = useRef<string | null>(null);

  const triggerDynamicWelcome = async (sessionId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const context = `
        Current Tasks: ${JSON.stringify(tasks?.map(t => ({ title: t.title, status: t.status })))}
        Current Habits: ${JSON.stringify(habits?.map(h => ({ name: h.name, streak: h.current_streak })))}
        Today's Schedule: ${JSON.stringify(schedule?.map(s => ({ title: s.task?.title, time: s.start_time })))}
      `;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prompt: "initiate_chat_welcome",
          systemInstruction: getSystemInstruction(),
          context
        })
      });

      if (!response.ok) throw new Error('Welcome API request failed');
      const data = await response.json();
      const aiResponse = data.text || (language === 'ar' ? 'مرحباً! أنا مدربك الذكي.' : 'Hello! I am your AI Coach.');

      setMessages([{ role: 'model', content: aiResponse, timestamp: new Date() }]);
      saveMessage(sessionId, 'model', aiResponse).then(() => {
        refetchMessages();
        refetchSessions();
      }).catch(err => {
        console.error("Failed to save dynamic welcome response:", err);
        refetchSessions();
      });

    } catch (err) {
      console.error('Failed to trigger dynamic welcome:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionMessages && currentSessionId) {
      if (lastLoadedSessionIdRef.current !== currentSessionId || (!isLoading && sessionMessages.length > 0)) {
        setMessages(sessionMessages.map(m => ({
          role: m.role,
          content: m.content,
          created_at: m.created_at
        })));
        lastLoadedSessionIdRef.current = currentSessionId;
      }

      // No longer trigger dynamic welcome message automatically when entering white/empty chat
      // This allows the user to immediately type without being forced to wait for a welcome message.
    }
  }, [sessionMessages, currentSessionId, isLoading, triggeredWelcomeSessions]);

  // Auto-select the last active session on load if none is selected and no prompt query is present
  useEffect(() => {
    if (sessions && sessions.length > 0 && !currentSessionId) {
      const params = new URLSearchParams(window.location.search);
      const prompt = params.get('prompt');
      if (!prompt) {
        setCurrentSessionId(sessions[0].id);
      }
    }
  }, [sessions, currentSessionId]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, suggestedTasks]);

  const handleCreateNewChat = () => {
    createSession({ title: language === 'ar' ? `محادثة ${new Date().toLocaleDateString()}` : `Chat ${new Date().toLocaleDateString()}` }, {
      onSuccess: (newSession) => {
        setCurrentSessionId(newSession.id);
        refetchSessions();
      }
    });
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !attachedFile) || isLoading) return;
    
    // If no session, create one
    if (!currentSessionId) {
      createSession({ title: inputMessage.trim().substring(0, 30) || 'New Chat' }, {
        onSuccess: (newSession) => {
          setCurrentSessionId(newSession.id);
          sendActualMessage(newSession.id, inputMessage.trim());
          refetchSessions();
        }
      });
    } else {
      sendActualMessage(currentSessionId, inputMessage.trim());
    }
  };

  const sendActualMessage = async (sessionId: string, textOverride?: string) => {
    const userMessage = textOverride || inputMessage.trim();
    const currentFile = attachedFile;
    setInputMessage('');
    setAttachedFile(null);
    
    // 1. Optimistic Update: Add message to local UI state and start loading IMMEDIATELY
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date(), file: currentFile }]);
    setIsLoading(true);

    try {
      // 2. Save User Message to DB in background - DO NOT let it block the Gemini call
      saveMessage(sessionId, 'user', userMessage).then(() => {
        refetchMessages();
      }).catch(err => {
        console.error("Failed to save user message to database background:", err);
      });

      const context = `
        Current Tasks: ${JSON.stringify(tasks?.map(t => ({ title: t.title, status: t.status })))}
        Current Habits: ${JSON.stringify(habits?.map(h => ({ name: h.name, streak: h.current_streak })))}
        Today's Schedule: ${JSON.stringify(schedule?.map(s => ({ title: s.task?.title, time: s.start_time })))}
      `;

      let filePayload = null;
      if (currentFile) {
        const fileBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(currentFile);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        filePayload = {
          data: fileBase64,
          mimeType: currentFile.type
        };
      }

      // 3. Request Gemini API through backend proxy (or direct smart-explain edge API)
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const isSmartExplain = userMessage.toLowerCase().includes('how to do it in best way:');
      
      let response;
      if (isSmartExplain) {
        const match = userMessage.match(/how to do it in best way:\s*"(.*)"/i) || userMessage.match(/how to do it in best way:\s*(.*)/i);
        const taskTitle = match ? match[1] : userMessage;

        response = await fetch('/api/smart-explain', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            taskTitle: taskTitle.trim(),
            context
          })
        });
      } else {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            prompt: userMessage,
            systemInstruction: getSystemInstruction(),
            context,
            fileData: filePayload
          })
        });
      }

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      const aiResponse = data.text || (language === 'ar' ? 'عذراً، لم أستطع معالجة طلبك.' : 'Sorry, I could not process your request.');
      
      // Check if any database actions were taken by the AI Edge Functions / Tools
      if (data.actions_taken && data.actions_taken.length > 0) {
        let refetchedTasksFlag = false;
        let refetchedHabitsFlag = false;

        data.actions_taken.forEach((action: any) => {
          if (action.type === 'create_task' || action.type === 'update_task') {
            refetchedTasksFlag = true;
          } else if (action.type === 'create_habit' || action.type === 'log_habit') {
            refetchedHabitsFlag = true;
          }
        });

        if (refetchedTasksFlag) refetchTasks(true);
        if (refetchedHabitsFlag) refetchHabits(true);
        refetchSchedule(true);

        // Notify the user elegantly that action was performed in background
        const actionMsg = language === 'ar' 
          ? `✨ تم التحديث تلقائياً: قام الذكاء الاصطناعي بتنفيذ الإجراء بنجاح!` 
          : `✨ System Auto-Updated: AI performed action successfully!`;
        addNotification(actionMsg, 'success');
      }

      // 4. Update local state with Gemini's response immediately
      setMessages(prev => [...prev, { role: 'model', content: aiResponse, timestamp: new Date() }]);
      
      // 5. Save Gemini Response to DB in background - DO NOT let it block the user flow
      saveMessage(sessionId, 'model', aiResponse).then(() => {
        refetchMessages();
        refetchSessions();
      }).catch(err => {
        console.error("Failed to save AI model response to database background:", err);
        refetchSessions();
      });

    } catch (error) {
      console.error('Chat Error:', error);
      addNotification('فشل الاتصال بالمدرب الذكي', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    await updateSession(id, editTitle);
    setEditingSessionId(null);
    refetchSessions();
  };

  const handleDelete = async (id: string) => {
    await deleteSession(id);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
    }
    setSessionToDelete(null);
    refetchSessions();
  };

  const [acceptedTaskIds, setAcceptedTaskIds] = useState<Set<string>>(new Set());
  const [acceptedHabitIds, setAcceptedHabitIds] = useState<Set<string>>(new Set());

  const parseSuggestions = (content: string) => {
    if (!content) return { cleanContent: '', suggestions: null };
    try {
      const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
      let match;
      while ((match = jsonRegex.exec(content)) !== null) {
        try {
          const possibleJson = match[1].trim();
          const decoded = JSON.parse(possibleJson);
          if (decoded) {
            // Check if it's the new consolidated multiple-type suggestions schema
            if (decoded.type === 'suggestions' || Array.isArray(decoded.tasks) || Array.isArray(decoded.habits)) {
              const clean = content.replace(match[0], '').trim();
              return {
                cleanContent: clean,
                suggestions: {
                  tasks: Array.isArray(decoded.tasks) ? decoded.tasks : [],
                  habits: Array.isArray(decoded.habits) ? decoded.habits : []
                }
              };
            }
            // Check if it's the legacy schema (backward compatibility)
            if (decoded.type === 'task_suggestions' && Array.isArray(decoded.tasks)) {
              const clean = content.replace(match[0], '').trim();
              return {
                cleanContent: clean,
                suggestions: {
                  tasks: decoded.tasks,
                  habits: []
                }
              };
            }
          }
        } catch (e) {
          // Ignore and check next codeblock
        }
      }
    } catch (e) {
      console.error('Failed to parse AI suggestions:', e);
    }
    return { cleanContent: content, suggestions: null };
  };

  const handleAcceptTask = (task: any, suggestionIdx: number, messageIdx: number) => {
    // Prevent duplicated tasks with case-insensitive title checks
    const trimmedTitle = String(task.title || "").trim().toLowerCase();
    const isDuplicate = tasks?.some((t: any) => t.title?.trim().toLowerCase() === trimmedTitle && t.status !== 'completed' && t.status !== 'done');
    if (isDuplicate) {
      addNotification(
        language === 'ar' 
          ? `المهمة "${task.title}" موجودة بالفعل في قائمتك! 🎯` 
          : `Task "${task.title}" is already in your list! 🎯`, 
        'info'
      );
      return;
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let taskDueDate = task.due_date;
    if (
      !taskDueDate || 
      taskDueDate === 'YYYY-MM-DD' || 
      taskDueDate === 'yyyy-MM-dd' || 
      String(taskDueDate).trim().slice(0, 10) < todayStr ||
      !/^\d{4}-\d{2}-\d{2}/.test(String(taskDueDate))
    ) {
      taskDueDate = todayStr;
    } else {
      taskDueDate = String(taskDueDate).trim().slice(0, 10);
    }

    createTask({
      data: {
        title: task.title,
        description: task.description,
        priority: task.priority || 'medium',
        due_date: taskDueDate,
        scheduled_time: task.scheduled_time || null,
        estimated_min: parseInt(task.estimated_min || task.duration) || 25,
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
        status: 'todo',
        category: 'work',
        xp_reward: 20
      }
    }, {
      onSuccess: () => {
        addNotification(t('task_added'), 'success');
        setAcceptedTaskIds(prev => new Set(prev).add(`${messageIdx}-${suggestionIdx}`));
      }
    });
  };

  const handleAcceptHabit = (habit: any, suggestionIdx: number, messageIdx: number) => {
    // Prevent duplicated habits with case-insensitive checks
    const habitName = habit.name || habit.title || "";
    const trimmedName = String(habitName).trim().toLowerCase();
    const isDuplicate = habits?.some((h: any) => (h.title || h.name || "").trim().toLowerCase() === trimmedName);
    if (isDuplicate) {
      addNotification(
        language === 'ar' 
          ? `العادة "${habitName}" مسجلة بالفعل في نظامك! 🌟` 
          : `Habit "${habitName}" is already registered! 🌟`, 
        'info'
      );
      return;
    }

    createHabit({
      data: {
        name: habitName,
        category: habit.category || 'health',
        frequency: habit.frequency || 'daily',
        target_per_day: habit.target_per_day || 1,
        xp_per_complete: habit.xp_per_complete || 10,
        reminder_time: habit.reminder_time || null,
        emoji: habit.emoji || '✨',
        is_active: true
      }
    }, {
      onSuccess: () => {
        addNotification(t('habit_created') || 'Habit created successfully', 'success');
        setAcceptedHabitIds(prev => new Set(prev).add(`${messageIdx}-${suggestionIdx}`));
        refetchHabits(true);
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-bg-primary rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-border/10">
      {/* Mobile/Desktop Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full bg-transparent">
        {/* Chat Control Header (Floating/Minimal) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
          <button 
            onClick={() => setShowSidebar(true)}
            className="p-3 bg-bg-card/80 backdrop-blur-xl hover:bg-accent hover:text-white rounded-2xl text-text-secondary transition-all shadow-xl border border-border/50"
            title="History"
          >
            <History className="w-6 h-6" />
          </button>
          <button 
            onClick={handleCreateNewChat}
            className="p-3 bg-bg-card/80 backdrop-blur-xl hover:bg-accent hover:text-white rounded-2xl text-text-secondary transition-all shadow-xl border border-border/50"
            title="New Chat"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 xl:px-12 pt-16 space-y-8 pb-28 no-scrollbar">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-accent blur-[120px] opacity-20 animate-pulse"></div>
                <div className="w-32 h-32 glass-card rounded-[2.5rem] flex items-center justify-center relative border border-border/30 bg-bg-secondary/20 shadow-2xl">
                  <Brain className="w-16 h-16 text-accent" />
                </div>
              </div>
              <h3 className="text-3xl font-display font-bold text-text-primary mb-4 tracking-tight">
                {language === 'ar' ? "كيف يمكنني مساعدتك اليوم؟" : "How can I help you today?"}
              </h3>
              <p className="text-text-secondary max-w-md mx-auto text-lg leading-relaxed opacity-70">
                {language === 'ar' 
                  ? "ابدئي محادثة لتنظيم مهامك، عاداتك، ومسار إنتاجيتك." 
                  : "Start a conversation to organize your tasks, habits, and productivity path."}
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const { cleanContent, suggestions } = parseSuggestions(msg.content);
            return (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col gap-4 max-w-[90%] lg:max-w-[75%]">
                  <div className={`rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-7 shadow-xl relative ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-tr-none'
                      : 'glass-card text-text-primary rounded-tl-none border border-border/50 bg-bg-secondary/40 backdrop-blur-md'
                  }`}>
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/5 shadow-inner">
                        <Brain className="w-4 h-4 text-accent" />
                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
                          {language === 'ar' ? "المدرب الذكي" : "AI Coach"}
                        </span>
                      </div>
                    )}
                    <div className="text-[15px] lg:text-[17px] leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.role === 'model' && idx === messages.length - 1 && !isLoading ? (
                        <Typewriter text={cleanContent} />
                      ) : (
                        cleanContent
                      )}
                    </div>
                  </div>

                  {suggestions && msg.role === 'model' && (
                    <div className="grid grid-cols-1 gap-3 ml-4">
                      {/* Task Suggestions */}
                      {suggestions.tasks && suggestions.tasks.map((task: any, sIdx: number) => {
                        const isAlreadyRegisteredTask = tasks?.some((t: any) => t.title?.trim().toLowerCase() === String(task.title || "").trim().toLowerCase() && t.status !== 'completed' && t.status !== 'done');
                        const isAccepted = acceptedTaskIds.has(`${idx}-${sIdx}`) || isAlreadyRegisteredTask;
                        return (
                          <motion.div 
                            key={`task-${sIdx}`}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-bg-card border border-border rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4"
                          >
                            <div className="flex-1">
                              <span className="text-[9px] font-bold text-accent uppercase tracking-wider mb-1 block">
                                📝 {language === 'ar' ? 'مهمة مقترحة' : 'Suggested Task'}
                              </span>
                              <h4 className="font-bold text-sm text-text-primary">{task.title}</h4>
                              <p className="text-[10px] text-text-secondary line-clamp-1">{task.description}</p>
                              
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="text-[8px] font-bold uppercase py-0.5 px-1.5 rounded bg-bg-secondary text-text-secondary border border-border">
                                  {task.due_date}
                                </span>
                                <span className={`text-[8px] font-bold uppercase py-0.5 px-1.5 rounded border ${
                                  task.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  task.priority === 'medium' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                }`}>
                                  {task.priority}
                                </span>
                                {task.scheduled_time && (
                                  <span className="flex items-center gap-1 text-[8px] font-bold uppercase py-0.5 px-1.5 rounded bg-bg-secondary text-text-secondary border border-border">
                                    <Clock className="w-2.5 h-2.5" />
                                    {task.scheduled_time}
                                  </span>
                                )}
                                {(task.estimated_min || task.duration) && (
                                  <span className="text-[8px] font-bold uppercase py-0.5 px-1.5 rounded bg-bg-secondary text-text-secondary border border-border">
                                    {task.estimated_min || task.duration} {language === 'ar' ? 'دقيقة' : 'mins'}
                                  </span>
                                )}
                              </div>

                              {task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
                                <div className="mt-2.5 pl-2.5 border-l-2 border-accent/30 space-y-1">
                                  {task.subtasks.map((st: any, stIdx: number) => (
                                    <div key={stIdx} className="flex items-center gap-1.5 text-[10px] text-text-secondary font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                      <span>{typeof st === 'string' ? st : (st.title || st.name)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              disabled={isAccepted}
                              onClick={() => handleAcceptTask(task, sIdx, idx)}
                              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                isAccepted 
                                  ? 'bg-emerald-500 text-white cursor-default' 
                                  : 'bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20'
                              }`}
                            >
                              {isAccepted ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>
                          </motion.div>
                        );
                      })}

                      {/* Habit Suggestions */}
                      {suggestions.habits && suggestions.habits.map((habit: any, sIdx: number) => {
                        const targetName = habit.name || habit.title || "";
                        const isAlreadyRegisteredHabit = habits?.some((h: any) => (h.title || "").trim().toLowerCase() === String(targetName).trim().toLowerCase() || (h.name || "").trim().toLowerCase() === String(targetName).trim().toLowerCase());
                        const isAccepted = acceptedHabitIds.has(`${idx}-${sIdx}`) || isAlreadyRegisteredHabit;
                        return (
                          <motion.div 
                            key={`habit-${sIdx}`}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-bg-card border border-border rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4"
                          >
                            <div className="flex-1">
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-1 block">
                                ✨ {language === 'ar' ? 'عادة مقترحة' : 'Suggested Habit'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{habit.emoji || '✨'}</span>
                                <h4 className="font-bold text-sm text-text-primary">{habit.name || habit.title}</h4>
                              </div>
                              {habit.reason && <p className="text-[10px] text-text-secondary mt-1">{habit.reason}</p>}
                              
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="text-[8px] font-bold uppercase py-0.5 px-1.5 rounded bg-bg-secondary text-text-secondary border border-border">
                                  {habit.frequency === 'weekly' ? (language === 'ar' ? 'أسبوعي' : 'Weekly') : (language === 'ar' ? 'يومي' : 'Daily')}
                                </span>
                                <span className="text-[8px] font-bold uppercase py-0.5 px-1.5 rounded bg-bg-secondary text-text-secondary border border-border">
                                  {habit.category === 'health' ? (language === 'ar' ? 'صحة' : 'Health') :
                                   habit.category === 'learning' ? (language === 'ar' ? 'تعلم' : 'Learning') :
                                   habit.category === 'work' ? (language === 'ar' ? 'عمل' : 'Work') :
                                   (language === 'ar' ? 'أخرى' : 'Other')}
                                </span>
                              </div>
                            </div>
                            <button
                              disabled={isAccepted}
                              onClick={() => handleAcceptHabit(habit, sIdx, idx)}
                              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                isAccepted 
                                  ? 'bg-emerald-500 text-white cursor-default' 
                                  : 'bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20'
                              }`}
                            >
                              {isAccepted ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>
                          </motion.div>
                        );
                      })}

                      {suggestions.tasks && suggestions.tasks.length > 0 && !suggestions.tasks.every((_, sIdx) => acceptedTaskIds.has(`${idx}-${sIdx}`)) && (
                        <button
                          onClick={() => {
                            suggestions.tasks.forEach((task: any, sIdx: number) => {
                              if (!acceptedTaskIds.has(`${idx}-${sIdx}`)) {
                                handleAcceptTask(task, sIdx, idx);
                              }
                            });
                          }}
                          className="text-[10px] font-bold text-accent hover:underline text-left mt-1"
                        >
                          {language === 'ar' ? 'الموافقة على جميع المهام' : 'Accept all tasks'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="glass-card rounded-2xl p-4 flex items-center gap-3 border border-border">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="text-sm text-text-secondary italic">
                  {language === 'ar' ? "المدرب يفكر..." : "Coach is thinking..."}
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="absolute bottom-3 lg:bottom-4 left-3 lg:left-4 right-3 lg:right-4">
          <div className="max-w-4xl mx-auto rounded-3xl p-1 bg-bg-card/90 backdrop-blur-xl border-none shadow-xl flex items-end gap-2 transition-all shadow-black/10 focus-within:ring-1 focus-within:ring-accent/30">
            <label className="p-2 w-10 h-10 flex items-center justify-center rounded-2xl bg-bg-secondary text-text-secondary hover:text-accent transition-all cursor-pointer flex-shrink-0">
              <input type="file" className="hidden" onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
              <Paperclip className="w-5 h-5" />
            </label>
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={language === 'ar' ? "اسألي عن أي شيء أو شاركي خطتك..." : "Ask anything or share your plan..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-text-primary placeholder-text-secondary py-2.5 px-2 resize-none min-h-[40px] max-h-32 font-medium text-base outline-none"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
              className={`p-2.5 w-10 h-10 flex items-center justify-center rounded-2xl transition-all flex-shrink-0 ${
                inputMessage.trim() || attachedFile
                  ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:scale-105'
                  : 'bg-bg-secondary text-text-secondary'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          {attachedFile && (
            <div className="mt-2 flex items-center gap-2 px-6">
              <div className="bg-accent/10 text-accent px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border border-accent/20">
                <Paperclip className="w-3 h-3" />
                <span className="max-w-[200px] truncate">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - History (Floating Drawer) */}
      <motion.div 
        initial={{ x: 400 }}
        animate={{ x: showSidebar ? 0 : 400 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-2 right-2 w-80 lg:w-96 bg-bg-secondary border border-border flex flex-col h-[calc(100vh-5rem)] z-50 rounded-[2rem] shadow-[-20px_0_50px_rgba(0,0,0,0.2)] overflow-hidden"
      >
        <div className="p-6 border-b border-border bg-bg-primary/50 backdrop-blur-md flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 font-display">
            {language === 'ar' ? "تاريخ المحادثات" : "Chat History"}
          </h3>
          <button 
            onClick={() => setShowSidebar(false)}
            className="p-2 hover:bg-bg-primary rounded-xl text-text-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-border">
          <button 
            onClick={() => {
              setCurrentSessionId(null);
              setShowSidebar(false);
            }}
            className="w-full py-3 bg-accent/10 border border-accent/20 text-accent rounded-xl hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            {language === 'ar' ? "محادثة جديدة" : "New Chat"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => {
                setCurrentSessionId(session.id);
                if (window.innerWidth < 1024) setShowSidebar(false);
              }}
              className={`group p-4 rounded-2xl cursor-pointer transition-all border ${
                currentSessionId === session.id 
                  ? 'bg-accent/10 border-accent/30 text-accent' 
                  : 'bg-bg-primary/30 border-transparent text-text-secondary hover:bg-bg-primary hover:border-border'
              }`}
            >
              <div className={`flex items-center justify-between gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 flex-1 min-w-0 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-accent' : 'text-text-secondary'}`} />
                  {editingSessionId === session.id ? (
                    <input 
                      autoFocus
                      className={`bg-transparent border-none outline-none text-sm font-bold w-full p-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => handleRename(session.id)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(session.id)}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className={`text-sm font-bold truncate w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>{session.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(session.id);
                      setEditTitle(session.title);
                    }}
                    className="p-1.5 hover:text-accent"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session.id);
                    }}
                    className="p-1.5 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <span className={`text-[10px] opacity-40 mt-1 block font-mono ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {new Date(session.updated_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {sessionToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSessionToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-primary border border-border w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative z-10"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-2 font-display">
                {language === 'ar' ? "مسح المحادثة؟" : "Delete Conversation?"}
              </h3>
              <p className="text-text-secondary text-center mb-8">
                {language === 'ar' 
                  ? "هل أنتِ متأكدة؟ سيتم حذف جميع الرسائل نهائياً." 
                  : "Are you sure? This will permanently delete all messages."}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDelete(sessionToDelete)}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  {language === 'ar' ? "حذف المحادثة" : "Delete Chat"}
                </button>
                <button 
                  onClick={() => setSessionToDelete(null)}
                  className="w-full py-3 text-text-secondary font-medium hover:text-text-primary transition-all text-sm"
                >
                  {language === 'ar' ? "تراجع" : "Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

