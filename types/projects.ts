export interface Session { 
  id: string; 
  projectId: string; 
  title?: string; 
  description?: string; 
  date: string; // Date ISO string
  duration: number; // in minutes 
  tasksCompleted: string[]; 
  notes?: string; 
  mood?: 'productive' | 'stuck' | 'breakthrough'; 
  createdAt: string; // Date ISO string
}

export interface ProjectMilestone {
  title: string;
  estimatedHours: number;
  tasks: string[];
  completed?: boolean;
}

export interface Project { 
  id: string; 
  userId: string; 

  // Basic Info 
  title: string; 
  description: string; 
  thumbnail?: string; 
  images?: string[]; 

  // Technical Details 
  technologies: string[]; // ["React", "TypeScript", "Node.js"] 
  links: { 
    github?: string; 
    live?: string; 
    demo?: string; 
    figma?: string; 
  }; 

  // Project Management 
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold'; 
  priority: 'low' | 'medium' | 'high'; 

  // Time Tracking 
  estimatedHours: number; 
  totalHoursSpent: number; 
  plannedSessions: number; // mapped from plannedSesions
  plannedSesions?: number; // fallback support for typo in DB schema
  completedSessions: number; 

  // Sessions 
  sessions: Session[]; 

  // Progress & AI Context 
  progress: number; // 0-100% 
  currentPhase?: string; // "Design", "Development", "Testing" 
  lastMilestone?: string; 
  nextMilestone?: string; 
  aiContext?: string; // AI summary of where the project continued 
  milestones?: ProjectMilestone[];

  // Metadata 
  startDate?: string; 
  targetEndDate?: string; 
  completedDate?: string; 
  createdAt: string; 
  updatedAt: string;
}

export interface ProjectAISummary { 
  projectId: string; 
  lastUpdated: string; 

  summary: string; // A comprehensive summary of the project 
  completedFeatures: string[]; 
  pendingFeatures: string[]; 
  blockers: string[]; 
  suggestedNextSteps: string[];
}
