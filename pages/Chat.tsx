import React, { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, Loader2, Paperclip, Sparkles, 
  Trash2, MessageSquare, Info, Brain, Check, X, 
  ArrowRight, ArrowBigRightDash
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import { useGetTasks, useGetHabits, useGetDailySchedule, useCreateTask } from '../lib/hooks';

const SYSTEM_INSTRUCTION = `
You are AI Coach Pro, a high-performance life coach and productivity expert.
Your goal is to help the user achieve their best self through actionable advice, task organization, and habit tracking.

Style: Warm, honest, direct, and challenging. Do not be overly flattering.
Language: Fluent in Arabic and English. Respond in the language the user uses.

Context Awareness:
You have access to the user's current tasks, habits, and schedule. Use this data to provide personalized advice.
If the user asks to organize their day, suggest specific times based on their current schedule.
If a task is too big, suggest breaking it down into subtasks.
If the user is procrastinating (e.g., many overdue tasks), challenge them directly but supportively.

Functionality:
- Suggest Pomodoro sessions (25/5 or 50/10).
- Suggest task breakdowns.
- Warn about schedule conflicts.
- Analyze images if provided.
`;

type Message = { role: 'user' | 'model', content: string, timestamp: Date, file?: File | null };

type ChatViewProps = {
  messages: Message[];
  suggestedTasks: any[];
  confirmTask: (task: any) => void;
  confirmAllTasks: () => void;
  rejectTask: (task: any) => void;
  rejectAllTasks: () => void;
  isLoading: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  handleSendMessage: () => void;
  attachedFile: File | null;
  setAttachedFile: (file: File | null) => void;
  clearChat: () => void;
};

const ChatView = memo(({
  messages,
  suggestedTasks,
  confirmTask,
  confirmAllTasks,
  rejectTask,
  rejectAllTasks,
  isLoading,
  chatEndRef,
  inputRef,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  attachedFile,
  setAttachedFile,
  clearChat
}: ChatViewProps) => {

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto glass-card overflow-hidden bg-bg-card backdrop-blur-xl border-border shadow-2xl relative">
          <div className="px-5 py-4 border-b border-border bg-bg-secondary/30 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/20">
                      <MessageSquare className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                      <h2 className="text-sm font-bold text-text-primary font-serif leading-none mb-1">Smart Planning Dialog</h2>
                      <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Analyzing your thoughts to build your reality</span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearChat}
                  className="p-2.5 rounded-xl bg-bg-secondary/50 border border-border text-text-secondary hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-2.5 rounded-xl bg-bg-secondary/50 border border-border text-text-secondary">
                    <Info className="w-4 h-4" />
                </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-scrollbar scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="relative mb-8">
                     <div className="absolute inset-0 bg-accent blur-[80px] opacity-20 animate-pulse"></div>
                     <div className="w-28 h-28 glass-card rounded-[2rem] flex items-center justify-center relative border border-border bg-bg-secondary/50 shadow-2xl">
                        <Brain className="w-14 h-14 text-accent" />
                     </div>
                </div>
                <h3 className="text-4xl font-serif font-bold text-text-primary mb-4">Let's Start Our Journey</h3>
                <p className="text-gray-400 max-w-sm font-serif text-lg leading-relaxed">
                  Every great idea starts with one word.. I'm here to listen.
                </p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-xl relative ${
                  msg.role === 'user'
                    ? 'bg-accent text-white rounded-tr-none'
                    : 'glass-card text-text-primary rounded-tl-none border border-border bg-bg-secondary/40 backdrop-blur-md'
                }`}>
                  {msg.role === 'model' && (
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/10">
                      <div className="p-1.5 bg-accent/20 rounded-lg">
                         <Brain className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-xs font-bold text-accent font-serif tracking-widest uppercase">Digital Partner</span>
                    </div>
                  )}
                  {msg.file && (
                    <div className="mb-3 p-2 bg-white/10 rounded-xl text-xs overflow-hidden flex items-center gap-2 border border-white/20">
                      <Paperclip className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{msg.file.name}</span>
                    </div>
                  )}
                  <div className="text-[17px] leading-relaxed font-serif whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  <div className={`text-[10px] mt-4 opacity-40 font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {suggestedTasks.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[2.5rem] p-8 border border-accent/40 relative overflow-hidden bg-white/5 shadow-inner"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent via-cyan-400 to-accent"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                         <Sparkles className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                        <span className="font-serif font-bold text-white text-2xl block">Suggested Paths</span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">What I've gathered from our chat</span>
                    </div>
                  </div>
                   <div className="flex items-center gap-3">
                    <button 
                        onClick={confirmAllTasks}
                        className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-5 py-3 rounded-2xl transition-all flex items-center gap-2 font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/5"
                    >
                        <Check className="w-4 h-4" />
                        Confirm All
                    </button>
                    <button 
                        onClick={rejectAllTasks}
                        className="text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 px-5 py-3 rounded-2xl transition-all flex items-center gap-2 font-bold uppercase tracking-widest shadow-lg shadow-rose-500/5"
                    >
                        <X className="w-4 h-4" />
                        Dismiss
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                   {suggestedTasks.map((task, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-8 bg-indigo-500/50 rounded-full"></div>
                          <span className="text-white font-serif">{task.title}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => rejectTask(task)}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => confirmTask(task)}
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-white"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
            
             {isLoading && (
              <div className="flex justify-start">
                <div className="glass-card rounded-[1.5rem] p-5 flex items-center gap-4 border border-border bg-bg-secondary/50 shadow-2xl backdrop-blur-md">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-text-secondary font-serif italic tracking-wide">Drafting response...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-bg-primary via-bg-primary to-transparent">
            <div className="max-w-4xl mx-auto relative group">
              {attachedFile && (
                <div className="absolute -top-12 left-6 bg-bg-card/80 backdrop-blur-md border border-border rounded-xl px-4 py-2 flex items-center gap-3 text-sm text-text-primary shadow-lg">
                  <Paperclip className="w-4 h-4 text-accent" />
                  <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="glass-card rounded-[2.5rem] p-3 border border-accent/20 shadow-xl flex items-end gap-3 bg-bg-card backdrop-blur-2xl transition-all focus-within:border-accent/50 focus-within:shadow-accent/10 ring-1 ring-border">
                <label className="p-4 rounded-[1.8rem] bg-bg-secondary text-text-secondary hover:text-accent transition-all hover:bg-bg-secondary/70 cursor-pointer">
                  <input type="file" className="hidden" onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                  <Paperclip className="w-6 h-6" />
                </label>
                
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Share your thoughts or questions..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-text-primary placeholder-text-secondary py-4 max-h-32 resize-none font-serif text-lg leading-relaxed outline-none"
                  rows={1}
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
                  className={`p-4 rounded-[1.8rem] transition-all duration-500 flex items-center justify-center ${
                    inputMessage.trim() || attachedFile
                      ? 'bg-accent text-white shadow-[0_10px_30px_rgba(13,148,136,0.5)] hover:scale-110 active:scale-95'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  <ArrowRight className={`w-7 h-7 transition-all ${inputMessage.trim() || attachedFile ? 'translate-x-0' : 'opacity-0'}`} />
                  {(!inputMessage.trim() && !attachedFile) && <ArrowBigRightDash className="w-7 h-7 absolute opacity-50" />}
                </button>
              </div>
            </div>
          </div>
        </div>
    );
});

export const Chat = () => {
  const { addNotification } = useAppContext();
  const { data: tasks } = useGetTasks();
  const { data: habits } = useGetHabits();
  const { data: schedule } = useGetDailySchedule();
  const { mutate: createTask } = useCreateTask();
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'مرحباً! أنا مدربك الشخصي. كيف يمكنني مساعدتك اليوم؟', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, suggestedTasks]);

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !attachedFile) || isLoading) return;

    const userMessage = inputMessage.trim();
    const currentFile = attachedFile;
    setInputMessage('');
    setAttachedFile(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date(), file: currentFile }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      
      const context = `
        Current Tasks: ${JSON.stringify(tasks?.map(t => ({ title: t.title, status: t.status })))}
        Current Habits: ${JSON.stringify(habits?.map(h => ({ name: h.name, streak: h.current_streak })))}
        Today's Schedule: ${JSON.stringify(schedule?.map(s => ({ title: s.task?.title, time: s.start_time })))}
      `;

      let parts = [{ text: SYSTEM_INSTRUCTION + "\n\nUser Context:\n" + context + "\n\nUser Message: " + userMessage }];

      if (currentFile) {
        // Need to read file as base64
        const fileBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(currentFile);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        
        parts.push({
          inlineData: {
            data: fileBase64,
            mimeType: currentFile.type
          }
        } as any);
      }

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: parts as any
      });

      const aiResponse = response.text || 'عذراً، لم أستطع معالجة طلبك.';
      
      setMessages(prev => [...prev, { role: 'model', content: aiResponse, timestamp: new Date() }]);
      
      // Simple heuristic for tasks
      if (aiResponse.includes('- ') || aiResponse.includes('Task:')) {
         // This is a naive extraction for demonstration.
         // A structured output API call would be better for real use cases.
      }

    } catch (error) {
      console.error('Chat Error:', error);
      addNotification('فشل الاتصال بالمدرب الذكي', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmTask = (task: any) => {
    createTask({ data: task }, {
      onSuccess: () => {
        addNotification('تم إضافة المهمة بنجاح', 'success');
        setSuggestedTasks(prev => prev.filter(t => t.id !== task.id));
      }
    });
  };

  const confirmAllTasks = () => {
    suggestedTasks.forEach(task => confirmTask(task));
  };
  
  const rejectTask = (task: any) => {
    setSuggestedTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const rejectAllTasks = () => {
    setSuggestedTasks([]);
  };

  const clearChat = () => {
    setMessages([{ role: 'model', content: 'مرحباً! أنا مدربك الشخصي. كيف يمكنني مساعدتك اليوم؟', timestamp: new Date() }]);
    setSuggestedTasks([]);
  };

  return (
    <ChatView 
      messages={messages}
      suggestedTasks={suggestedTasks}
      confirmTask={confirmTask}
      confirmAllTasks={confirmAllTasks}
      rejectTask={rejectTask}
      rejectAllTasks={rejectAllTasks}
      isLoading={isLoading}
      chatEndRef={chatEndRef}
      inputRef={inputRef}
      inputMessage={inputMessage}
      setInputMessage={setInputMessage}
      handleSendMessage={handleSendMessage}
      attachedFile={attachedFile}
      setAttachedFile={setAttachedFile}
      clearChat={clearChat}
    />
  );
};

