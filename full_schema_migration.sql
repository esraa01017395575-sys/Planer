-- Full Schema Migration for Life OS (CLEAN SETUP)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up existing tables to avoid conflicts
DROP TABLE IF EXISTS public.habit_logs CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.daily_schedule CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.user_xp CASCADE;
DROP TABLE IF EXISTS public.pomodoro_sessions CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- 3. User Profiles
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tasks Table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    parentId UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done', 'backlog')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT DEFAULT 'general',
    due_date DATE,
    estimated_min INTEGER DEFAULT 25,
    is_done BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Habits Table
CREATE TABLE public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    emoji TEXT,
    description TEXT,
    category TEXT DEFAULT 'health',
    frequency TEXT DEFAULT 'daily',
    current_streak INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Habit Logs
CREATE TABLE public.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    status TEXT DEFAULT 'completed',
    xp_earned INTEGER DEFAULT 10
);

-- 7. Daily Schedule
CREATE TABLE public.daily_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    date_str DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_min INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. User XP
CREATE TABLE public.user_xp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    next_level_xp INTEGER DEFAULT 100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS (Allowing all for simplicity as per current dev state)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public manage tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage habits" ON public.habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage logs" ON public.habit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage schedule" ON public.daily_schedule FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage xp" ON public.user_xp FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage profile" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
