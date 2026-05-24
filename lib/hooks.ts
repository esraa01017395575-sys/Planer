import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAppContext } from '../context/AppContext';

export const useGetDailySchedule = (options?: { date?: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async (silent = false) => {
    if (!silent && data.length === 0) setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const dateFilter = options?.date || new Date().toISOString().split('T')[0];
    
    // Fetch tasks where daily_schedule matches the filtered date
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('daily_schedule', dateFilter)
      .order('scheduled_time');

    if (error) {
      console.error('Error fetching schedule:', error);
    } else {
      // Map to the same structure expected by the UI (wrapping task)
      setData(tasks?.map(t => ({ task: t, id: t.id, start_time: t.scheduled_time })) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedule();
  }, [options?.date]);

  return { data, loading, isLoading: loading, refetch: fetchSchedule };
};

export const useGetHabits = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHabits = async (silent = false) => {
    try {
      if (!silent && data.length === 0) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      // Updated to match schema: using habit_logs join if exists, or fallback
      const { data: habits, error } = await supabase
        .from('habits')
        .select(`
          *,
          habit_logs (
            id,
            completed_at,
            xp_earned
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching habits:', error);
      } else if (habits) {
        const processed = habits.map(habit => {
          // Check if any log is from today
          const completedToday = habit.habit_logs?.some((log: any) => {
            const logDate = new Date(log.completed_at).toISOString().split('T')[0];
            return logDate === today;
          });
          
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            return habit.habit_logs?.some((log: any) => {
               const logDate = new Date(log.completed_at).toISOString().split('T')[0];
               return logDate === dateStr;
            }) || false;
          });

          return {
            ...habit,
            completed_today: completedToday,
            week_logs: last7Days
          };
        });
        setData(processed);
      }
    } catch (err) {
      console.error('Unexpected error in fetchHabits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  return { data, loading, isLoading: loading, refetch: fetchHabits };
};

export const useGetTasks = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async (silent = false) => {
    try {
      if (!silent && data.length === 0) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch root tasks and their subtasks via join
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else if (allTasks) {
        // Map results to hierarchy expected by UI
        const tasksWithHierarchy = allTasks.map(task => ({
          ...task,
          subtasks: (task.subtasks || []).map((c: any) => ({
            ...c,
            completed: c.status === 'done' || c.is_done // Support both flags for UI compatibility
          }))
        }));
        setData(tasksWithHierarchy);
      }
    } catch (err) {
      console.error('Unexpected error in fetchTasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return { data, loading, isLoading: loading, refetch: fetchTasks };
};

export const useGetDailyQuote = () => {
  const [data, setData] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const { data: quotes, error } = await supabase
          .from('quotes')
          .select('text')
          .limit(10); // Get a pool and pick one (simplified daily logic)

        if (!error && quotes && quotes.length > 0) {
          // Select one based on day of year
          const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
          const index = dayOfYear % quotes.length;
          setData(quotes[index].text);
        } else {
          // Fallback pool
          const fallbacks = [
            "Your future is created by what you do today, not tomorrow.",
            "Focus on being productive instead of busy.",
            "The secret of getting ahead is getting started.",
            "Efficiency is doing things right; effectiveness is doing the right things.",
            "It is not daily increase, but daily decrease. Hack away at the unessential.",
            "Productivity is never an accident. It is always the result of a commitment to excellence.",
            "Done is better than perfect.",
            "Design your day, before it designs you.",
            "Action is the foundational key to all success.",
            "Discipline is choosing between what you want now and what you want most."
          ];
          const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
          setData(fallbacks[dayOfYear % fallbacks.length]);
        }
      } catch (err) {
        console.error('Error fetching quote:', err);
        setData("The leading rule for the lawyer, as for the man of every calling, is diligence.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, []);

  return { data, loading, isLoading: loading };
};

export const useCompleteHabit = () => {
  const completeHabit = async ({ id }: { id: string }, options?: { onSuccess?: () => void, onError?: (err: any) => void }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.rpc('complete_habit', {
        p_habit_id: id,
        p_user_id: user.id
      });

      if (error) {
        console.warn('RPC complete_habit failed, falling back to manual update', error);
        
        const { error: logError } = await supabase.from('habit_logs').insert({
          habit_id: id,
          user_id: user.id,
          completed_at: new Date().toISOString()
        });

        if (logError) throw logError;

        // Atomic increment of streak if possible, or simple fetch and set
        const { data: habit } = await supabase.from('habits').select('current_streak').eq('id', id).single();
        if (habit) {
          await supabase.from('habits').update({
            current_streak: (habit.current_streak || 0) + 1,
            updated_at: new Date().toISOString()
          }).eq('id', id);
        }
      }

      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Complete Habit Error:', err);
      if (options?.onError) options.onError(err);
    }
  };

  return { mutate: completeHabit };
};

export const useCreateHabit = () => {
  const [isPending, setIsPending] = useState(false);

  const createHabit = async ({ data }: { data: any }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.from('habits').insert({
        ...data,
        user_id: user.id,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Create Habit Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: createHabit, isPending };
};

export const useUpdateTask = () => {
  const [isPending, setIsPending] = useState(false);
  const updateTask = async ({ id, data }: { id: string, data: any }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { subtasks, ...taskFields } = data;

      const { error } = await supabase
        .from('tasks')
        .update({
          ...taskFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Handle subtasks using subtasks table
      if (subtasks && Array.isArray(subtasks)) {
        // 1. Get current subtask IDs from database to identify removals
        const { data: currentSubs } = await supabase.from('subtasks').select('id').eq('task_id', id);
        const currentIds = currentSubs?.map(s => s.id) || [];
        const incomingIds = subtasks.filter(st => st.id && st.id.length > 20).map(st => st.id);
        const idsToDelete = currentIds.filter(cid => !incomingIds.includes(cid));

        if (idsToDelete.length > 0) {
          await supabase.from('subtasks').delete().in('id', idsToDelete);
        }

        // 2. Update existing and insert new
        for (const st of subtasks) {
          const isUuid = st.id && typeof st.id === 'string' && st.id.includes('-');
          if (isUuid) { 
            await supabase.from('subtasks').update({
              is_done: st.completed || st.is_done || false,
              title: st.title
            }).eq('id', st.id);
          } else {
            // New subtask (temp ID or no ID)
            await supabase.from('subtasks').insert({
              title: st.title,
              task_id: id,
              is_done: st.completed || st.is_done || false
            });
          }
        }
      }

      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Update Task Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: updateTask, isPending };
};

export const useDeleteTask = () => {
  const [isPending, setIsPending] = useState(false);
  const deleteTask = async ({ id }: { id: string }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Delete Task Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: deleteTask, isPending };
};

export const useCreateTask = () => {
  const [isPending, setIsPending] = useState(false);

  const createTask = async ({ data }: { data: any }, options?: { onSuccess?: (data?: any) => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) throw new Error('User not found');

      const { subtasks, ...taskFields } = data;

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          ...taskFields,
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Handle subtasks using subtasks table
      if (subtasks && subtasks.length > 0 && newTask) {
        const subtasksToInsert = subtasks.map((st: any) => ({
          task_id: newTask.id,
          title: typeof st === 'string' ? st : st.title,
          is_done: st.completed || st.is_done || false
        }));

        const { error: subError } = await supabase
          .from('subtasks')
          .insert(subtasksToInsert);
        
        if (subError) console.error('Subtasks Integration Error:', subError);
      }

      if (options?.onSuccess) options.onSuccess(newTask);
    } catch (err: any) {
      console.error('Create Task Catch Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: createTask, isPending };
};

export const useGetNotes = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (!silent) setLoading(false);
      return;
    }

    const { data: notes, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_sections (id, name)
      `)
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (!error) setData(notes);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return { data, loading, refetch: fetchNotes };
};

export const useCreateNote = () => {
  const [isPending, setIsPending] = useState(false);

  const createNote = async ({ data }: { data: any }, options?: { onSuccess?: () => void, onError?: (err: any) => void }) => {
    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.from('notes').insert({
        ...data,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: createNote, isPending };
};

export const useUpdateNote = () => {
  const [isPending, setIsPending] = useState(false);
  const updateNote = async ({ id, data }: { id: string, data: any }, options?: { onSuccess?: () => void, onError?: (err: any) => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: updateNote, isPending };
};

export const useDeleteNote = () => {
  const [isPending, setIsPending] = useState(false);
  const deleteNote = async ({ id }: { id: string }, options?: { onSuccess?: () => void, onError?: () => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err) {
      if (options?.onError) options.onError();
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: deleteNote, isPending };
};

export const useGetUserXP = () => {
  const [data, setData] = useState<{ current_xp: number; level: number; next_level_xp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchXP = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: xpData, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error) setData(xpData);
    } catch (err) {
      console.error('Error fetching XP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchXP();
  }, []);

  return { data, loading, isLoading: loading, refetch: fetchXP };
};

export const useGetProfile = () => {
  const [data, setData] = useState<{ id: string; email: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch from both tables to ensure complete fallback coverage
      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: lifeRow } = await supabase
        .from('life_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setData({
        id: user.id,
        email: user.email || userRow?.email || lifeRow?.email || '',
        name: userRow?.name || lifeRow?.name || 'Israa',
        wake_time: lifeRow?.wake_time || '07:00:00',
        sleep_time: lifeRow?.sleep_time || '23:00:00',
        energy_peak: lifeRow?.energy_peak || 'morning'
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { data, loading, isLoading: loading, refetch: fetchProfile };
};

export const useCompleteTask = () => {
  const completeTask = async ({ id }: { id: string }, options?: { onSuccess?: () => void, onError?: (err: any) => void }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.rpc('complete_task', {
        p_task_id: id,
        p_user_id: user.id
      });

      if (error) {
        // Fallback
        console.warn('RPC complete_task failed, falling back to manual update', error);
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ status: 'done', updated_at: new Date().toISOString() })
          .eq('id', id);
        
        if (updateError) throw updateError;
      }

      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Complete Task Error:', err);
      if (options?.onError) options.onError(err);
    }
  };

  return { mutate: completeTask };
};

export const useRecordPomodoroSession = () => {
  const [isPending, setIsPending] = useState(false);

  const recordPomodoro = async (data: { task_id?: string; duration_minutes: number }, options?: { onSuccess?: () => void, onError?: (err: any) => void }) => {
    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsPending(false);
        return;
      }
      
      const { error } = await supabase.from('pomodoro_sessions').insert({
        user_id: user.id,
        task_id: data.task_id || null,
        duration_minutes: data.duration_minutes,
        completed_at: new Date().toISOString()
      });

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Pomodoro Insert Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: recordPomodoro, isPending };
};

export const useDeleteHabit = () => {
  const [isPending, setIsPending] = useState(false);
  const deleteHabit = async ({ id }: { id: string }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Delete Habit Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };
  return { mutate: deleteHabit, isPending };
};

export const useUpdateHabit = () => {
  const [isPending, setIsPending] = useState(false);
  const updateHabit = async ({ id, data }: { id: string, data: any }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase.from('habits').update(data).eq('id', id);
      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Update Habit Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };
  return { mutate: updateHabit, isPending };
};

export const useGetGoals = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async (silent = false) => {
    try {
      if (!silent && data.length === 0) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
      } else {
        setData(goals || []);
      }
    } catch (err) {
      console.error('Unexpected error in fetchGoals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return { data, loading, isLoading: loading, refetch: fetchGoals };
};

export const useCreateGoal = () => {
  const [isPending, setIsPending] = useState(false);

  const createGoal = async ({ data }: { data: any }, options?: { onSuccess?: (data: any) => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: insertedData, error } = await supabase.from('goals').insert({
        ...data,
        user_id: user.id,
        created_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;
      if (options?.onSuccess && typeof options.onSuccess === 'function') {
        (options.onSuccess as any)(insertedData);
      }
    } catch (err: any) {
      console.error('Create Goal Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: createGoal, isPending };
};

export const useGetPlanMilestones = (planId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = async (silent = false) => {
    if (!planId) return;
    if (!silent && data.length === 0) setLoading(true);
    const { data: milestones, error } = await supabase
      .from('plan_milestones')
      .select('*')
      .eq('plan_id', planId)
      .order('order_index', { ascending: true });

    if (!error) setData(milestones || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMilestones();
  }, [planId]);

  return { data, loading, refetch: fetchMilestones };
};

export const useCreateMilestone = () => {
  const [isPending, setIsPending] = useState(false);
  const createMilestone = async (data: any) => {
    setIsPending(true);
    try {
      const { error } = await supabase.from('plan_milestones').insert(data);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };
  return { mutateAsync: createMilestone, isPending };
};

export const useUpdateGoal = () => {
  const [isPending, setIsPending] = useState(false);
  const updateGoal = async ({ id, data }: { id: string, data: any }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Update Goal Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: updateGoal, isPending };
};

export const useDeleteGoal = () => {
  const [isPending, setIsPending] = useState(false);
  const deleteGoal = async ({ id }: { id: string }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      console.error('Delete Goal Error:', err);
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };
  return { mutate: deleteGoal, isPending };
};

export const useGetNoteSections = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sections, error } = await supabase
      .from('note_sections')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (!error) setData(sections || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  return { data, loading, refetch: fetchSections };
};

export const useCreateNoteSection = () => {
  const [isPending, setIsPending] = useState(false);

  const createSection = async ({ name }: { name: string }, options?: { onSuccess?: () => void, onError?: (err: any) => void }) => {
    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.from('note_sections').insert({
        name,
        user_id: user.id
      });

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err: any) {
      if (options?.onError) options.onError(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: createSection, isPending };
};

export const useGetFavorites = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
      } else {
        setData(favorites || []);
      }
    } catch (err) {
      console.error('Unexpected error in fetchFavorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return { data, loading, isLoading: loading, refetch: fetchFavorites };
};

export const useToggleFavorite = () => {
  const [isPending, setIsPending] = useState(false);

  const toggleFavorite = async (item: any, customContent?: string) => {
    setIsPending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('يرجى تسجيل الدخول أولاً');

      const sourceId = item.item_id || item.id;
      if (!sourceId) throw new Error('Source ID is required');

      // Check if it's already favorited by checking source_id
      const { data: existing, error: fetchError } = await supabase
        .from('favorites')
        .select('id, content')
        .eq('user_id', user.id)
        .eq('source_id', sourceId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        if (customContent !== undefined) {
          // Only update if content actually changed
          if (existing.content === customContent) return { added: true, record: existing };
          
          const { error: updateError } = await supabase
            .from('favorites')
            .update({ content: customContent })
            .eq('id', existing.id);
          if (updateError) throw updateError;
          return { added: true, record: { ...existing, content: customContent }, updated: true };
        } else {
          const { error: deleteError } = await supabase
            .from('favorites')
            .delete()
            .eq('id', existing.id);
          if (deleteError) throw deleteError;
          return { added: false };
        }
      } else {
        // If we're trying to add a reflection but the content is empty, maybe don't add it as a favorite yet?
        // Actually, let's just add it.
        const { data: newFav, error: insertError } = await supabase.from('favorites').insert({
          user_id: user.id,
          source_type: item.type || 'manual',
          source_id: sourceId,
          title: item.title || 'Untitled',
          content: customContent || item.content || item.description || '',
          metadata: item.metadata || {},
          created_at: new Date().toISOString()
        }).select().single();
        if (insertError) throw insertError;
        return { added: true, record: newFav };
      }
    } catch (err: any) {
      console.error('Toggle Favorite Error Detail:', err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { toggleFavorite, isPending };
};

export const useDeleteFavorite = () => {
  const [isPending, setIsPending] = useState(false);
  const deleteFavorite = async (id: string) => {
    setIsPending(true);
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', id);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };
  return { mutate: deleteFavorite, isPending };
};

export const useUpdateFavorite = () => {
  const [isPending, setIsPending] = useState(false);
  const updateFavorite = async (id: string, data: any) => {
    setIsPending(true);
    try {
      const { error } = await supabase.from('favorites').update(data).eq('id', id);
      if (error) throw error;
    } finally {
      setIsPending(false);
    }
  };
  return { mutate: updateFavorite, isPending };
};

export const useGetChatSessions = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rows, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'assistant')
        .eq('provider', 'ai_coach');

      if (!error && rows) {
        const sessions = rows.map((row) => {
          let parsedContent = { title: 'New Chat', messages: [] };
          try {
            parsedContent = JSON.parse(row.content);
          } catch (e) {
            parsedContent = { title: row.provider || 'Chat', messages: [] };
          }
          return {
            id: row.id,
            title: parsedContent.title || 'Chat',
            updated_at: row.created_at,
            created_at: row.created_at,
            messages: parsedContent.messages || []
          };
        });
        
        sessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setData(sessions);
      } else {
        const local = localStorage.getItem('ai_chat_sessions');
        if (local) setData(JSON.parse(local));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return { data, loading, refetch: fetchSessions };
};

export const useCreateChatSession = () => {
  const [isPending, setIsPending] = useState(false);
  const createSession = async ({ title }: { title: string }, options?: { onSuccess?: (data: any) => void }) => {
    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsPending(false);
        return;
      }

      const initialPayload = {
        title: title,
        messages: []
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role: 'assistant',
          content: JSON.stringify(initialPayload),
          provider: 'ai_coach',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        const newSession = {
          id: data.id,
          title: title,
          created_at: data.created_at,
          updated_at: data.created_at,
          messages: []
        };
        if (options?.onSuccess) options.onSuccess(newSession);
      } else {
        console.error("Error inserting chat session into Supabase:", error);
        const tempId = 'temp_' + Date.now();
        const fallbackSession = { id: tempId, title, created_at: new Date().toISOString(), messages: [] };
        
        const local = localStorage.getItem('ai_chat_sessions');
        const list = local ? JSON.parse(local) : [];
        list.push(fallbackSession);
        localStorage.setItem('ai_chat_sessions', JSON.stringify(list));

        if (options?.onSuccess) options.onSuccess(fallbackSession);
      }
    } catch (e) {
      console.error("Exception in createSession:", e);
      const tempId = 'temp_' + Date.now();
      const fallbackSession = { id: tempId, title, created_at: new Date().toISOString(), messages: [] };
      if (options?.onSuccess) options.onSuccess(fallbackSession);
    } finally {
      setIsPending(false);
    }
  };
  return { mutate: createSession, isPending };
};

export const useUpdateChatSession = () => {
  const updateSession = async (id: string, title: string) => {
    try {
      if (id.startsWith('temp_')) {
        const local = localStorage.getItem('ai_chat_sessions');
        if (local) {
          const list = JSON.parse(local);
          const item = list.find((x: any) => x.id === id);
          if (item) {
            item.title = title;
            localStorage.setItem('ai_chat_sessions', JSON.stringify(list));
          }
        }
        return;
      }

      const { data: row, error } = await supabase
        .from('chat_messages')
        .select('content')
        .eq('id', id)
        .single();

      if (!error && row) {
        let parsed = { title, messages: [] };
        try {
          parsed = JSON.parse(row.content);
          parsed.title = title;
        } catch (e) {
          parsed = { title, messages: [] };
        }

        await supabase
          .from('chat_messages')
          .update({
            content: JSON.stringify(parsed)
          })
          .eq('id', id);
      }
    } catch (e) {
      console.error(e);
    }
  };
  return { mutate: updateSession };
};

export const useDeleteChatSession = () => {
  const deleteSession = async (id: string) => {
    try {
      if (id.startsWith('temp_')) {
        const local = localStorage.getItem('ai_chat_sessions');
        if (local) {
          const list = JSON.parse(local);
          const filtered = list.filter((x: any) => x.id !== id);
          localStorage.setItem('ai_chat_sessions', JSON.stringify(filtered));
        }
        return;
      }

      await supabase.from('chat_messages').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };
  return { mutate: deleteSession };
};

export const useGetChatMessages = (sessionId: string | null) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!sessionId) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      if (sessionId.startsWith('temp_')) {
        const local = localStorage.getItem('ai_chat_sessions');
        if (local) {
          const list = JSON.parse(local);
          const s = list.find((item: any) => item.id === sessionId);
          if (s) {
            setData(s.messages || []);
            setLoading(false);
            return;
          }
        }
        setData([]);
        setLoading(false);
        return;
      }

      const { data: row, error } = await supabase
        .from('chat_messages')
        .select('content')
        .eq('id', sessionId)
        .single();

      if (!error && row) {
        try {
          const parsed = JSON.parse(row.content);
          setData(parsed.messages || []);
        } catch (e) {
          setData([]);
        }
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [sessionId]);

  return { data, loading, refetch: fetchMessages };
};

const saveQueues: { [sessionId: string]: Promise<any> } = {};

export const useSaveChatMessage = () => {
  const saveMessage = async (sessionId: string, role: 'user' | 'model', content: string) => {
    if (!saveQueues[sessionId]) {
      saveQueues[sessionId] = Promise.resolve();
    }

    const nextPromise = saveQueues[sessionId].then(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (sessionId.startsWith('temp_')) {
          const local = localStorage.getItem('ai_chat_sessions');
          if (local) {
            const list = JSON.parse(local);
            const sIdx = list.findIndex((item: any) => item.id === sessionId);
            if (sIdx !== -1) {
              if (!list[sIdx].messages) list[sIdx].messages = [];
              list[sIdx].messages.push({ role, content, created_at: new Date().toISOString() });
              localStorage.setItem('ai_chat_sessions', JSON.stringify(list));
            }
          }
          return;
        }

        const { data: row, error: fetchErr } = await supabase
          .from('chat_messages')
          .select('content, provider')
          .eq('id', sessionId)
          .single();

        if (!fetchErr && row) {
          let parsed = { title: 'Chat', messages: [] as any[] };
          try {
            parsed = JSON.parse(row.content);
          } catch (e) {
            parsed = { title: row.provider || 'Chat', messages: [] };
          }

          if (!parsed.messages) parsed.messages = [];
          
          parsed.messages.push({
            role,
            content,
            created_at: new Date().toISOString()
          });

          await supabase
            .from('chat_messages')
            .update({
              content: JSON.stringify(parsed)
            })
            .eq('id', sessionId);
        }
      } catch (e) {
        console.error("Exception in useSaveChatMessage:", e);
      }
    });

    saveQueues[sessionId] = nextPromise;
    return nextPromise;
  };
  return { mutate: saveMessage };
};

export const useGetNotifications = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notifications, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setData(notifications || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return { data, loading, refetch: fetchNotifications };
};

export const useMarkNotificationRead = () => {
  const markRead = async (id: string) => {
    await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
  };
  return { mutate: markRead };
};

export const useDeleteNotification = () => {
  const deleteNotif = async (id: string) => {
    await supabase.from('user_notifications').delete().eq('id', id);
  };
  return { mutate: deleteNotif };
};

export const useGetHabitLogs = (habitId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: false });
      
      setData(logs || []);
      setLoading(false);
    };
    fetchLogs();
  }, [habitId]);

  return { data, loading };
};
