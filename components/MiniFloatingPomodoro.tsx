import React from "react";
import { motion } from "framer-motion";
import { Play, Pause, Plus, X } from "lucide-react";

interface MiniFloatingPomodoroProps {
  activePomodoro: any;
  isPomodoroMinimized: boolean;
  pomodoroPhase: "work" | "break";
  pomodoroTime: number;
  isPomodoroRunning: boolean;
  setIsPomodoroRunning: (running: boolean) => void;
  setIsPomodoroMinimized: (minimized: boolean) => void;
  onClose: () => void;
}

export const MiniFloatingPomodoro: React.FC<MiniFloatingPomodoroProps> = ({
  activePomodoro,
  isPomodoroMinimized,
  pomodoroPhase,
  pomodoroTime,
  isPomodoroRunning,
  setIsPomodoroRunning,
  setIsPomodoroMinimized,
  onClose,
}) => {
  if (!activePomodoro || !isPomodoroMinimized) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <div className="glass-card p-4 flex items-center gap-4 bg-bg-card border-border">
        <div className="flex flex-col">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              pomodoroPhase === "work" ? "text-accent" : "text-emerald-500"
            }`}
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
              onClick={onClose}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:text-white hover:bg-red-500 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
