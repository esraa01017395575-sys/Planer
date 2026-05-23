import React, { useState, useEffect } from 'react';
import { LayoutGrid, Clock, ClipboardList, Target, Sparkles, Loader2, ArrowLeft, Lightbulb } from 'lucide-react';
import { useLocation } from 'wouter';
import { Project } from '../types/projects';
import { ProjectGrid } from '../components/projects/ProjectGrid';
import { ProjectDetails } from '../components/projects/ProjectDetails';
import { ProjectForm } from '../components/projects/ProjectForm';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalHoursLogged: number;
  averageProgress: number;
  completionRate: number;
}

export const ProjectsPage: React.FC = () => {
  const { language } = useAppContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [location, setLocation] = useLocation();
  const segments = location.split('/').filter(Boolean);
  
  let view: 'grid' | 'new' | 'edit' | 'detail' = 'grid';
  let selectedProjectId: string | null = null;
  
  if (segments[0] === 'projects') {
    if (segments[1] === 'new') {
      view = 'new';
    } else if (segments[1]) {
      selectedProjectId = segments[1];
      if (segments[2] === 'edit') {
        view = 'edit';
      } else {
        view = 'detail';
      }
    }
  }

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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const resProj = await fetchWithAuth('/api/projects');
      const dataProj = await resProj.json();
      setProjects(dataProj || []);

      // Fetch stats
      const resStats = await fetchWithAuth('/api/projects/stats');
      const dataStats = await resStats.json();
      setStats(dataStats || null);
    } catch (e) {
      console.error("Error loaded projects screen data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      const response = await fetchWithAuth('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (response.ok) {
        setLocation('/projects');
        await fetchData(); // refresh list & stats
      }
    } catch (e) {
      console.error("Failed creating project:", e);
    }
  };

  const handleUpdateProject = async (projectData: Partial<Project>) => {
    if (!selectedProjectId) return;
    try {
      const response = await fetchWithAuth(`/api/projects/${selectedProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (response.ok) {
        setLocation(`/projects/${selectedProjectId}/milestones`); // Go back to detailed view
        await fetchData();
      }
    } catch (e) {
      console.error("Failed updating project:", e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setLocation('/projects');
        await fetchData();
      }
    } catch (e) {
      console.error("Failed deleting project:", e);
    }
  };

  const getSelectedProject = () => {
    return projects.find(p => p.id === selectedProjectId);
  };

  const isAr = language === 'ar';

  return (
    <div className="space-y-6">
      {/* Visual Workspace Hero Cards (Only visible on Main Grid View) */}
      {view === 'grid' && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-display font-bold text-2xl text-text-primary tracking-tight">
                {isAr ? 'إدارة وتتبع المشاريع البرمجية' : 'Developer Projects Console'}
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                {isAr ? 'تخطيط أهدافك البرمجية والمهنية وقياس ساعات عملك بذكاء' : 'Formulate goals, structure deliverables, log sessions, and track real-time progress.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 border border-border/10">
              <span className="block text-[10px] font-mono font-bold text-text-secondary uppercase">
                {isAr ? 'المشاريع الكلية' : 'Total Projects'}
              </span>
              <span className="block text-2xl font-bold text-text-primary mt-1">{stats?.totalProjects || 0}</span>
            </div>

            <div className="glass-card p-4 border border-border/10">
              <span className="block text-[10px] font-mono font-bold text-text-secondary uppercase">
                {isAr ? 'ساعات العمل المسجلة' : 'Hours Logged'}
              </span>
              <span className="block text-2xl font-bold text-accent mt-1">
                {stats?.totalHoursLogged || 0}{isAr ? ' س' : 'h'}
              </span>
            </div>

            <div className="glass-card p-4 border border-border/10">
              <span className="block text-[10px] font-mono font-bold text-text-secondary uppercase">
                {isAr ? 'معدل التقدم' : 'Average Progress'}
              </span>
              <span className="block text-2xl font-bold text-indigo-400 mt-1">{stats?.averageProgress || 0}%</span>
            </div>

            <div className="glass-card p-4 border border-border/10">
              <span className="block text-[10px] font-mono font-bold text-text-secondary uppercase">
                {isAr ? 'نسبة الاكتمال' : 'Completion Rate'}
              </span>
              <span className="block text-2xl font-bold text-emerald-500 mt-1">{stats?.completionRate || 0}%</span>
            </div>
          </div>
        </>
      )}

      {/* Screen Routing Logic */}
      {view === 'grid' && (
        <ProjectGrid
          projects={projects}
          isLoading={loading}
          onSelectProject={(id) => {
            setLocation(`/projects/${id}/milestones`);
          }}
          onAddProjectClick={() => setLocation('/projects/new')}
        />
      )}

      {view === 'new' && (
        <div className="glass-card p-6 border-none shadow-2xl">
          <ProjectForm
            onSave={handleCreateProject}
            onCancel={() => setLocation('/projects')}
          />
        </div>
      )}

      {view === 'edit' && (
        <div className="glass-card p-6 border-none shadow-2xl">
          <ProjectForm
            initialData={getSelectedProject()}
            onSave={handleUpdateProject}
            onCancel={() => setLocation(`/projects/${selectedProjectId}/milestones`)}
          />
        </div>
      )}

      {view === 'detail' && selectedProjectId && (
        <ProjectDetails
          projectId={selectedProjectId}
          onBack={() => {
            setLocation('/projects');
            fetchData(); // Refresh grid layout numbers
          }}
          onEdit={() => setLocation(`/projects/${selectedProjectId}/edit`)}
          onDelete={handleDeleteProject}
        />
      )}
    </div>
  );
};
