import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Plus, Loader2, Info } from 'lucide-react';
import { Project } from '../../types/projects';
import { ProjectCard } from './ProjectCard';
import { useAppContext } from '../../context/AppContext';

interface ProjectGridProps {
  projects: Project[];
  isLoading: boolean;
  onSelectProject: (id: string) => void;
  onAddProjectClick: () => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects = [],
  isLoading,
  onSelectProject,
  onAddProjectClick
}) => {
  const { language } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const isAr = language === 'ar';

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.technologies?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || p.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [projects, searchTerm, statusFilter, priorityFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-sm text-text-secondary">
          {isAr ? 'جاري تحميل المشاريع...' : 'Loading projects...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? "البحث في مشاريعك وتقنياتك..." : "Search projects & tech..."}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-bg-card border border-border/15 text-sm font-medium focus:border-accent"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-text-secondary" />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl bg-bg-card border border-border/15 text-xs text-text-primary"
          >
            <option value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="planning">{isAr ? 'التخطيط' : 'Planning'}</option>
            <option value="in-progress">{isAr ? 'قيد العمل' : 'In Progress'}</option>
            <option value="on-hold">{isAr ? 'متوقف مؤقتاً' : 'On Hold'}</option>
            <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-11 px-4 rounded-xl bg-bg-card border border-border/15 text-xs text-text-primary"
          >
            <option value="all">{isAr ? 'كل الأهمية' : 'All Priorities'}</option>
            <option value="high">{isAr ? 'مرتفع' : 'High'}</option>
            <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
            <option value="low">{isAr ? 'منخفض' : 'Low'}</option>
          </select>

          {/* Create Button */}
          <button
            onClick={onAddProjectClick}
            className="h-11 px-5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent/15 cursor-pointer ml-auto md:ml-0 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'مشروع جديد' : 'New Project'}</span>
          </button>
        </div>
      </div>

      {/* Grid displays */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelectProject}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-bg-card/40 rounded-3xl border border-dashed border-border/20 p-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
            <Info className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-text-primary">
            {isAr ? 'لم يتم العثور على أي مشاريع' : 'No projects found'}
          </h3>
          <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto leading-relaxed">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? (isAr ? 'جرّب تعديل كلمات البحث أو عوامل التصفية للعثور على النتائج المطلوبة.' : 'Try adjusting your search or filters to find the requested results.')
              : (isAr ? 'ابدأ فكرة جديدة واصنع تقدماً في مسيرتك المهنية! اطلب المساعدة من الذكاء الاصطناعي لتخطيط مشروعك الأول.' : 'Start a new idea and make progress in your career! Ask AI to help plan your first project.')}
          </p>
          <button
            onClick={onAddProjectClick}
            className="mt-6 px-6 h-11 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'ابدأ مشروعك الأول' : 'Deploy first project'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
