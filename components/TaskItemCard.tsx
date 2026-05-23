import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  Heart,
  GripVertical,
  Clock,
  Timer,
  Check,
  RotateCcw,
  Play,
  MoreHorizontal,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Draggable } from "@hello-pangea/dnd";
import { useAppContext } from "../context/AppContext";
import {
  useGetFavorites,
  useToggleFavorite,
  useDeleteTask,
} from "../lib/hooks";

const DraggableAny = Draggable as any;

interface TaskItemCardProps {
  task: any;
  index: number;
  onEdit: (task: any) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onStartPomodoro: (task: any) => void;
  onDeleted: (id: string) => void;
  projectMap?: Record<string, string>;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  index,
  onEdit,
  onStatusChange,
  onStartPomodoro,
  onDeleted,
  projectMap,
}) => {
  const { t, language, addNotification } = useAppContext();
  const { data: favoritesData, refetch: refetchFavorites } = useGetFavorites();
  const { toggleFavorite } = useToggleFavorite();
  const { mutate: deleteTask } = useDeleteTask();

  const [showReflectionId, setShowReflectionId] = useState<string | null>(null);

  const isFavorited = (id: string) =>
    favoritesData?.some((f) => f.source_id === id);
  const getFavorite = (id: string) =>
    favoritesData?.find((f) => f.source_id === id);

  const isDoingStatus = task.status === "in_progress";
  const isDoneStatus = task.status === "done";

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      type: "task",
      item_id: task.id,
      title: task.title,
      content: task.description,
      metadata: {
        priority: task.priority,
        scheduled_time: task.scheduled_time,
      },
    })
      .then((res) => {
        if (res.added) {
          addNotification(t("favorite_added"), "success");
          setShowReflectionId(task.id);
        } else {
          addNotification(t("favorite_removed"), "info");
          setShowReflectionId(null);
        }
        refetchFavorites();
      })
      .catch(() => {
        addNotification(t("error_saving_favorite"), "error");
      });
  };

  return (
    <DraggableAny draggableId={task.id.toString()} index={index}>
      {(draggableProvided: any) => (
        <div
          ref={draggableProvided.innerRef}
          {...draggableProvided.draggableProps}
          {...draggableProvided.dragHandleProps}
          className="group relative"
        >
          <motion.div
            onClick={() => onEdit(task)}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`glass-card p-5 border-l-[6px] transition-all duration-300 relative overflow-hidden group/card ${
              isDoingStatus
                ? "border-orange-500 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
                : isDoneStatus
                ? "border-emerald-500 opacity-60"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Flag
                  className={`w-4 h-4 shrink-0 col-span-1 ${
                    task.priority === "high"
                      ? "text-red-500 fill-red-500"
                      : task.priority === "medium"
                      ? "text-blue-500"
                      : "text-emerald-500"
                  }`}
                />
                <h3
                  className={`text-base font-bold text-text-primary leading-snug group-hover/card:text-accent transition-colors truncate ${
                    isDoneStatus ? "line-through opacity-50" : ""
                  }`}
                >
                  {task.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-1 transition-colors ${
                    isFavorited(task.id)
                      ? "text-red-500"
                      : "text-text-secondary hover:text-red-500"
                  }`}
                  title="Add to Favorites"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isFavorited(task.id) ? "fill-current" : ""
                    }`}
                  />
                </button>
                <div className="p-1 text-text-secondary">
                  <GripVertical className="w-3.5 h-3.5 cursor-grab" />
                </div>
              </div>
            </div>

            {task.project_id && projectMap && projectMap[task.project_id] && (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-lg border border-accent/20 mb-3 tracking-wide">
                <span>@</span>
                <span>{projectMap[task.project_id]}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-mono font-bold">
                  {task.scheduled_time
                    ? format(
                        parseISO(`2000-01-01T${task.scheduled_time}`),
                        "hh:mm a"
                      )
                    : "09:00 AM"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Timer className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">
                  {task.estimated_min || 45}m
                </span>
              </div>
            </div>

            {task.subtasks?.length > 0 && (
              <div className="space-y-1.5 py-3 border-t border-border/30">
                {task.subtasks.slice(0, 2).map((st: any) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 text-[11px] text-text-secondary"
                  >
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        st.completed ? "bg-accent border-accent" : "border-border"
                      }`}
                    >
                      {st.completed && (
                        <Check className="w-2 h-2 text-white mx-auto" />
                      )}
                    </div>
                    <span
                      className={`line-clamp-1 ${
                        st.completed ? "line-through opacity-40" : ""
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {showReflectionId === task.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="pt-3 mt-1 border-t border-border/30 space-y-2 pb-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                      🧠 Memory Reflection
                    </label>
                    <textarea
                      placeholder="Add reflections or notes..."
                      defaultValue={getFavorite(task.id)?.content || ""}
                      onBlur={(e) => {
                        const val = e.target.value;
                        toggleFavorite(
                          {
                            type: "task",
                            item_id: task.id,
                            title: task.title,
                            content: task.description,
                          },
                          val
                        ).then(() => {
                          refetchFavorites();
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const val = e.currentTarget.value;
                          toggleFavorite(
                            {
                              type: "task",
                              item_id: task.id,
                              title: task.title,
                              content: task.description,
                            },
                            val
                          ).then(() => {
                            refetchFavorites();
                            setShowReflectionId(null);
                            addNotification(
                              language === "ar" ? "تم حفظ الانعكاس بنجاح" : "Memory saved successfully",
                              "success"
                            );
                          });
                        }
                      }}
                      className="w-full bg-accent/5 border border-dashed border-accent/20 rounded-xl p-3 text-[11px] text-text-primary placeholder:text-accent/30 focus:ring-0 focus:border-accent transition-all resize-none min-h-[60px]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/30 relative">
              <div className="flex gap-2">
                {task.status === "draft" ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                      }}
                      className="bg-accent/10 text-accent px-3 py-2 rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-all shadow-sm border border-accent/20"
                    >
                      {t("reschedule")}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, "cancelled");
                      }}
                      className="bg-red-500/10 text-red-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"
                    >
                      {t("cancel")}
                    </button>
                  </>
                ) : task.status === "cancelled" ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const taskData = { ...task };
                      deleteTask(
                        { id: task.id },
                        {
                          onSuccess: () => {
                            onDeleted(task.id);
                            // Set custom editing trigger without id
                            onEdit({
                              ...taskData,
                              id: undefined,
                              status: "todo",
                            });
                          },
                        }
                      );
                    }}
                    className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all shadow-md border border-red-500/20 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {language === "ar" ? "مسح وإعادة جدولة" : "Delete & Reschedule"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDoneStatus) return;
                      onStartPomodoro(task);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                      isDoingStatus
                        ? "bg-orange-500 text-white shadow-orange-500/20 hover:scale-105"
                        : isDoneStatus
                        ? "bg-emerald-100 text-emerald-600 shadow-none cursor-default"
                        : "bg-accent text-white shadow-accent/20 hover:scale-105"
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {t("start_pomodoro")}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DraggableAny>
  );
};
