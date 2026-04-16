import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Paperclip, Sparkles, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAppContext } from '../context/AppContext';
import { useGetTasks, useGetHabits, useGetDailySchedule } from '../lib/hooks';

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
  
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string, timestamp: Date }[]>([
    { role: 'model', content: language === 'ar' ? 'مرحباً! أنا مدربك الشخصي. كيف يمكنني مساعدتك اليوم؟' : 'Hello! I am your personal coach. How can I help you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        Current Habits: ${JSON.stringify(habits?.map(h => ({ name: h.name, streak: h.streak })))}
        Today's Schedule: ${JSON.stringify(schedule?.map(s => ({ title: s.title, time: s.time })))}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: SYSTEM_INSTRUCTION + "\n\nUser Context:\n" + context + "\n\nUser Message: " + userMessage
      });

      const aiResponse = response.text || (language === 'ar' ? 'عذراً، لم أستطع معالجة طلبك.' : 'Sorry, I could not process your request.');
      
      setMessages(prev => [...prev, { role: 'model', content: aiResponse, timestamp: new Date() }]);
    } catch (error) {
      console.error('Chat Error:', error);
      addNotification(language === 'ar' ? 'فشل الاتصال بالمدرب الذكي' : 'Failed to connect to AI Coach', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto glass-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between bg-accent/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center relative">
            <Bot className="w-6 h-6 text-accent" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-bg-primary rounded-full"></div>
          </div>
          <div>
            <h2 className="font-bold text-text-primary">AI Coach Pro</h2>
            <p className="text-xs text-text-secondary flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent" />
              {language === 'ar' ? 'نشط الآن - مدعوم بـ Gemini' : 'Active Now - Powered by Gemini'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="p-2 hover:bg-red-500/10 text-text-secondary hover:text-red-500 rounded-xl transition-all"
          title={t('clear_chat')}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-accent text-white' : 'bg-bg-secondary text-accent'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-accent text-white rounded-tr-none shadow-lg shadow-accent/20' 
                  : 'bg-bg-secondary text-text-primary rounded-tl-none border border-border'
              }`}>
                {msg.content}
                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center bg-bg-secondary p-4 rounded-2xl border border-border">
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
              <span className="text-xs text-text-secondary">AI Coach is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border bg-bg-secondary/30">
        <div className="relative flex items-center gap-4">
          <button className="p-3 hover:bg-accent/10 text-text-secondary hover:text-accent rounded-xl transition-all">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={language === 'ar' ? 'اسأل مدربك أي شيء...' : 'Ask your coach anything...'}
              className="w-full bg-bg-secondary border border-border rounded-2xl py-4 pl-6 pr-14 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all shadow-inner"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-accent text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-accent/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-text-secondary mt-4 uppercase tracking-widest opacity-50">
          {language === 'ar' ? 'الذكاء الاصطناعي قد يخطئ أحياناً. تأكد من مراجعة الخطط المهمة.' : 'AI can make mistakes. Please verify important plans.'}
        </p>
      </div>
    </div>
  );
};
