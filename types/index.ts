export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface LifeProfile {
  user_id: string;
  wake_time: string;
  sleep_time: string;
  work_start: string;
  work_end: string;
  energy_peak: string;
  life_areas: string[];
}

export interface UserXP {
  user_id: string;
  total_xp: number;
  level: number;
  streak_days: number;
  last_active: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  source?: string;
  due_date?: string;
  scheduled_time?: string;
  end_time?: string;
  pomodoro_enabled?: boolean;
  pomodoro_work_min?: number;
  pomodoro_break_min?: number;
  memory_notes?: string;
  references_urls?: string[];
  estimated_min?: number;
  xp_reward?: number;
  goal_id?: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  order_index: number;
}

export interface DailySchedule {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  slot: string;
  start_time: string;
  status: string;
  order_index: number;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  category: 'spiritual' | 'health' | 'learning' | 'productivity' | 'social';
  frequency: string;
  target_per_week: number;
  current_streak: number;
  xp_per_complete: number;
  is_active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  completed_at: string;
  xp_earned: number;
}

export interface LongTermPlan {
  id: string;
  user_id: string;
  title: string;
  type: string;
  start_date: string;
  target_date: string;
  status: string;
  phases: any;
  ai_summary?: string;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  section_id?: string;
  is_pinned: boolean;
  created_at: string;
}

export interface NoteSection {
  id: string;
  user_id: string;
  name: string;
  color: string;
  order_index: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  source_type: 'task' | 'note' | 'manual';
  source_id?: string;
  title: string;
  content: string;
  created_at: string;
}

export * from './projects';
