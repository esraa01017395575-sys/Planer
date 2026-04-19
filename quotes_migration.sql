-- 1. Create the quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    author TEXT,
    category TEXT DEFAULT 'productivity',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow anyone to read quotes
CREATE POLICY "Allow public read access" ON public.quotes
    FOR SELECT USING (true);

-- 4. Clear existing quotes (optional)
TRUNCATE TABLE public.quotes;

-- 5. Insert 60 English quotes
INSERT INTO public.quotes (text, author, category) VALUES
('The only way to do great work is to love what you do.', 'Steve Jobs', 'productivity'),
('Your time is limited, so don''t waste it living someone else''s life.', 'Steve Jobs', 'life'),
('The best way to predict the future is to create it.', 'Peter Drucker', 'focus'),
('Amateurs sit and wait for inspiration, the rest of us just get up and go to work.', 'Stephen King', 'discipline'),
('Focus on being productive instead of busy.', 'Tim Ferriss', 'productivity'),
('Efficiency is doing things right; effectiveness is doing the right things.', 'Peter Drucker', 'effectiveness'),
('The big secret in life is that there is no big secret. Whatever your goal, you can get there if you''re willing to work.', 'Oprah Winfrey', 'motivation'),
('It''s not that I''m so smart, it''s just that I stay with problems longer.', 'Albert Einstein', 'perseverance'),
('Lost time is never found again.', 'Benjamin Franklin', 'time-management'),
('Do or do not. There is no try.', 'Yoda', 'discipline'),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'resilience'),
('The future depends on what you do today.', 'Mahatma Gandhi', 'planning'),
('Action is the foundational key to all success.', 'Pablo Picasso', 'action'),
('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson', 'persistence'),
('Your mind is for having ideas, not holding them.', 'David Allen', 'productivity'),
('Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.', 'Paul J. Meyer', 'excellence'),
('The secret of getting ahead is getting started.', 'Mark Twain', 'starting'),
('You don''t need a new plan for next year. You need a commitment.', 'Seth Godin', 'commitment'),
('Take care of the minutes and the hours will take care of themselves.', 'Lord Chesterfield', 'time-management'),
('Success is the sum of small efforts, repeated day-in and day-out.', 'Robert Collier', 'consistency'),
('The way to get started is to quit talking and begin doing.', 'Walt Disney', 'action'),
('If you spend too much time thinking about a thing, you’ll never get it done.', 'Bruce Lee', 'action'),
('Knowing is not enough; we must apply. Willing is not enough; we must do.', 'Johann Wolfgang von Goethe', 'execution'),
('A year from now you may wish you had started today.', 'Karen Lamb', 'procrastination'),
('You can have it all. Just not all at once.', 'Oprah Winfrey', 'balance'),
('Simplify, then add lightness.', 'Colin Chapman', 'simplicity'),
('The path to success is to take massive, focused action.', 'Tony Robbins', 'action'),
('Small deeds done are better than great deeds planned.', 'Peter Marshall', 'action'),
('Energy and persistence conquer all things.', 'Benjamin Franklin', 'persistence'),
('Discipline is the bridge between goals and accomplishment.', 'Jim Rohn', 'discipline'),
('Goals are the fuel in the furnace of achievement.', 'Brian Tracy', 'goals'),
('The tragedy of life doesn’t lie in not reaching your goal. The tragedy lies in having no goal to reach.', 'Benjamin E. Mays', 'goals'),
('Start where you are. Use what you have. Do what you can.', 'Arthur Ashe', 'starting'),
('Obstacles are those frightful things you see when you take your eyes off your goal.', 'Henry Ford', 'focus'),
('Review your goals twice every day in order to be focused on achieving them.', 'Les Brown', 'focus'),
('A goal without a timeline is just a dream.', 'Robert Herjavec', 'planning'),
('Stop talking. Start walking.', 'Anonymous', 'action'),
('Either you run the day or the day runs you.', 'Jim Rohn', 'discipline'),
('The productive man is not a man who has many projects, but a man who finishes one.', 'Anonymous', 'finishing'),
('What gets measured gets managed.', 'Peter Drucker', 'management'),
('Make each day your masterpiece.', 'John Wooden', 'excellence'),
('Believe you can and you''re halfway there.', 'Theodore Roosevelt', 'mindset'),
('It always seems impossible until it''s done.', 'Nelson Mandela', 'persistence'),
('Quality means doing it right when no one is looking.', 'Henry Ford', 'quality'),
('The essence of self-discipline is to do the important thing rather than the urgent thing.', 'Anonymous', 'priority'),
('You are what you repeatedly do. Excellence, then, is not an act, but a habit.', 'Aristotle', 'habits'),
('Deciding what not to do is as important as deciding what to do.', 'Steve Jobs', 'priority'),
('He who has a why to live can bear almost any how.', 'Friedrich Nietzsche', 'purpose'),
('Working hard for something we don''t care about is called stress; working hard for something we love is called passion.', 'Simon Sinek', 'passion'),
('Don''t be busy, be productive.', 'Anonymous', 'productivity'),
('Focus on the signal, not the noise.', 'Elon Musk', 'focus'),
('The journey of a thousand miles begins with one step.', 'Lao Tzu', 'starting'),
('You must expect great things of yourself before you can do them.', 'Michael Jordan', 'mindset'),
('If you want to live a happy life, tie it to a goal, not to people or things.', 'Albert Einstein', 'purpose'),
('Life is what happens when you''re busy making other plans.', 'John Lennon', 'life'),
('Hard work beats talent when talent doesn’t work hard.', 'Tim Notke', 'work-ethic'),
('I find that the harder I work, the more luck I seem to have.', 'Thomas Jefferson', 'luck'),
('The key is not to prioritize what''s on your schedule, but to schedule your priorities.', 'Stephen Covey', 'priority'),
('Everything you''ve ever wanted is on the other side of fear.', 'George Addair', 'courage'),
('Limit your "always" and your "nevers".', 'Amy Poehler', 'flexibility');
