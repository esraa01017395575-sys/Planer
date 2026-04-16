import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAppContext } from '../context/AppContext';

export const useGetDailySchedule = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data: schedule, error } = await supabase
      .from('daily_schedule')
      .select('*')
      .eq('user_id', user.id)
      .eq('due_date', today);

    if (!error) setData(schedule);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return { data, loading, refetch: fetchSchedule };
};

export const useGetHabits = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHabits = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: habits, error } = await supabase
      .from('habits')
      .select('*, habit_logs(*)')
      .eq('user_id', user.id);

    if (!error) setData(habits);
    setLoading(false);
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  return { data, loading, refetch: fetchHabits };
};

export const useGetTasks = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);

    if (!error) setData(tasks);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return { data, loading, refetch: fetchTasks };
};

export const useGetDailyQuote = () => {
  const [quote, setQuote] = useState<string>("");

  useEffect(() => {
    // Mocking for now, or could fetch from an API
    setQuote("The only way to do great work is to love what you do.");
  }, []);

  return { data: quote };
};

export const useCompleteHabit = () => {
  const completeHabit = async ({ id }: { id: string }, options?: { onSuccess?: () => void, onError?: () => void }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: id,
        user_id: user.id,
        completed: true,
        date: today
      });

      if (error) throw error;
      if (options?.onSuccess) options.onSuccess();
    } catch (err) {
      if (options?.onError) options.onError();
    }
  };

  return { mutate: completeHabit };
};

export const useCreateHabit = () => {
  const [isPending, setIsPending] = useState(false);

  const createHabit = async ({ data }: { data: any }, options?: { onSuccess?: () => void, onError?: () => void }) => {
    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.from('habits').insert({
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

  return { mutate: createHabit, isPending };
};

export const useUpdateTask = () => {
  const [isPending, setIsPending] = useState(false);
  const updateTask = async ({ id, data }: { id: string, data: any }, options?: { onSuccess?: () => void, onError?: () => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('tasks')
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

  return { mutate: updateTask, isPending };
};

export const useDeleteTask = () => {
  const [isPending, setIsPending] = useState(false);
  const deleteTask = async ({ id }: { id: string }, options?: { onSuccess?: () => void, onError?: () => void }) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('tasks')
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

  return { mutate: deleteTask, isPending };
};

export const useCreateTask = () => {
  const [isPending, setIsPending] = useState(false);

  const createTask = async ({ data }: { data: any }, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
    setIsPending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        console.error('Create Task Error: No active session found');
        throw new Error('User not found');
      }

      const { error } = await supabase.from('tasks').insert({
        ...data,
        user_id: user.id
      });

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
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
