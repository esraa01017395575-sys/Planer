import React, { useState } from 'react';
import { Save, BrainCircuit, X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Project, ProjectMilestone } from '../../types/projects';
import { useAppContext } from '../../context/AppContext';

interface ProjectFormProps {
  initialData?: Project;
  onSave: (data: Partial<Project>) => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSave,
  onCancel
}) => {
  const { language } = useAppContext();
  const isAr = language === 'ar';

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [techInput, setTechInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>(initialData?.technologies || []);
  const [github, setGithub] = useState(initialData?.links?.github || '');
  const [live, setLive] = useState(initialData?.links?.live || '');
  const [figma, setFigma] = useState(initialData?.links?.figma || '');
  
  const [status, setStatus] = useState<Project['status']>(initialData?.status || 'planning');
  const [priority, setPriority] = useState<Project['priority']>(initialData?.priority || 'medium');
  const [estimatedHours, setEstimatedHours] = useState<number>(initialData?.estimatedHours || 10);
  const [plannedSessions, setPlannedSessions] = useState<number>(initialData?.plannedSessions || 5);
  const [currentPhase, setCurrentPhase] = useState(initialData?.currentPhase || 'Design');
  const [targetEndDate, setTargetEndDate] = useState(initialData?.targetEndDate || '');
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(initialData?.milestones || []);

  const [aiLoading, setAiLoading] = useState(false);

  // Add tag
  const handleAddTech = () => {
    const clean = techInput.trim();
    if (clean && !technologies.includes(clean)) {
      setTechnologies(prev => [...prev, clean]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (tag: string) => {
    setTechnologies(prev => prev.filter(t => t !== tag));
  };

  // AI Estimation
  const handleAIEstimate = async () => {
    if (!title.trim()) {
      return alert(isAr ? "الرجاء إدخال اسم المشروع أولاً." : "Please fill in project title first.");
    }
    setAiLoading(true);

    try {
      const response = await fetch('/api/ai/estimate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });

      const data = await response.json();
      if (data) {
        setMilestones(data.milestones || []);
        setEstimatedHours(data.totalEstimatedHours || 20);
        setPlannedSessions(data.suggestedSessions || 10);
        if (data.technologies && data.technologies.length > 0) {
          // Merge unique tech
          setTechnologies(prev => Array.from(new Set([...prev, ...data.technologies])));
        }
      }
    } catch (err) {
      console.error("AI estimation error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      description,
      technologies,
      links: { github, live, figma },
      status,
      priority,
      estimatedHours: Number(estimatedHours) || 12,
      plannedSessions: Number(plannedSessions) || 6,
      currentPhase,
      targetEndDate,
      milestones
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Visual Header */}
      <div className="flex justify-between items-center pb-4 border-b border-border/10">
        <div>
          <h3 className="font-display font-bold text-lg text-text-primary">
            {initialData 
              ? (isAr ? 'تعديل بيانات المشروع' : 'Edit Project') 
              : (isAr ? 'مشروع مهني جديد' : 'New Career Project')}
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {isAr ? 'ابنِ أفكارك وتتبع الساعات بذكاء' : 'Formulate ideas and track progress elegantly'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
              {isAr ? 'اسم المشروع' : 'Project Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAr ? "مثال: لوحة تحكم التتبع والمؤشرات البرمجية..." : "E.g., Developer Analytics Dashboard..."}
              required
              className="w-full h-11 px-4 rounded-xl bg-bg-card border border-border/15 font-medium text-sm focus:border-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
              {isAr ? 'وصف الفكرة والمخرجات' : 'Idea & Objectives'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isAr ? "اكتب فكرتك بالتفصيل، ما هي الوظائف التي تريد برمجتها، والهدف من التعلم..." : "Describe the details, learners goal, tech motivations or expected features..."}
              rows={4}
              className="w-full p-4 rounded-xl bg-bg-card border border-border/15 text-sm"
            />
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">
              {isAr ? 'التقنيات المستخدمة' : 'Technology Stack'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTech())}
                placeholder={isAr ? "مثال: React, TailwindCSS, Express..." : "E.g., React, Tailwind, Express..."}
                className="w-full h-11 px-4 rounded-xl bg-bg-card border border-border/15 text-sm"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="h-11 px-4 bg-bg-secondary hover:bg-accent hover:text-white rounded-xl border border-border/10 text-xs font-bold transition-all cursor-pointer"
              >
                {isAr ? 'إضافة' : 'Add'}
              </button>
            </div>

            {technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {technologies.map((tech) => (
                  <span key={tech} className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 bg-bg-secondary text-text-secondary border border-border/10 rounded-lg">
                    {tech}
                    <button type="button" onClick={() => handleRemoveTech(tech)} className="hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ⚡ AI Auto Decompose Assistant Button */}
          {!initialData && (
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-accent flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-accent animate-pulse" />
                  {isAr ? 'تقدير وتقسيم ذكي للمهام من الذكاء الاصطناعي' : 'AI Intelligent Planning & Estimation'}
                </h4>
                <p className="text-[11px] text-text-secondary mt-1 max-w-md">
                  {isAr 
                    ? 'دع المساعد الذكي يولد أهداف المشروع (Milestones)، ويقترح التقنيات المثالية، ويحسب تقدير الساعات!' 
                    : 'Let Gemini generate custom milestones, suggest top stack candidates, and estimate total hours!'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAIEstimate}
                disabled={aiLoading}
                className="h-10 px-4 bg-accent hover:bg-accent/90 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20 shrink-0 ml-auto sm:ml-0"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جاري تفتيت المشروع...' : 'Decomposing milestones...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'خطط لي المشروع' : 'Plan with AI'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Render parsed/loaded milestones inside Form */}
          {milestones.length > 0 && (
            <div className="space-y-3.5 p-4 bg-bg-card/40 border border-border/15 rounded-2xl">
              <span className="block text-xs font-bold text-text-secondary uppercase">
                {isAr ? 'أهداف المشروع والمراحل المقترحة' : 'Suggested Milestones'}
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {milestones.map((m, index) => (
                  <div key={index} className="p-3 bg-bg-secondary rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-text-primary block">{m.title}</span>
                      <span className="text-[10px] text-text-secondary mt-1 block font-mono">
                        {m.tasks?.length || 0} {isAr ? 'مهام مقترحة' : 'tasks suggested'}
                      </span>
                    </div>
                    <span className="text-accent font-mono font-bold">{m.estimatedHours} {isAr ? 'س' : 'h'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar settings (Col 3) */}
        <div className="space-y-5">
          {/* Status & Priority */}
          <div className="glass-card p-4 space-y-4 border border-border/10">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                {isAr ? 'حالة العمل' : 'Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 text-xs text-text-primary"
              >
                <option value="planning">{isAr ? 'التخطيط' : 'Planning'}</option>
                <option value="in-progress">{isAr ? 'قيد العمل' : 'In Progress'}</option>
                <option value="on-hold">{isAr ? 'متوقف مؤقتاً' : 'On Hold'}</option>
                <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                {isAr ? 'الأهمية والأولوية' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 text-xs text-text-primary"
              >
                <option value="high">{isAr ? '🔥 مرتفعة' : '🔥 High'}</option>
                <option value="medium">{isAr ? '⚡ متوسطة' : '⚡ Medium'}</option>
                <option value="low">{isAr ? '💤 منخفضة' : '💤 Low'}</option>
              </select>
            </div>
          </div>

          {/* Time Tracking Estimation */}
          <div className="glass-card p-4 space-y-4 border border-border/10">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                {isAr ? 'الساعات المقدرة' : 'Estimated Hours'}
              </label>
              <input
                type="number"
                min="1"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 text-sm font-mono text-center font-bold text-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                {isAr ? 'الجلسات المخططة' : 'Needed Sessions'}
              </label>
              <input
                type="number"
                min="1"
                value={plannedSessions}
                onChange={(e) => setPlannedSessions(Number(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 text-sm font-mono text-center font-bold text-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                {isAr ? 'المرحلة الحالية' : 'Active Phase'}
              </label>
              <input
                type="text"
                value={currentPhase}
                onChange={(e) => setCurrentPhase(e.target.value)}
                placeholder={isAr ? "مثال: البرمجة، التصميم..." : "E.g., Coding, Design..."}
                className="w-full h-11 px-4 rounded-xl bg-bg-secondary border border-border/15 text-xs font-medium text-text-primary"
              />
            </div>
          </div>

          {/* Links */}
          <div className="glass-card p-4 space-y-3.5 border border-border/10">
            <span className="block text-xs font-bold text-text-secondary uppercase">
              {isAr ? 'الروابط الخارجية للمشروع' : 'Workspace Links'}
            </span>
            
            <input
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder={isAr ? "رابط مستودع GitHub..." : "GitHub Repo URL..."}
              className="w-full h-10 px-3.5 rounded-lg bg-bg-secondary border border-border/15 text-xs text-text-primary"
            />

            <input
              type="text"
              value={live}
              onChange={(e) => setLive(e.target.value)}
              placeholder={isAr ? "الرابط المباشر للمشروع..." : "Live Project Demo URL..."}
              className="w-full h-10 px-3.5 rounded-lg bg-bg-secondary border border-border/15 text-xs text-text-primary"
            />

            <input
              type="text"
              value={figma}
              onChange={(e) => setFigma(e.target.value)}
              placeholder={isAr ? "رابط ملف التصميم (Figma)..." : "Figma Design URL..."}
              className="w-full h-10 px-3.5 rounded-lg bg-bg-secondary border border-border/15 text-xs text-text-primary"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3.5 pt-4 border-t border-border/10">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-5 bg-bg-secondary border border-border/10 rounded-xl font-bold text-text-secondary text-xs transition-colors cursor-pointer"
        >
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={aiLoading}
          className="h-11 px-6 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20"
        >
          <Save className="w-4 h-4" />
          <span>{isAr ? 'حفظ المشروع' : 'Save Project'}</span>
        </button>
      </div>
    </form>
  );
};
