import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAppContext } from '../context/AppContext';

export const useGetDailySchedule = (options?: { date?: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const dateFilter = options?.date || new Date().toISOString().split('T')[0];
    
    // Join with tasks to get titles and metadata
    const { data: schedule, error } = await supabase
      .from('daily_schedule')
      .select('*, task:tasks(*)')
      .eq('user_id', user.id)
      .eq('date_str', dateFilter); // Using date_str from schema if available, or fallback to your current schema logic

    if (error) {
      console.error('Error fetching schedule:', error);
    } else {
      setData(schedule || []);
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

  const fetchHabits = async () => {
    try {
      setLoading(true);
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
            status,
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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all tasks for the user to build hierarchy in-memory
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else if (allTasks) {
        // Build hierarchy: root tasks (parentId is null) with their children
        const topLevelTasks = allTasks.filter(t => !t.parentId);
        const tasksWithHierarchy = topLevelTasks.map(task => {
          const children = allTasks.filter(t => t.parentId === task.id);
          return {
            ...task,
            subtasks: children.map(c => ({
              ...c,
              completed: c.status === 'done' || c.is_done // Support both flags for UI compatibility
            }))
          };
        });
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
    const fetchQuote = () => {
      setData("The leading rule for the lawyer, as for the man of every calling, is diligence.");
      setLoading(false);
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
          status: 'completed',
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

      // Handle subtasks using parentId logic from schema
      if (subtasks && subtasks.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        
        // This is a complex operation for a simple update, 
        // usually subtasks are updated individually or handled via a transaction/RPC
        // For simplicity, we ensure existing subtasks are linked to the parent
        for (const st of subtasks) {
          if (st.id && !st.id.toString().includes('.')) { // Check if it's a real DB ID
            await supabase.from('tasks').update({
              status: st.is_done || st.completed ? 'done' : (st.status || 'todo'),
              parentId: id
            }).eq('id', st.id);
          } else {
            // New subtask
            await supabase.from('tasks').insert({
              title: st.title,
              parentId: id,
              user_id: user?.id,
              status: st.is_done || st.completed ? 'done' : 'todo'
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

  const createTask = async ({ data }: { data: any }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
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

      // Handle subtasks using parentId logic
      if (subtasks && subtasks.length > 0 && newTask) {
        const subtasksToInsert = subtasks.map((st: any) => ({
          parentId: newTask.id,
          user_id: user.id,
          title: typeof st === 'string' ? st : st.title,
          status: st.completed || st.is_done ? 'done' : 'todo'
        }));

        const { error: subError } = await supabase
          .from('tasks')
          .insert(subtasksToInsert);
        
        if (subError) console.error('Subtasks Integration Error:', subError);
      }

      if (options?.onSuccess) options.onSuccess();
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

  const fetchNotes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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

  const createNote = async ({ data }: { data: any }, options?: { onSuccess?: () => void, onError?: () => void }) => {
    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.from('notes').insert({
        ...data,
        user_id: user.id
      });

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err) {
      if (options?.onError) options.onError();
    } finally {
      setIsPending(false);
    }
  };

  return { mutate: createNote, isPending };
};

export const useUpdateNote = () => {
  const [isPending, setIsPending] = useState(false);
  const updateNote = async ({ id, data }: { id: string, data: any }, options?: { onSuccess?: () => void, onError?: () => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err) {
      if (options?.onError) options.onError();
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
