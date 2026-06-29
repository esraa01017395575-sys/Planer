import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit3, Trash2, Globe, Github, Calendar, Layers, Clock, Activity, BrainCircuit, Loader2, Plus, Check } from 'lucide-react';
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
  const { language, addNotification } = useAppContext();
  const isAr = language === 'ar';
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  
  const fetchProjectTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);
      if (data) {
        setProjectTasks(data);
      }
    } catch (e) {
      console.error("Error loading project tasks:", e);
    }
  };

  useEffect(() => {
    fetchProjectTasks();
  }, [projectId]);
  
  // Custom milestones creation states
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneHours, setNewMilestoneHours] = useState(4);
  const [newMilestoneTaskInput, setNewMilestoneTaskInput] = useState('');
  const [newMilestoneTasks, setNewMilestoneTasks] = useState<string[]>([]);
  const [showAddManual, setShowAddManual] = useState(false);
  const [activeTab, setActiveTabLocal] = useState<'timeline' | 'timer' | 'analytics' | 'ai'>('timeline');

  const [location, setLocation] = useLocation();
  const segments = location.split('/').filter(Boolean);
  const urlTab = segments[2]?.toLowerCase() || 'milestones';
  
  const currentActiveTab = urlTab === 'stopwatch' ? 'timer' :
                           urlTab === 'velocity' ? 'analytics' :
                           urlTab === 'advisor' ? 'ai' : 'timeline';

  // sync tab state with URL
  useEffect(() => {
    setActiveTabLocal(currentActiveTab);
  }, [currentActiveTab]);

  const setActiveTab = (tab: 'timeline' | 'timer' | 'analytics' | 'ai') => {
    setActiveTabLocal(tab);
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

  const updateProjectMilestones = async (milestonesArray: any[]) => {
    if (!project) return;
    const totalMilestones = milestonesArray.length;
    const completedCount = milestonesArray.filter(m => m.completed).length;
    const computedProgress = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

    try {
      const response = await fetchWithAuth(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: milestonesArray,
          progress: computedProgress
        })
      });
      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error("Failed to save project milestones:", err);
      addNotification(isAr ? "فشل حفظ التعديلات" : "Failed to save updates", "error");
    }
  };

  const handleAddMilestone = async (title: string, hours: number, tasks: string[]) => {
    if (!project) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      addNotification(isAr ? "الرجاء كتابة عنوان الهدف أولاً" : "Please enter milestone title first", "error");
      return;
    }
    const newMilestone = {
      title: cleanTitle,
      estimatedHours: hours || 1,
      tasks: tasks.filter(t => t.trim().length > 0),
      completed: false
    };
    const updatedMilestones = [...(project.milestones || []), newMilestone];
    await updateProjectMilestones(updatedMilestones);
    addNotification(isAr ? "تمت إضافة هدف/مرحلة جديدة بنجاح! 🎯" : "New milestone added successfully! 🎯", "success");
  };

  const handleDeleteMilestone = async (mIdx: number) => {
    if (!project) return;
    const updatedMilestones = (project.milestones || []).filter((_, idx) => idx !== mIdx);
    await updateProjectMilestones(updatedMilestones);
    addNotification(isAr ? "تم حذف الهدف بنجاح." : "Milestone deleted successfully.", "success");
  };

  const handleAddSubtaskToDraft = () => {
    const clean = newMilestoneTaskInput.trim();
    if (clean) {
      setNewMilestoneTasks(prev => [...prev, clean]);
      setNewMilestoneTaskInput('');
    }
  };

  const handleRemoveSubtaskFromDraft = (indexToRemove: number) => {
    setNewMilestoneTasks(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveDraftMilestone = async () => {
    if (!newMilestoneTitle.trim()) {
      addNotification(isAr ? "الرجاء إدخال عنوان الهدف أولاً" : "Please enter milestone title first", "error");
      return;
    }
    await handleAddMilestone(newMilestoneTitle, newMilestoneHours, newMilestoneTasks);
    // Reset states
    setNewMilestoneTitle('');
    setNewMilestoneHours(4);
    setNewMilestoneTasks([]);
    setNewMilestoneTaskInput('');
  };

  const getDynamicSuggestions = () => {
    const techs = project?.technologies || [];
    const base = [
      {
        title: isAr ? 'إعداد هيكل المشروع والملفات' : 'Project Initialization & Boilerplate',
        estimatedHours: 4,
        tasks: [
          isAr ? 'تهيئة مستودع GitHub' : 'Initialize GitHub repository',
          isAr ? 'تثبيت المكتبات والاعتمادات الأساسية' : 'Install standard NPM dependencies',
          isAr ? 'إعداد ملفات البيئة والمتغيرات السحرية' : 'Configure env variables and developer config'
        ]
      },
      {
        title: isAr ? 'تصميم واجهات المستخدم والنماذج الأولية' : 'UI/UX Mockups & Design System',
        estimatedHours: 6,
        tasks: [
          isAr ? 'رسم تدفق الصفحات والواجهات' : 'Design page layouts and routes',
          isAr ? 'تخصيص لوحة الألوان والخطوط مع Tailwind' : 'Setup customized themes and fonts'
        ]
      },
      {
        title: isAr ? 'نظام التسجيل والمصادقة' : 'User Authentication & Profiles',
        estimatedHours: 8,
        tasks: [
          isAr ? 'تصميم واجهة تسجيل الدخول والترحيب' : 'Build interactive Login & onboarding flow',
          isAr ? 'ربط المصادقة بـ Supabase / Firebase' : 'Connect auth APIs'
        ]
      }
    ];

    if (techs.length > 0) {
      techs.forEach(t => {
        base.push({
          title: isAr ? `بناء وتكامل ميزات ${t}` : `Build & Integrate ${t} logic`,
          estimatedHours: 8,
          tasks: [
            isAr ? `تثبيت وتجهيز موديول ${t}` : `Install and initialize ${t} module`,
            isAr ? `تطوير المنطق البرمجي الخاص بـ ${t}` : `Develop customized workflows using ${t}`
          ]
        });
      });
    }

    return base;
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
        addNotification(isAr ? "الرجاء تسجيل الدخول أولاً" : "Please login first", "error");
        return;
      }

      const todayLocalStr = new Date().toLocaleDateString('en-CA');

      const { error } = await supabase.from('tasks').insert({
        title: taskName,
        user_id: user.id,
        project_id: projectId,
        priority: project?.priority || 'medium',
        due_date: todayLocalStr,
        status: 'todo',
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error("Error creating milestone task in todo list:", error);
        addNotification(isAr ? "فشل إضافة المهمة" : "Failed to add task to your To-Do list", "error");
      } else {
        addNotification(isAr 
          ? `تمت إضافة "${taskName}" لقائمة مهامك اليومية بنجاح! 📌` 
          : `Successfully added "${taskName}" to your daily To-Do board! 📌`, "success");
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
                  onDeleteMilestone={handleDeleteMilestone}
                />
              </div>

              {/* Add Milestone Section */}
              <div className="bg-bg-card rounded-2xl p-5 border border-border/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/10 pb-3">
                  <span className="block text-xs font-bold text-text-secondary uppercase">
                    {isAr ? 'تخصيص وإضافة أهداف للمشروع' : 'Customize & Add Milestones'}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddManual(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        !showAddManual 
                          ? 'bg-accent/15 text-accent border border-accent/20' 
                          : 'text-text-secondary hover:bg-bg-secondary'
                      }`}
                    >
                      {isAr ? '💡 المقترحات الذكية' : '💡 Smart Suggestions'}
                    </button>
                    <button
                      onClick={() => setShowAddManual(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        showAddManual 
                          ? 'bg-accent/15 text-accent border border-accent/20' 
                          : 'text-text-secondary hover:bg-bg-secondary'
                      }`}
                    >
                      {isAr ? '🎯 إضافة يدوية' : '🎯 Add Manually'}
                    </button>
                  </div>
                </div>

                {!showAddManual ? (
                  /* Dynamic Suggestions Grid */
                  <div className="space-y-4">
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {isAr 
                        ? 'إليك قائمة بأهداف مقترحة ذكياً بناءً على تقنيات وطبيعة مشروعك الحالي. يمكنك إضافتها لجدولك بنقرة واحدة:' 
                        : 'Here are recommended milestones generated for your project based on your tech stack. Click "+" to instantly add:'}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                      {getDynamicSuggestions().map((sug, sIdx) => {
                        // Check if already in project milestones to prevent obvious duplicate
                        const alreadyExists = project.milestones?.some(m => m.title.toLowerCase() === sug.title.toLowerCase());
                        
                        return (
                          <div 
                            key={sIdx} 
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                              alreadyExists 
                                ? 'bg-bg-secondary/40 border-border/5 opacity-50' 
                                : 'bg-bg-secondary/20 border-border/10 hover:border-accent/25 hover:bg-bg-secondary/30'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="font-bold text-xs text-text-primary tracking-tight leading-tight">{sug.title}</h5>
                                <span className="text-[10px] font-mono text-accent shrink-0 font-bold bg-accent/5 px-1.5 py-0.5 rounded-md">
                                  {sug.estimatedHours} {isAr ? 'س' : 'h'}
                                </span>
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-[10px] text-text-secondary pl-1 pt-1.5">
                                {sug.tasks.map((tsk, tIdx) => (
                                  <li key={tIdx} className="truncate" title={tsk}>{tsk}</li>
                                ))}
                              </ul>
                            </div>

                            <button
                              onClick={() => !alreadyExists && handleAddMilestone(sug.title, sug.estimatedHours, sug.tasks)}
                              disabled={alreadyExists}
                              className={`w-full py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                                alreadyExists
                                  ? 'bg-border/10 text-text-secondary/50 cursor-not-allowed'
                                  : 'bg-accent/10 hover:bg-accent hover:text-white text-accent'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{alreadyExists ? (isAr ? 'مضاف مسبقاً' : 'Already Added') : (isAr ? 'إضافة للخطوات' : 'Add to Milestones')}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Manual Insertion Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">{isAr ? 'عنوان الهدف / المرحلة' : 'Milestone Title'}</label>
                        <input
                          type="text"
                          value={newMilestoneTitle}
                          onChange={(e) => setNewMilestoneTitle(e.target.value)}
                          placeholder={isAr ? "مثال: إكمال تصميم واجهات الصفحة الرئيسية" : "e.g. Complete Landing Page Designs"}
                          className="w-full h-10 px-3 bg-bg-secondary/40 border border-border/10 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">{isAr ? 'الساعات المتوقعة' : 'Est. Hours'}</label>
                        <input
                          type="number"
                          value={newMilestoneHours}
                          onChange={(e) => setNewMilestoneHours(parseInt(e.target.value) || 0)}
                          className="w-full h-10 px-3 bg-bg-secondary/40 border border-border/10 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    </div>

                    {/* Task checklist manager inside milestone */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase">
                        {isAr ? 'المهام والخطوات الفرعية (إجباري لإضافة مهام قابلة للتتبع)' : 'Subtasks / Steps Checklists'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMilestoneTaskInput}
                          onChange={(e) => setNewMilestoneTaskInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtaskToDraft();
                            }
                          }}
                          placeholder={isAr ? "اضغط Enter أو زر الزائد للإضافة..." : "Type subtask and press enter..."}
                          className="flex-1 h-10 px-3 bg-bg-secondary/40 border border-border/10 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubtaskToDraft}
                          className="h-10 px-3.5 bg-bg-secondary hover:bg-accent/15 hover:text-accent border border-border/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer text-text-secondary"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Draft subtasks list */}
                      {newMilestoneTasks.length > 0 && (
                        <div className="p-3 bg-bg-secondary/30 rounded-xl border border-border/5 space-y-2 max-h-[140px] overflow-y-auto">
                          {newMilestoneTasks.map((t, index) => (
                            <div key={index} className="flex items-center justify-between text-xs text-text-secondary">
                              <span className="truncate flex-1">• {t}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubtaskFromDraft(index)}
                                className="text-red-500 hover:text-red-400 p-1 font-bold font-mono shrink-0 cursor-pointer text-[10px]"
                              >
                                {isAr ? 'إزالة' : 'Remove'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveDraftMilestone}
                      className="w-full h-10 bg-accent hover:bg-opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAr ? 'إضافة الهدف لقائمة المشروع' : 'Save Milestone'}</span>
                    </button>
                  </div>
                )}
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
          {/* Project Linked Tasks Card */}
          <div className="glass-card p-4 space-y-4 border border-border/10">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-bold text-text-secondary uppercase">
                {isAr ? 'المهام المرتبطة بالمشروع' : 'Project Linked Tasks'}
              </span>
              <span className="text-[10px] font-black bg-accent/15 text-accent px-2 py-0.5 rounded-md">
                {projectTasks.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
              {projectTasks.length === 0 ? (
                <p className="text-[11px] text-text-secondary text-center py-4">
                  {isAr ? 'لا توجد مهام يومية مرتبطة بهذا المشروع بعد.' : 'No daily tasks linked to this project yet.'}
                </p>
              ) : (
                projectTasks.map((t) => (
                  <div key={t.id} className="p-2.5 bg-bg-secondary/40 border border-border/5 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text-primary truncate">{t.title}</p>
                      <span className="text-[9px] text-text-secondary font-medium font-mono">
                        {t.status === 'done' ? (isAr ? '✅ مكتملة' : '✅ Done') : (isAr ? '⏳ قيد المذاكرة' : '⏳ Doing')}
                        {t.spent_min ? ` • ${t.spent_min}m` : ''}
                      </span>
                    </div>
                    {t.status !== 'done' && (
                      <button
                        onClick={async () => {
                          const { error } = await supabase.from('tasks').update({ status: 'done' }).eq('id', t.id);
                          if (!error) {
                            fetchProjectTasks();
                            fetchProject(); // refresh project stats if any
                            addNotification(isAr ? 'تم إكمال المهمة المرتبطة بنجاح!' : 'Linked task completed successfully!', 'success');
                          }
                        }}
                        className="p-1 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                        title={isAr ? 'تحديد كمكتمل' : 'Mark as Done'}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

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
