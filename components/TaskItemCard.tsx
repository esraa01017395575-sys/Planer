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
  Sparkles,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatTime12h } from "../lib/utils";
import { Draggable } from "@hello-pangea/dnd";
import { useLocation } from "wouter";
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
  onToggleSubtask?: (taskId: string, subtaskId: string, completed: boolean) => void;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  index,
  onEdit,
  onStatusChange,
  onStartPomodoro,
  onDeleted,
  projectMap,
  onToggleSubtask,
}) => {
  const { t, language, addNotification } = useAppContext();
  const [, setLocation] = useLocation();
  const [showAllSubtasks, setShowAllSubtasks] = useState(false);
  const { data: favoritesData, refetch: refetchFavorites } = useGetFavorites();
  const { toggleFavorite } = useToggleFavorite();
  const { mutate: deleteTask } = useDeleteTask();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const promptText = `how to do it in best way: "${task.title}"`;
                    setLocation(`/chat?prompt=${encodeURIComponent(promptText)}`);
                  }}
                  className="p-1 text-text-secondary hover:text-accent transition-colors"
                  title={language === "ar" ? "كيفية التنفيذ بأفضل طريقة (ذكاء اصطناعي)" : "How to do this task in the best way (AI)"}
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                </button>
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
                  {formatTime12h(task.scheduled_time)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Timer className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">
                  {task.spent_min ? `${task.spent_min}m / ` : ''}{task.estimated_min || 45}m
                </span>
              </div>
            </div>

            {task.subtasks?.length > 0 && (
              <div className="space-y-1.5 py-3 border-t border-border/30">
                {(showAllSubtasks ? task.subtasks : task.subtasks.slice(0, 2)).map((st: any) => (
                  <div
                    key={st.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleSubtask) {
                        onToggleSubtask(task.id, st.id, !st.completed);
                        // Play cast spell sound on complete!
                        if (!st.completed) {
                          import("../lib/audio-magic").then(m => m.playCastSpellSound()).catch(() => {});
                        }
                      }
                    }}
                    className="flex items-center gap-2 text-[11px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer group/subtask"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                        st.completed ? "bg-accent border-accent scale-105 shadow-sm shadow-accent/20" : "border-border group-hover/subtask:border-accent"
                      }`}
                    >
                      {st.completed && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <span
                      className={`line-clamp-1 flex-1 transition-all ${
                        st.completed ? "line-through opacity-40 text-text-secondary" : "text-text-primary"
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}

                {task.subtasks.length > 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllSubtasks(!showAllSubtasks);
                    }}
                    className="w-full text-center text-[10px] text-accent/80 hover:text-accent font-bold mt-1.5 flex items-center justify-center gap-1 hover:underline cursor-pointer"
                  >
                    {showAllSubtasks ? (
                      <>
                        {language === "ar" ? "عرض أقل ▲" : "Show Less ▲"}
                      </>
                    ) : (
                      <>
                        {language === "ar" ? `عرض الكل (${task.subtasks.length}) ▼` : `Show All (${task.subtasks.length}) ▼`}
                      </>
                    )}
                  </button>
                )}
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
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, "todo");
                        addNotification(
                          language === "ar"
                            ? "تمت إعادة المهمة لقائمة المهام النشطة"
                            : "Task moved back to To-Do",
                          "success"
                        );
                      }}
                      className="flex-1 bg-accent/10 text-accent px-3 py-2 rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-all border border-accent/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {language === "ar" ? "إعادة جدولة" : "Reschedule"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const confirmDelete = confirm(
                          language === "ar"
                            ? "هل أنت متأكد من حذف هذه المهمة الملغاة نهائياً؟"
                            : "Are you sure you want to delete this cancelled task permanently?"
                        );
                        if (!confirmDelete) return;

                        deleteTask(
                          { id: task.id },
                          {
                            onSuccess: () => {
                              onDeleted(task.id);
                              addNotification(
                                language === "ar"
                                  ? "تم حذف المهمة بنجاح"
                                  : "Task deleted successfully",
                                "success"
                              );
                            },
                          }
                        );
                      }}
                      className="flex-1 bg-red-500/10 text-red-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all border border-red-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {language === "ar" ? "حذف نهائي" : "Delete"}
                    </button>
                  </div>
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

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStatusMenu(!showStatusMenu);
                  }}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer rounded-lg hover:bg-bg-secondary/60"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showStatusMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div 
                        className="fixed inset-0 z-30 cursor-default"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStatusMenu(false);
                        }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 bottom-full mb-2 w-48 bg-bg-card border border-border/80 rounded-2xl shadow-2xl p-1.5 z-40"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-black text-text-secondary px-2.5 py-1 uppercase tracking-widest border-b border-border/20 mb-1">
                          {language === 'ar' ? 'نقل إلى:' : 'Move to:'}
                        </div>

                        {/* Option: Move to To Do */}
                        {task.status !== 'todo' && (
                          <button
                            type="button"
                            onClick={() => {
                              onStatusChange(task.id, 'todo');
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-accent/15 hover:text-accent transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span>📝</span>
                            <span>{language === 'ar' ? 'مهام متبقية' : 'To Do'}</span>
                          </button>
                        )}
                        {/* Option: Move to Doing */}
                        {task.status !== 'doing' && task.status !== 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => {
                              onStatusChange(task.id, 'doing');
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-accent/15 hover:text-accent transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span>⚡</span>
                            <span>{language === 'ar' ? 'قيد التنفيذ' : 'Doing'}</span>
                          </button>
                        )}
                        {/* Option: Move to Done */}
                        {task.status !== 'done' && (
                          <button
                            type="button"
                            onClick={() => {
                              onStatusChange(task.id, 'done');
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-accent/15 hover:text-accent transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span>🎉</span>
                            <span>{language === 'ar' ? 'مكتملة' : 'Done'}</span>
                          </button>
                        )}
                        {/* Option: Move to Cancelled */}
                        {task.status !== 'canceled' && (
                          <button
                            type="button"
                            onClick={() => {
                              onStatusChange(task.id, 'canceled');
                              setShowStatusMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span>🛑</span>
                            <span>{language === 'ar' ? 'ملغية' : 'Cancelled'}</span>
                          </button>
                        )}

                        <div className="h-px bg-border/20 my-1" />
                        
                        {/* Edit task option in menu */}
                        <button
                          type="button"
                          onClick={() => {
                            onEdit(task);
                            setShowStatusMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          <span>{language === 'ar' ? 'تعديل المهمة' : 'Edit Task'}</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DraggableAny>
  );
};
