import React from "react";
import { format, addDays, isSameDay } from "date-fns";
import { ChevronRight, Zap, Settings, Calendar, Plus } from "lucide-react";

interface TaskHeaderProps {
  t: (key: string) => string;
  language: string;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  view: "kanban" | "calendar";
  setView: (v: "kanban" | "calendar") => void;
  onNewTask: () => void;
}

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

export const TaskHeader: React.FC<TaskHeaderProps> = ({
  t,
  language,
  selectedDate,
  setSelectedDate,
  isFocusMode,
  setIsFocusMode,
  view,
  setView,
  onNewTask,
}) => {
  return (
    <header id="task-header" className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 pb-2">
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
          onClick={onNewTask}
          className="bg-accent text-accent-foreground px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>
    </header>
  );
};
