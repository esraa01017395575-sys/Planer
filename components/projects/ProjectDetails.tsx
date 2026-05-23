import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit3, Trash2, Globe, Github, Calendar, Layers, Clock, Activity, BrainCircuit, Loader2 } from 'lucide-react';
import { Project, Session } from '../../types/projects';
import { ProgressBar } from './ProgressBar';
import { MilestoneTimeline } from './MilestoneTimeline';
import { SessionTracker } from './SessionTracker';
import { TimeLogger } from './TimeLogger';
import { AIAssistant } from './AIAssistant';
import { ProjectAnalytics } from './ProjectAnalytics';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'wouter';

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  projectId,
  onBack,
  onEdit,
  onDelete
}) => {
  const { language } = useAppContext();
  const isAr = language === 'ar';
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [location, setLocation] = useLocation();
  const segments = location.split('/').filter(Boolean);
  const urlTab = segments[2]?.toLowerCase() || 'milestones';
  
  const activeTab = urlTab === 'stopwatch' ? 'timer' :
                    urlTab === 'velocity' ? 'analytics' :
                    urlTab === 'advisor' ? 'ai' : 'timeline';

  const setActiveTab = (tab: 'timeline' | 'timer' | 'analytics' | 'ai') => {
    const tabUrl = tab === 'timer' ? 'stopwatch' :
                   tab === 'analytics' ? 'velocity' :
                   tab === 'ai' ? 'advisor' : 'milestones';
    setLocation(`/projects/${projectId}/${tabUrl}`);
  };

  const fetchWithAuth = async (url: string, init?: RequestInit) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const headers = {
        ...(init?.headers || {}),
      } as Record<string, string>;
      
      if (user) {
        headers['x-user-id'] = user.id;
      }
      return await fetch(url, {
        ...init,
        headers
      });
    } catch (e) {
      return await fetch(url, init);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProject(data);
    } catch (err) {
      console.error("Error loaded project detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (mIdx: number, tIdx: number) => {
    if (!project) return;
    
    // Simplistic toggle logic for demo robustness: 
    // Mark the milestone completed if we checked a task or update its progress
    const updatedMilestones = [...(project.milestones || [])];
    const currentMilestone = updatedMilestones[mIdx];
    
    // Toggle overall completion or progress
    const isCompleted = !currentMilestone.completed;
    currentMilestone.completed = isCompleted;

    // Recalculate estimated progress based on completed milestones
    const totalMilestones = updatedMilestones.length;
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const computedProgress = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: updatedMilestones,
          progress: computedProgress
        })
      });
      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error("Failed to save checked task milestone:", err);
    }
  };

  const handleSaveLoggedSession = async (sessionData: any) => {
    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      const data = await response.json();
      if (data.project) {
        setProject(data.project);
        setActiveTab('analytics'); // Redirect to productivity to see stats
      }
    } catch (e) {
      console.error("Failed to log workspace session:", e);
    }
  };

  const handleAddTaskToTodoList = async (taskName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert(isAr ? "الرجاء تسجيل الدخول أولاً" : "Please login first");
        return;
      }

      const { error } = await supabase.from('tasks').insert({
        title: taskName,
        user_id: user.id,
        project_id: projectId,
        priority: project?.priority || 'medium',
        due_date: new Date().toISOString().split('T')[0],
        status: 'todo',
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error("Error creating milestone task in todo list:", error);
        alert(isAr ? "فشل إضافة المهمة" : "Failed to add task to your To-Do list");
      } else {
        alert(isAr 
          ? `تمت إضافة "${taskName}" لقائمة مهامك اليومية بنجاح!` 
          : `Successfully added "${taskName}" to your daily To-Do board!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (confirm(isAr ? "هل أنت متأكد من رغبتك في حذف هذا المشروع؟" : "Are you sure you want to delete this project?")) {
      onDelete(projectId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 bg-bg-card rounded-2xl p-6">
        <h3 className="text-lg font-bold">{isAr ? "عذراً، لم نتمكن من العثور على المشروع" : "Sorry, we could not find the project"}</h3>
        <button onClick={onBack} className="mt-4 px-4 h-9 bg-accent text-white rounded-xl text-xs">{isAr ? "العودة للخلف" : "Go Back"}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper header action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="h-10 px-4 bg-bg-card hover:bg-bg-secondary border border-border/10 rounded-xl inline-flex items-center gap-2 text-xs font-bold font-display cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{isAr ? "الرجوع" : "Back"}</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(project.id)}
            className="p-2.5 bg-bg-card hover:bg-accent/15 hover:text-accent border border-border/10 rounded-xl transition-all cursor-pointer text-text-secondary"
            title={isAr ? "تعديل المشروع" : "Edit Project"}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 bg-bg-card hover:bg-red-500/15 hover:text-red-500 border border-border/10 rounded-xl transition-all cursor-pointer text-text-secondary"
            title={isAr ? "حذف المشروع" : "Delete Project"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main card panel header */}
      <div className="glass-card p-6 border-none shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-accent tracking-widest">{project.currentPhase || (isAr ? 'مرحلة التصميم' : 'Design Phase')}</span>
            <h2 className="font-display font-bold text-2xl text-text-primary leading-tight">{project.title}</h2>
            <p className="text-xs text-text-secondary leading-relaxed max-w-xl">{project.description || (isAr ? 'لا يوجد وصف للمشروع.' : 'No description provided.')}</p>
          </div>

          <div className="flex gap-4 p-4 bg-bg-secondary/40 rounded-2xl border border-border/10 shrink-0 self-stretch justify-around md:self-auto">
            <div className="text-center px-4">
              <span className="block text-[10px] font-mono font-bold text-text-secondary uppercase">{isAr ? 'ساعات العمل' : 'Hours Done'}</span>
              <span className="block text-lg font-bold text-text-primary mt-1">{project.totalHoursSpent || 0}{isAr ? 'س' : 'h'}</span>
            </div>
            <div className="w-px bg-border/10 self-stretch" />
            <div className="text-center px-4">
              <span className="block text-[10px] font-mono font-bold text-text-secondary uppercase">{isAr ? 'جلسات العمل' : 'Sessions'}</span>
              <span className="block text-lg font-bold text-accent mt-1">{project.completedSessions || 0}</span>
            </div>
          </div>
        </div>

        {/* Tech skills tags */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {project.technologies.map(tech => (
              <span key={tech} className="text-[10px] font-mono font-bold px-2 py-0.5 bg-bg-secondary border border-border/10 rounded-md text-text-secondary">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Outer Links */}
        <div className="flex gap-3.5 mt-5 pt-4 border-t border-border/5">
          {project.links?.github && (
            <a href={project.links.github} target="_blank" rel="noreferrer" className="text-xs text-text-secondary hover:text-accent font-medium inline-flex items-center gap-1.5 transition-colors">
              <Github className="w-4 h-4" />
              <span>{isAr ? 'مستودع الكود (GitHub)' : 'Code Repo (GitHub)'}</span>
            </a>
          )}
          {project.links?.live && (
            <a href={project.links.live} target="_blank" rel="noreferrer" className="text-xs text-text-secondary hover:text-accent font-medium inline-flex items-center gap-1.5 transition-colors">
              <Globe className="w-4 h-4" />
              <span>{isAr ? 'العرض المباشر (Demo)' : 'Live Demo'}</span>
            </a>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border/10 gap-6">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 text-xs font-bold font-display uppercase tracking-wider relative cursor-pointer ${
            activeTab === 'timeline' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>{isAr ? 'الأهداف والخطوات' : 'Milestones'}</span>
          {activeTab === 'timeline' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>

        <button
          onClick={() => setActiveTab('timer')}
          className={`pb-3 text-xs font-bold font-display uppercase tracking-wider relative cursor-pointer ${
            activeTab === 'timer' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>{isAr ? 'تتبع جلسة' : 'Stopwatch'}</span>
          {activeTab === 'timer' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs font-bold font-display uppercase tracking-wider relative cursor-pointer ${
            activeTab === 'analytics' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>{isAr ? 'الإنتاجية والبيانات' : 'Velocity'}</span>
          {activeTab === 'analytics' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 text-xs font-bold font-display uppercase tracking-wider relative cursor-pointer ${
            activeTab === 'ai' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>{isAr ? 'المساعد الذكي' : 'Advisor AI'}</span>
          {activeTab === 'ai' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>


      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <ProgressBar progress={project.progress} />
              
              <div className="bg-bg-card rounded-2xl p-5 border border-border/10 space-y-4">
                <span className="block text-xs font-bold text-text-secondary uppercase">
                  {isAr ? 'قائمة الأهداف والمراحل' : 'Milestone Breakdown'}
                </span>
                <MilestoneTimeline
                  milestones={project.milestones || []}
                  onToggleTask={handleToggleTask}
                  onAddTaskToTodo={handleAddTaskToTodoList}
                />
              </div>
            </div>
          )}

          {activeTab === 'timer' && (
            <div className="space-y-6">
              <SessionTracker
                project={project}
                onSaveSession={handleSaveLoggedSession}
              />

              <TimeLogger
                project={project}
                onLogTime={handleSaveLoggedSession}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <ProjectAnalytics projectId={project.id} />
          )}

          {activeTab === 'ai' && (
            <AIAssistant project={project} onRefreshProject={fetchProject} />
          )}


        </div>

        {/* Sidebar Info & Active Stats */}
        <div className="space-y-6">
          <div className="glass-card p-4 space-y-4 border border-border/10">
            <span className="block text-xs font-bold text-text-secondary uppercase">
              {isAr ? 'تفاصيل التتبع' : 'Trace Info'}
            </span>
            
            <div className="flex justify-between text-xs pb-2 border-b border-border/5">
              <span className="text-text-secondary">{isAr ? 'الأولوية:' : 'Priority:'}</span>
              <span className="font-bold uppercase text-accent font-mono">
                {isAr 
                  ? (project.priority === 'high' ? 'مرتفع' : project.priority === 'medium' ? 'متوسط' : 'منخفض') 
                  : project.priority}
              </span>
            </div>

            <div className="flex justify-between text-xs pb-2 border-b border-border/5">
              <span className="text-text-secondary">{isAr ? 'تاريخ البدء:' : 'Started:'}</span>
              <span className="font-bold text-text-primary">{project.startDate || project.createdAt.split('T')[0]}</span>
            </div>

            {project.targetEndDate && (
              <div className="flex justify-between text-xs pb-2 border-b border-border/5">
                <span className="text-text-secondary">{isAr ? 'المستهدف:' : 'Target End:'}</span>
                <span className="font-bold text-text-primary">{project.targetEndDate}</span>
              </div>
            )}

            <div className="flex justify-between text-xs">
              <span className="text-text-secondary">{isAr ? 'حالة المشروع:' : 'Status:'}</span>
              <span className="font-bold text-text-primary">
                {isAr 
                  ? (project.status === 'planning' ? 'تخطيط' : project.status === 'in-progress' ? 'قيد العمل' : project.status === 'on-hold' ? 'متوقف مؤقتاً' : 'مكتمل') 
                  : project.status}
              </span>
            </div>
          </div>

          {/* Quick AI Advisor Trigger shortcut */}
          {activeTab !== 'ai' && (
            <div className="p-4 bg-accent/5 border border-accent/15 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-text-primary">
                  {isAr ? 'مساعدة فورية من المرشد AI' : 'Instant help from AI Advisor'}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {isAr 
                  ? 'بإمكانك طلب تحليل شامل للمشروع بأثر فوري لحل أي عقبة برمجية تواجهها.' 
                  : 'You can request instant project review or plan generation helper to resolve any obstacles.'}
              </p>
              <button 
                onClick={() => setActiveTab('ai')} 
                className="w-full text-center py-2 bg-bg-secondary hover:bg-accent/10 hover:text-accent rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                {isAr ? 'انتقل للمساعد الذكي' : 'Use Assistant'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
