import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, CheckSquare, TriangleAlert, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { ProjectMilestone } from '../../types/projects';

interface MilestoneTimelineProps {
  milestones: ProjectMilestone[];
  onToggleTask?: (milestoneIndex: number, taskIndex: number) => void;
  onToggleMilestone?: (milestoneIndex: number) => void;
  onAddTaskToTodo?: (taskText: string) => void;
  readOnly?: boolean;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  milestones = [],
  onToggleTask,
  onToggleMilestone,
  onAddTaskToTodo,
  readOnly = false
}) => {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({ 0: true });

  const toggleExpand = (idx: number) => {
    setExpandedMilestones(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 bg-bg-secondary/40 rounded-2xl border border-border/10 p-6">
        <TriangleAlert className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium text-text-secondary">لا توجد أهداف محددة لهذا المشروع بعد. جرب استخدام المساعد الذكي!</p>
        <p className="text-xs text-text-secondary/60 mt-1">No milestones defined. Start with AI assistance or add them manually!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:top-4 before:bottom-4 before:w-px before:bg-border/20 ltr:before:left-6 rtl:before:right-6">
      {milestones.map((milestone, mIdx) => {
        const isCompleted = milestone.completed || false;
        const isExpanded = !!expandedMilestones[mIdx];

        return (
          <div key={mIdx} className="relative ltr:pl-12 rtl:pr-12">
            {/* Circle Node */}
            <button
              onClick={() => !readOnly && onToggleMilestone && onToggleMilestone(mIdx)}
              disabled={readOnly || !onToggleMilestone}
              className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-colors ${
                isCompleted 
                  ? 'bg-accent border-accent text-white shadow-md shadow-accent/20' 
                  : 'bg-bg-primary border-border text-text-secondary hover:border-accent'
              } ${languageIsArabic() ? 'right-3' : 'left-3'}`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Content Card */}
            <div className="glass-card p-4 transition-all hover:border-border/30">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0 pointer-events-auto cursor-pointer" onClick={() => toggleExpand(mIdx)}>
                  <h4 className={`font-bold text-sm tracking-tight ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                    {milestone.title}
                  </h4>
                  <div className="flex gap-4 mt-2 text-xs font-mono text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      {milestone.estimatedHours} س
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      {milestone.tasks?.length || 0} مهام
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => toggleExpand(mIdx)}
                  className="p-1.5 text-text-secondary hover:bg-accent/10 hover:text-accent rounded-lg transition-all"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Tasks List */}
              {isExpanded && milestone.tasks && milestone.tasks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/10 space-y-2">
                  {milestone.tasks.map((task, tIdx) => {
                    // Quick completion check if structure supports it;
                    // For flat simplicity let's support plain strings
                    return (
                      <div 
                        key={tIdx} 
                        className="flex items-center justify-between p-1.5 rounded-xl hover:bg-accent/5 transition-all text-xs group"
                      >
                        <label 
                          className={`flex items-start gap-3 cursor-pointer flex-1 ${
                            readOnly ? 'pointer-events-none' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isCompleted} // simplified tie to milestone completed for safety, or optional task index tracking
                            disabled={readOnly}
                            onChange={() => !readOnly && onToggleTask && onToggleTask(mIdx, tIdx)}
                            className="mt-0.5 rounded border-border text-accent focus:ring-accent w-4 h-4"
                          />
                          <span className="text-text-secondary leading-relaxed">{task}</span>
                        </label>
                        {!readOnly && onAddTaskToTodo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onAddTaskToTodo(task);
                            }}
                            title={languageIsArabic() ? "إرسال لمهام اليوم" : "Add to To-Do List"}
                            className="p-1 px-1.5 text-accent bg-accent/5 border border-accent/10 hover:bg-accent hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 md:opacity-60 flex items-center gap-1 cursor-pointer font-bold shrink-0 ml-2"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{languageIsArabic() ? "تنفيذ اليوم" : "Today"}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Simple helper to detect document direction
const languageIsArabic = () => {
  return document.documentElement.getAttribute('lang') === 'ar';
};
