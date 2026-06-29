import React from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

interface Task {
  id: string;
  title: string;
  due_date?: string;
  daily_schedule?: string;
  status: "draft" | "todo" | "in_progress" | "done" | "cancelled" | string;
  [key: string]: any;
}

interface TaskCalendarViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  tasks: Task[];
  setEditingTask: (task: Task) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  selectedDate,
  setSelectedDate,
  tasks,
  setEditingTask,
}) => {
  const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const calendarDates: Date[] = [];
  for (let i = 0; i < 35; i++) {
    calendarDates.push(addDays(start, i));
  }

  return (
    <div id="task-calendar-view" className="flex-1 bg-bg-secondary/30 rounded-[3rem] border border-border overflow-hidden flex flex-col">
      <div className="grid grid-cols-7 border-b border-border bg-bg-primary/50 backdrop-blur-md">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-text-secondary border-r border-border last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-7">
        {calendarDates.map((date, idx) => {
          const targetStr = format(date, "yyyy-MM-dd");
          const dayTasks = tasks.filter((t) => {
            const cleanDue = t.due_date ? String(t.due_date).trim().slice(0, 10) : null;
            const cleanSched = t.daily_schedule ? String(t.daily_schedule).trim().slice(0, 10) : null;
            return cleanDue === targetStr || cleanSched === targetStr;
          });
          const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
          const isToday = isSameDay(date, new Date());

          return (
            <div
              key={idx}
              onClick={() => setSelectedDate(date)}
              className={`min-h-[120px] p-2 border-r border-b border-border last:border-r-0 flex flex-col gap-1 transition-all cursor-pointer hover:bg-bg-primary/40 ${
                !isCurrentMonth ? "opacity-20 grayscale" : ""
              }`}
            >
              <div className="flex items-center justify-between px-1 mb-1">
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? "w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20 scale-105"
                      : "text-text-secondary"
                  }`}
                >
                  {format(date, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                {dayTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTask(task);
                    }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold truncate transition-all ${
                      task.status === "done"
                        ? "bg-emerald-500/10 text-emerald-500 line-through"
                        : task.status === "in_progress"
                        ? "bg-orange-500/10 text-orange-500 ring-1 ring-orange-500"
                        : task.status === "cancelled"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-accent/10 text-accent ring-1 ring-accent/20"
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 4 && (
                  <div className="text-[8px] font-bold text-text-secondary px-2">
                    + {dayTasks.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
