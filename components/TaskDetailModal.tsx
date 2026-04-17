import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Sparkles, Loader2, Link2, Bell,
  Flag, Clock, Calendar, BarChart3, Timer, FileText,
  ChevronDown, Check, Target
} from 'lucide-react';
import { useUpdateTask, useDeleteTask } from '../lib/hooks';
import { useAppContext } from '../context/AppContext';

type Priority = 'low' | 'medium' | 'high';
type Status = 'todo' | 'in_progress' | 'done' | 'cancelled';
type PomodoroType = 'classic' | 'deep_work';

type Subtask = { id?: string; title: string; is_done: boolean };
type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: Status;
  priority?: Priority;
  scheduled_time?: string | null;
  end_time?: string | null;
  estimated_min?: number | null;
  pomodoro_type?: PomodoroType | null;
  memory_notes?: string | null;
  goal_id?: string | null;
  task_references?: string[] | null;
  due_date?: string | null;
  subtasks?: Subtask[];
};

type Props = {
  task: Task;
  onClose: () => void;
  onUpdated: () => void;
  onStartPomodoro: (task: Task) => void;
};

const PRIORITIES: { value: Priority; label: string; icon: string; color: string; bg: string }[] = [
  { value: 'high', label: 'High', icon: '🏴', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  { value: 'medium', label: 'Normal', icon: '🏴', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  { value: 'low', label: 'Low', icon: '🏴', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/30' },
];

const STATUSES: { value: Status; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-secondary-foreground' },
  { value: 'in_progress', label: 'Doing', color: 'bg-accent' },
  { value: 'done', label: 'Done', color: 'bg-primary' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-muted-foreground' },
];

export function TaskDetailModal({ task, onClose, onUpdated, onStartPomodoro }: Props) {
  const { mutate: updateTask, isPending: isSaving } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { addNotification } = useAppContext();

  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority as Priority,
    scheduled_time: task.scheduled_time || '',
    end_time: task.end_time || '',
    estimated_min: task.estimated_min || 30,
    pomodoro_type: (task.pomodoro_type || 'classic') as PomodoroType,
    memory_notes: task.memory_notes || '',
    goal_id: task.goal_id || '',
    due_date: task.due_date || '',
    task_references: (task.task_references || []) as string[],
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [newRef, setNewRef] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'refs' | 'notes'>('details');

  const curPriority = PRIORITIES.find(p => p.value === form.priority) || PRIORITIES[4];

  const handleSave = () => {
    // Mapping form fields to schema
    const dbData = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority || 'medium',
      scheduled_time: form.scheduled_time || null,
      estimated_min: form.estimated_min,
      due_date: form.due_date || null,
      subtasks: subtasks // Hook handles subtasks
    };

    updateTask(
      { id: task.id, data: dbData as any },
      {
        onSuccess: () => {
          addNotification('✅ تم حفظ التغييرات', 'success');
          onUpdated();
          onClose();
        },
        onError: () => addNotification('فشل الحفظ', 'error'),
      }
    );
  };

  const handleDelete = () => {
    deleteTask({ id: task.id }, {
      onSuccess: () => {
        addNotification('🗑️ تم حذف المهمة', 'success');
        onUpdated();
        onClose();
      },
      onError: () => addNotification('فشل الحذف', 'error'),
    });
  };

  const handleGenerateSubtasks = async () => {
    // Basic implementation since AI endpoint is not confirmed
    addNotification('AI subtask generation is not yet configured for this project', 'info');
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [...prev, { title: newSubtask.trim(), is_done: false }]);
    setNewSubtask('');
  };

  const addRef = () => {
    if (!newRef.trim()) return;
    setForm(f => ({ ...f, task_references: [...f.task_references, newRef.trim()] }));
    setNewRef('');
  };

  const toggleSubtask = (i: number) => {
    setSubtasks(prev => prev.map((s, idx) => idx === i ? { ...s, is_done: !s.is_done } : s));
  };

  const removeSubtask = (i: number) => setSubtasks(prev => prev.filter((_, idx) => idx !== i));
  const removeRef = (i: number) => setForm(f => ({ ...f, task_references: f.task_references.filter((_, idx) => idx !== i) }));

  const doneCount = subtasks.filter(s => s.is_done).length;
  const progressPct = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div
          className="bg-card glass-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Top header */}
          <div className="flex items-start justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <button
                  onClick={() => setShowPriorityMenu(m => !m)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg hover:scale-105 transition-all ${curPriority.bg}`}
                  title="Priority"
                >
                  {curPriority.icon}
                </button>
                {showPriorityMenu && (
                  <div className="absolute top-11 left-0 bg-card glass-card border border-border rounded-xl shadow-xl z-10 py-2 w-40 overflow-hidden">
                    {PRIORITIES.map(p => (
                      <button
                        key={String(p.value)}
                        onClick={() => { setForm(f => ({ ...f, priority: p.value })); setShowPriorityMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-sm font-medium ${form.priority === p.value ? 'bg-secondary' : ''}`}
                      >
                        <span className="text-base">{p.icon}</span>
                        <span className={p.color}>{p.label}</span>
                        {form.priority === p.value && <Check size={14} className="ml-auto text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="flex-1 text-xl font-display font-bold bg-transparent outline-none border-b border-transparent focus:border-primary transition-colors min-w-0"
                placeholder="عنوان المهمة..."
              />
            </div>
            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={() => onStartPomodoro(task)}
                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                title="بومودورو"
              >
                <Timer size={18} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-secondary/20">
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => setForm(f => ({ ...f, status: s.value }))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${form.status === s.value ? 'bg-background border border-border shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                {s.label}
              </button>
            ))}
            {subtasks.length > 0 && (
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <span>{doneCount}/{subtasks.length}</span>
              </div>
            )}
          </div>

          <div className="flex border-b border-border/30 px-5 bg-secondary/10">
            {(['details', 'subtasks', 'refs', 'notes'] as const).map(tab => {
              const labels: Record<string, string> = { details: 'التفاصيل', subtasks: `المهام الفرعية (${subtasks.length})`, refs: 'المراجع', notes: 'الملاحظات' };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">الوصف</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="أضف وصفاً للمهمة..."
                    rows={3}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Clock size={12} /> وقت البدء
                    </label>
                    <input
                      type="time"
                      value={form.scheduled_time}
                      onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Clock size={12} /> وقت الانتهاء
                    </label>
                    <input
                      type="time"
                      value={form.end_time}
                      onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Calendar size={12} /> تاريخ الاستحقاق
                    </label>
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <BarChart3 size={12} /> المدة (دقيقة)
                    </label>
                    <input
                      type="number"
                      value={form.estimated_min}
                      onChange={e => setForm(f => ({ ...f, estimated_min: Number(e.target.value) }))}
                      min={5} max={480} step={5}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Timer size={12} /> نوع البومودورو
                  </label>
                  <div className="flex gap-3">
                    {(['classic', 'deep_work'] as PomodoroType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setForm(f => ({ ...f, pomodoro_type: type }))}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${form.pomodoro_type === type ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground hover:border-primary/40'}`}
                      >
                        {type === 'classic' ? '🍅 Classic 25/5' : '🧠 Deep Work 50/10'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subtasks' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateSubtasks}
                    disabled={isGeneratingSubtasks || !form.title.trim()}
                    className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    {isGeneratingSubtasks
                      ? <><Loader2 size={14} className="animate-spin" /> جاري التوليد...</>
                      : <><Sparkles size={14} /> توليد بالذكاء الاصطناعي</>
                    }
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSubtask()}
                    placeholder="أضف مهمة فرعية..."
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-all text-sm"
                  />
                  <button onClick={addSubtask} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  {subtasks.map((st, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group ${st.is_done ? 'bg-secondary/50 border-border/30' : 'bg-secondary border-border'}`}>
                      <button
                        onClick={() => toggleSubtask(i)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${st.is_done ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}
                      >
                        {st.is_done && <Check size={10} className="text-primary-foreground" />}
                      </button>
                      <span className={`flex-1 text-sm ${st.is_done ? 'line-through text-muted-foreground' : ''}`}>{st.title}</span>
                      <button
                        onClick={() => removeSubtask(i)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {subtasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      لا توجد مهام فرعية بعد
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'refs' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newRef}
                    onChange={e => setNewRef(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addRef()}
                    placeholder="https://..."
                    type="url"
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary transition-all text-sm font-mono"
                  />
                  <button onClick={addRef} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  {form.task_references.map((ref, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary group">
                      <Link2 size={14} className="text-primary shrink-0" />
                      <a href={ref} target="_blank" rel="noreferrer" className="flex-1 text-sm text-primary hover:underline truncate font-mono">
                        {ref}
                      </a>
                      <button onClick={() => removeRef(i)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {form.task_references.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">لا توجد مراجع مضافة</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className="text-primary" />
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ملاحظات شخصية</label>
                </div>
                <textarea
                  value={form.memory_notes}
                  onChange={e => setForm(f => ({ ...f, memory_notes: e.target.value }))}
                  placeholder="اكتب ملاحظاتك الشخصية حول هذه المهمة..."
                  rows={8}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">يمكنك حفظ هذه الملاحظات في المفضلة لاحقاً</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-5 border-t border-border/50 bg-secondary/10">
            <div className="flex gap-2">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={16} /> حذف
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive font-bold">تأكيد الحذف؟</span>
                  <button onClick={handleDelete} disabled={isDeleting} className="px-3 py-1.5 bg-destructive text-white rounded-lg text-sm font-bold hover:bg-destructive/90 transition-colors disabled:opacity-50">
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'نعم، احذف'}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm font-bold">لا</button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm">
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.title.trim()}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {isSaving ? <><Loader2 size={14} className="animate-spin" /> حفظ...</> : 'حفظ التغييرات'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
