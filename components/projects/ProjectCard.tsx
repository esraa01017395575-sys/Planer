import React from 'react';
import { FolderGit2, Star, Calendar, Clock, ExternalLink, Github, BookOpen, Layers } from 'lucide-react';
import { Project } from '../../types/projects';
import { ProgressBar } from './ProgressBar';
import { useAppContext } from '../../context/AppContext';

interface ProjectCardProps {
  project: Project;
  onSelect: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const { language } = useAppContext();
  const isAr = language === 'ar';

  const statusColors = {
    planning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'in-progress': 'bg-accent/10 text-accent border-accent/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'on-hold': 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const priorityColors = {
    low: 'bg-text-secondary/10 text-text-secondary',
    medium: 'bg-blue-500/10 text-blue-400',
    high: 'bg-red-500/10 text-red-400',
  };

  const statusLabels = {
    planning: isAr ? 'تخطيط' : 'Planning',
    'in-progress': isAr ? 'قيد العمل' : 'In Progress',
    completed: isAr ? 'مكتمل' : 'Completed',
    'on-hold': isAr ? 'متوقف مؤقتاً' : 'On Hold',
  };

  return (
    <div 
      onClick={() => onSelect(project.id)}
      className="group relative glass-card p-5 cursor-pointer hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[240px]"
    >
      {/* Upper info */}
      <div>
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center text-accent group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all duration-350">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-text-primary tracking-tight group-hover:text-accent transition-colors line-clamp-1">
                {project.title}
              </h3>
              <p className="text-[10px] text-text-secondary mt-0.5 uppercase tracking-widest font-mono">
                {project.currentPhase || 'Phase 1'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[project.status]}`}>
              {statusLabels[project.status] || project.status}
            </span>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${priorityColors[project.priority]}`}>
              {project.priority.toUpperCase()}
            </span>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-4 h-9">
          {project.description || (isAr ? 'لا يوجد وصف للمشروع.' : 'No description provided.')}
        </p>

        {/* Technologies used */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.technologies.slice(0, 3).map((tech, i) => (
              <span key={i} className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-bg-secondary text-text-secondary border border-border/5 rounded-md">
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="text-[9px] font-mono font-bold px-1 bg-bg-secondary text-text-secondary rounded-md">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress & Lower info */}
      <div className="mt-auto space-y-3.5 pt-3.5 border-t border-border/5">
        <ProgressBar progress={project.progress} size="sm" showText={false} />

        <div className="flex items-center justify-between text-xs font-mono text-text-secondary pt-0.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>
              <strong>{project.totalHoursSpent || 0}</strong> / {project.estimatedHours || 0}{isAr ? 'س' : 'h'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {project.links?.github && (
              <a 
                href={project.links.github} 
                target="_blank" 
                rel="noreferrer" 
                onClick={(e) => e.stopPropagation()} 
                className="text-text-secondary hover:text-accent transition-colors p-1"
                title="GitHub Repo"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            )}
            {project.links?.live && (
              <a 
                href={project.links.live} 
                target="_blank" 
                rel="noreferrer" 
                onClick={(e) => e.stopPropagation()} 
                className="text-text-secondary hover:text-accent transition-colors p-1"
                title="Live Demo"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <span className="text-[10px] font-bold text-accent">
              {project.progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
