import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Loader2, Paperclip, Sparkles, 
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

export const Chat = () => {
  const { t, language, addNotification } = useAppContext();
  const { data: tasks } = useGetTasks();
  const { data: habits } = useGetHabits();
  const { data: schedule } = useGetDailySchedule();
  const { mutate: createTask } = useCreateTask();
  
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string, timestamp: Date }[]>([
    { role: 'model', content: language === 'ar' ? 'مرحباً! أنا مدربك الشخصي. كيف يمكنني مساعدتك اليوم؟' : 'Hello! I am your personal coach. How can I help you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, suggestedTasks]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare context
      const context = `
        Current Tasks: ${JSON.stringify(tasks?.map(t => ({ title: t.title, status: t.status })))}
        Current Habits: ${JSON.stringify(habits?.map(h => ({ name: h.name, streak: h.current_streak })))}
        Today's Schedule: ${JSON.stringify(schedule?.map(s => ({ title: s.task?.title, time: s.start_time })))}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: SYSTEM_INSTRUCTION + "\n\nUser Context:\n" + context + "\n\nUser Message: " + userMessage
      });

      const aiResponse = response.text || (language === 'ar' ? 'عذراً، لم أستطع معالجة طلبك.' : 'Sorry, I could not process your request.');
      
      setMessages(prev => [...prev, { role: 'model', content: aiResponse, timestamp: new Date() }]);
      
      // Heuristic for task suggestions
      if (aiResponse.includes('- ') || aiResponse.includes('Task:')) {
         // Potential for extracting suggested tasks could go here
         // For now, let's keep it simple or mock some for UI demo if relevant
      }

    } catch (error) {
      console.error('Chat Error:', error);
      addNotification(language === 'ar' ? 'فشل الاتصال بالمدرب الذكي' : 'Failed to connect to AI Coach', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmTask = (task: any) => {
    createTask({ data: task }, {
      onSuccess: () => {
        addNotification(language === 'ar' ? 'تم إضافة المهمة بنجاح' : 'Task added successfully', 'success');
        setSuggestedTasks(prev => prev.filter(t => t.id !== task.id));
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-5xl mx-auto glass-card overflow-hidden bg-[#0f0c29]/95 backdrop-blur-xl border-white/10 shadow-2xl relative">
      {/* Header - مساحة الإبداع */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-inner">
                  <MessageSquare className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                  <h2 className="text-sm font-bold text-white font-serif leading-none mb-1">
                    {language === 'ar' ? 'حوار التخطيط الذكي' : 'Smart Planning Dialogue'}
                  </h2>
                  <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                        {language === 'ar' ? 'نحلل أفكارك لنبني واقعك' : 'Analyzing thoughts to build reality'}
                      </span>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMessages([messages[0]])}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500">
                <Info className="w-4 h-4" />
            </div>
          </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-scrollbar scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="relative mb-8">
                 <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20 animate-pulse"></div>
                 <div className="w-28 h-28 glass-card rounded-[2rem] flex items-center justify-center relative border border-white/10 bg-white/5 shadow-2xl">
                    <Brain className="w-14 h-14 text-indigo-300" />
                 </div>
            </div>
            <h3 className="text-4xl font-serif font-bold text-white mb-4">
              {language === 'ar' ? 'لنبدأ رحلتنا' : 'Start Your Journey'}
            </h3>
            <p className="text-gray-400 max-w-sm font-serif text-lg leading-relaxed">
              {language === 'ar' ? 'كل فكرة عظيمة تبدأ بكلمة واحدة.. أنا هنا لأسمعك.' : 'Every great idea starts with one word.. I am here to listen.'}
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
            <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-2xl relative ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-none'
                : 'glass-card text-gray-100 rounded-tl-none border border-white/10 bg-white/5 backdrop-blur-md'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                     <Brain className="w-4 h-4 text-indigo-300" />
                  </div>
                  <span className="text-xs font-bold text-indigo-300 font-serif tracking-widest uppercase">
                    {language === 'ar' ? 'شريكك الرقمي' : 'Digital Partner'}
                  </span>
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
        
        {/* بطاقة المسارات المقترحة */}
        {suggestedTasks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[2.5rem] p-8 border border-indigo-500/40 animate-pulse relative overflow-hidden bg-white/5 shadow-inner"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-cyan-400 to-indigo-600"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                     <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                    <span className="font-serif font-bold text-white text-2xl block">
                      {language === 'ar' ? 'مسارات مقترحة' : 'Suggested Paths'}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                      {language === 'ar' ? 'إليك ما استنتجته من حديثنا' : 'Based on our conversation'}
                    </span>
                </div>
              </div>
               <div className="flex items-center gap-3">
                <button 
                    className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-5 py-3 rounded-2xl transition-all flex items-center gap-2 font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/5"
                >
                    <Check className="w-4 h-4" />
                    {language === 'ar' ? 'تفعيل الجميع' : 'Enable All'}
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
                    <button 
                      onClick={() => confirmTask(task)}
                      className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 text-white"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-card rounded-[1.5rem] p-5 flex items-center gap-4 border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-gray-400 font-serif italic tracking-wide">
                {language === 'ar' ? 'جاري صياغة الرد...' : 'Crafting response...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29] to-transparent">
        <div className="max-w-4xl mx-auto relative group">
          <div className="glass-card rounded-[2.5rem] p-3 border border-indigo-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-end gap-3 bg-white/5 backdrop-blur-2xl transition-all focus-within:border-indigo-500/50 focus-within:shadow-indigo-500/10 ring-1 ring-white/5">
            <button className="p-4 rounded-[1.8rem] bg-white/5 text-gray-500 hover:text-indigo-300 transition-all hover:bg-white/10">
              <Paperclip className="w-6 h-6" />
            </button>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={language === 'ar' ? 'شاركني أفكارك أو تساؤلاتك...' : 'Share your thoughts or questions...'}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 py-4 max-h-32 resize-none font-serif text-lg leading-relaxed"
              rows={1}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-4 rounded-[1.8rem] transition-all duration-500 flex items-center justify-center ${
                input.trim()
                  ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.5)] hover:scale-110 active:scale-95'
                  : 'bg-white/5 text-gray-600'
              }`}
            >
              <ArrowRight className={`w-7 h-7 transition-all ${input.trim() ? 'translate-x-0' : 'opacity-0'}`} />
              {!input.trim() && <ArrowBigRightDash className="w-7 h-7 absolute opacity-50" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
