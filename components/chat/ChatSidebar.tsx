import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, MessageSquare, Edit2, Trash2 } from "lucide-react";

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  language: string;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSessionId,
  setCurrentSessionId,
  showSidebar,
  setShowSidebar,
  language,
  onRename,
  onDelete,
  onNewChat,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const startRename = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const submitRename = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  return (
    <>
      <motion.div
        id="chat-sidebar"
        initial={{ x: 400 }}
        animate={{ x: showSidebar ? 0 : 400 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-2 right-2 w-80 lg:w-96 bg-bg-secondary border border-border flex flex-col h-[calc(100vh-5rem)] z-50 rounded-[2rem] shadow-[-20px_0_50px_rgba(0,0,0,0.2)] overflow-hidden"
      >
        <div className="p-6 border-b border-border bg-bg-primary/50 backdrop-blur-md flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 font-display">
            {language === "ar" ? "تاريخ المحادثات" : "Chat History"}
          </h3>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-2 hover:bg-bg-primary rounded-xl text-text-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <button
            onClick={() => {
              onNewChat();
              setShowSidebar(false);
            }}
            className="w-full py-3 bg-accent/10 border border-accent/20 text-accent rounded-xl hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {language === "ar" ? "محادثة جديدة" : "New Chat"}
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
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-bg-primary/30 border-transparent text-text-secondary hover:bg-bg-primary hover:border-border"
              }`}
            >
              <div className={`flex items-center justify-between gap-3 ${language === "ar" ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-3 flex-1 min-w-0 ${language === "ar" ? "flex-row-reverse" : ""}`}>
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? "text-accent" : "text-text-secondary"}`} />
                  {editingSessionId === session.id ? (
                    <input
                      autoFocus
                      className={`bg-transparent border-none outline-none text-sm font-bold w-full p-0 ${language === "ar" ? "text-right" : "text-left"}`}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => submitRename(session.id)}
                      onKeyDown={(e) => e.key === "Enter" && submitRename(session.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className={`text-sm font-bold truncate w-full ${language === "ar" ? "text-right" : "text-left"}`}>{session.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(session);
                    }}
                    className="p-1.5 hover:text-accent cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session.id);
                    }}
                    className="p-1.5 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <span className={`text-[10px] opacity-40 mt-1 block font-mono ${language === "ar" ? "text-right" : "text-left"}`}>
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
                {language === "ar" ? "مسح المحادثة؟" : "Delete Conversation?"}
              </h3>
              <p className="text-text-secondary text-center mb-8">
                {language === "ar"
                  ? "هل أنتِ متأكدة؟ سيتم حذف جميع الرسائل نهائياً."
                  : "Are you sure? This will permanently delete all messages."}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onDelete(sessionToDelete);
                    setSessionToDelete(null);
                  }}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  {language === "ar" ? "حذف المحادثة" : "Delete Chat"}
                </button>
                <button
                  onClick={() => setSessionToDelete(null)}
                  className="w-full py-3 text-text-secondary font-medium hover:text-text-primary transition-all text-sm cursor-pointer"
                >
                  {language === "ar" ? "تراجع" : "Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
