import { supabase } from './supabase';

export const profileService = {
  async getProfile(userId: string) {
    // Map app "profile" to the provided schema:
    // - public.users for name/email
    // - public.life_profiles for wake/sleep/energy
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', userId)
      .single();

    if (userErr) return { data: null, error: userErr };

    const { data: lifeRow, error: lifeErr } = await supabase
      .from('life_profiles')
      .select('wake_time, sleep_time, energy_peak')
      .eq('user_id', userId)
      .single();

    // If life_profile doesn't exist yet, user is not onboarded.
    if (lifeErr) {
      return {
        data: {
          name: userRow?.name ?? '',
          wakeTime: '',
          sleepTime: '',
          energyPeak: 'morning',
          isOnboarded: false,
        },
        error: null,
      };
    }

    const wakeTime = lifeRow?.wake_time ? String(lifeRow.wake_time).slice(0, 5) : '';
    const sleepTime = lifeRow?.sleep_time ? String(lifeRow.sleep_time).slice(0, 5) : '';
    const energyPeak = (lifeRow?.energy_peak ?? 'morning') as any;
    const isOnboarded = Boolean(wakeTime && sleepTime);

    return {
      data: {
        name: userRow?.name ?? '',
        wakeTime,
        sleepTime,
        energyPeak,
        isOnboarded,
      },
      error: null,
    };
  },
  async updateProfile(userId: string, updates: any) {
    const { data: usersData, error: usersErr } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    return { data: usersData, error: usersErr };
  }
};

export const taskService = {
  async getTasks(userId: string, date?: string) {
    // 1) Read schedule rows first.
    let scheduleQuery = supabase
      .from('daily_schedule')
      .select('id, task_id, date, slot, start_time, status, order_index')
      .eq('user_id', userId);

    if (date) scheduleQuery = scheduleQuery.eq('date', date);

    const { data: scheduleRows, error: scheduleErr } = await scheduleQuery.order('start_time', { ascending: true });
    if (scheduleErr) return { data: null, error: scheduleErr };
    if (!scheduleRows || scheduleRows.length === 0) return { data: [], error: null };

    // 2) Load tasks by schedule task_ids (with subtasks + attachments).
    const taskIds = scheduleRows.map((r: any) => r.task_id);
    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('*, subtasks(*), task_attachments(*)')
      .in('id', taskIds);

    if (tasksErr) return { data: null, error: tasksErr };

    const tasksById = new Map((tasks || []).map((t: any) => [t.id, t]));

    // 3) Merge schedule + task into one row for UI.
    const flattened = scheduleRows
      .map((row: any) => {
        const task = tasksById.get(row.task_id);
        if (!task) return null;
        return {
          ...task,
          due_date: row.date,
          scheduled_time: row.start_time,
          schedule_id: row.id,
          slot: row.slot,
          schedule_status: row.status,
          order_index: row.order_index,
        };
      })
      .filter(Boolean);

    return { data: flattened, error: null };
  },
  async getPendingTasks(userId: string, date: string) {
    const { data: scheduleRows, error: scheduleErr } = await supabase
      .from('daily_schedule')
      .select('id, task_id, date, slot, start_time, status, order_index')
      .eq('user_id', userId)
      .lt('date', date)
      .neq('status', 'done')
      .order('date', { ascending: false })
      .order('start_time', { ascending: true });

    if (scheduleErr) return { data: null, error: scheduleErr };
    if (!scheduleRows || scheduleRows.length === 0) return { data: [], error: null };

    const taskIds = scheduleRows.map((r: any) => r.task_id);
    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('*, subtasks(*), task_attachments(*)')
      .in('id', taskIds);

    if (tasksErr) return { data: null, error: tasksErr };

    const tasksById = new Map((tasks || []).map((t: any) => [t.id, t]));

    const flattened = scheduleRows
      .map((row: any) => {
        const task = tasksById.get(row.task_id);
        if (!task) return null;
        return {
          ...task,
          due_date: row.date,
          scheduled_time: row.start_time,
          schedule_id: row.id,
          slot: row.slot,
          schedule_status: row.status,
          order_index: row.order_index,
        };
      })
      .filter(Boolean);

    return { data: flattened, error: null };
  },
  async addTask(task: any) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    return { data, error };
  },
  async updateTask(taskId: string, updates: any) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    return { data, error };
  },
  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    return { error };
  },

  async createTaskWithSchedule(params: {
    user_id: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    source?: string;
    estimated_min?: number;
    goal_id?: string | null;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM
    slot?: string;
    subtasks?: { title: string; is_done?: boolean }[];
  }) {
    const {
      user_id,
      title,
      description,
      category,
      priority,
      status,
      source,
      estimated_min,
      goal_id,
      date,
      start_time,
      slot,
      subtasks,
    } = params;

    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        user_id,
        title,
        description: description || null,
        status: status || 'todo',
        priority: priority || 'medium',
        category: category || 'work',
        source: source || 'ai_suggested',
        estimated_min: estimated_min ?? 25,
        goal_id: goal_id ?? null,
      })
      .select('*')
      .single();

    if (taskErr) return { data: null, error: taskErr };

    if (subtasks && subtasks.length > 0) {
      const payload = subtasks
        .filter((s) => s && String(s.title || '').trim())
        .map((s, idx) => ({
          task_id: task.id,
          title: s.title,
          is_done: Boolean(s.is_done),
          order_index: idx,
        }));

      if (payload.length > 0) {
        const { error: stErr } = await supabase.from('subtasks').insert(payload);
        if (stErr) return { data: null, error: stErr };
      }
    }

    const { data: schedule, error: schedErr } = await supabase
      .from('daily_schedule')
      .insert({
        user_id,
        task_id: task.id,
        date,
        start_time,
        slot: slot || 'morning',
        status: status || 'todo',
        order_index: 0,
      })
      .select('*')
      .single();

    if (schedErr) return { data: null, error: schedErr };

    return { data: { task, schedule }, error: null };
  },
  // Subtasks
  async addSubtask(subtask: any) {
    const { data, error } = await supabase
      .from('subtasks')
      .insert(subtask)
      .select()
      .single();
    return { data, error };
  },
  async updateSubtask(subtaskId: string, updates: any) {
    const { data, error } = await supabase
      .from('subtasks')
      .update(updates)
      .eq('id', subtaskId);
    return { data, error };
  },
  async deleteSubtask(subtaskId: string) {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);
    return { error };
  },
  // Attachments
  async uploadAttachment(taskId: string, userId: string, file: File) {
    const filePath = `task-attachments/${userId}/${taskId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file);

    if (uploadError) return { error: uploadError };

    const { data: { publicUrl } } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size
      })
      .select()
      .single();

    return { data, error };
  }
};

export const habitService = {
  async getHabits(userId: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('id, title, category, frequency, xp_per_complete, current_streak, is_active, habit_logs (date, completed, xp_earned)')
      .eq('user_id', userId)
      .eq('is_active', true);
    return { data, error };
  },
  async completeHabit(habitId: string, userId: string) {
    const { error } = await supabase.rpc('complete_habit', {
      p_habit_id: habitId,
      p_user_id: userId,
    });
    return { error };
  },
  async deactivateHabit(habitId: string, userId: string) {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId)
      .eq('user_id', userId);
    return { error };
  }
};

export const noteService = {
  async getNotes(userId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error && (error.code === 'PGRST205' || error.message?.toLowerCase().includes('not found'))) {
      return { data: [], error: null };
    }
    return { data, error };
  },
  async addNote(note: any) {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
      .single();
    if (error && (error.code === 'PGRST205' || error.message?.toLowerCase().includes('not found'))) {
      return { data: null, error: null };
    }
    return { data, error };
  },
  async updateNote(noteId: string, updates: any) {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId);
    if (error && (error.code === 'PGRST205' || error.message?.toLowerCase().includes('not found'))) {
      return { data: null, error: null };
    }
    return { data, error };
  }
};

export const planService = {
  async getPlans(userId: string) {
    const { data, error } = await supabase
      .from('long_term_plans')
      .select('*')
      .eq('user_id', userId);
    if (!error) return { data, error: null };

    // Fallback for schemas that use goals instead of long_term_plans.
    const isMissingTable = error.code === 'PGRST205' || error.message?.toLowerCase().includes('not found');
    if (isMissingTable) {
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', userId);
      if (!goalsError) return { data: goals || [], error: null };
    }
    return { data, error };
  },
  async addPlan(plan: any) {
    const { data, error } = await supabase
      .from('long_term_plans')
      .insert(plan)
      .select()
      .single();
    return { data, error };
  }
};

export const messageService = {
  async getMessages(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
      .limit(limit);
    return { data, error };
  },
  async addMessage(message: any) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    return { data, error };
  }
};

export const favoriteService = {
  async getFavorites(userId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },
  async addFavorite(favorite: any) {
    const { data, error } = await supabase
      .from('favorites')
      .insert(favorite)
      .select()
      .single();
    return { data, error };
  },
  async deleteFavorite(favoriteId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId);
    return { error };
  }
};
