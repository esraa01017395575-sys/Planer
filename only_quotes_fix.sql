-- ONLY CREATE QUOTES TABLE - DOES NOT TOUCH OTHER TABLES
CREATE TABLE IF NOT EXISTS public.quotes (
    id SERIAL PRIMARY KEY,
    text_en TEXT NOT NULL,
    text_ar TEXT NOT NULL,
    author TEXT,
    category TEXT DEFAULT 'productivity',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access for quotes" ON public.quotes FOR SELECT USING (true);

-- Clear any partial data
TRUNCATE TABLE public.quotes;

-- Insert 60 English + Egyptian Arabic Quotes
INSERT INTO public.quotes (text_en, text_ar, author, category) VALUES
('The only way to do great work is to love what you do.', 'الطريقة الوحيدة عشان تعمل حاجة عظيمة هي إنك تحب اللي بتعمله.', 'Steve Jobs', 'productivity'),
('Your time is limited, so don''t waste it living someone else''s life.', 'وقتك محدود، فماتضيعوش في إنك تعيش حياة حد تاني.', 'Steve Jobs', 'life'),
('The best way to predict the future is to create it.', 'أحسن طريقة تتوقع بيها المستقبل هي إنك تصنعه بنفسك.', 'Peter Drucker', 'focus'),
('Amateurs sit and wait for inspiration, the rest of us just get up and go to work.', 'الهواة بيقعدوا يستنوا الالهام، لكن الباقيين بيقوموا ويروحوا الشغل.', 'Stephen King', 'discipline'),
('Focus on being productive instead of busy.', 'ركز إنك تكون منتج مش مجرد مشغول وخلاص.', 'Tim Ferriss', 'productivity'),
('Efficiency is doing things right; effectiveness is doing the right things.', 'الكفاءة هي إنك تعمل الحاجة صح، لكن الفعالية هي إنك تعمل الحاجة الصح.', 'Peter Drucker', 'effectiveness'),
('The big secret in life is that there is no big secret.', 'السر الكبير في الحياة هو إنه مفيش سر أصلاً.. اشتغل بس.', 'Oprah Winfrey', 'motivation'),
('Lost time is never found again.', 'الوقت اللي بيضيع مابيرجعش تاني.', 'Benjamin Franklin', 'time-management'),
('Do or do not. There is no try.', 'يا تعمل يا ماتعملش.. مفيش حاجة اسمها "هحاول".', 'Yoda', 'discipline'),
('The future depends on what you do today.', 'المستقبل بيعتمد على اللي بتعمله النهاردة.', 'Mahatma Gandhi', 'planning'),
('Action is the foundational key to all success.', 'الخطوة والعمل هما مفتاح كل نجاح.', 'Pablo Picasso', 'action'),
('Don''t watch the clock; do what it does. Keep going.', 'ماتقعدش تبص في الساعة، اعمل زيها وكمل طريقك.', 'Sam Levenson', 'persistence'),
('Your mind is for having ideas, not holding them.', 'عقلك معمول عشان يطلع أفكار، مش عشان يخزنها جواه.', 'David Allen', 'productivity'),
('Productivity is never an accident.', 'الإنتاجية عمرها ما كانت بالصدفة، دي نتيجة خطة ومجهود.', 'Paul J. Meyer', 'excellence'),
('The secret of getting ahead is getting started.', 'سر إنك تتقدم هو إنك تبدأ.', 'Mark Twain', 'starting'),
('You don''t need a new plan. You need a commitment.', 'إنت مش محتاج خطة جديدة، إنت محتاج التزام.', 'Seth Godin', 'commitment'),
('Success is the sum of small efforts, repeated day-in and day-out.', 'النجاح هو شوية مجهودات صغيرة بتتكرر كل يوم.', 'Robert Collier', 'consistency'),
('The way to get started is to quit talking and begin doing.', 'الطريقة عشان تبدأ هي إنك تبطل كلام وتبدأ فعل.', 'Walt Disney', 'action'),
('A year from now you may wish you had started today.', 'بعد سنة من دلوقتي، هتتمنى لو كنت بدأت النهاردة.', 'Karen Lamb', 'procrastination'),
('You can have it all. Just not all at once.', 'ممكن تاخد كل حاجة، بس مش كلها في نفس الوقت.', 'Oprah Winfrey', 'balance'),
('Simplify, then add lightness.', 'بسط الأمور، وبعدين خليها خفيفة.', 'Colin Chapman', 'simplicity'),
('Energy and persistence conquer all things.', 'الطابقة والإصرار بيغلبوا أي حاجة.', 'Benjamin Franklin', 'persistence'),
('Discipline is the bridge between goals and accomplishment.', 'الالتزام هو الكوبري اللي بيوصلك من أهدافك لإنجازاتك.', 'Jim Rohn', 'discipline'),
('Goals are the fuel in the furnace of achievement.', 'الأهداف هي البنزين اللي بيحرك مكنة الإنجاز.', 'Brian Tracy', 'goals'),
('Obstacles are those frightful things you see when you take your eyes off your goal.', 'العقبات هي الحاجات اللي بتخوفك لما تشيل عينك من على هدفك.', 'Henry Ford', 'focus'),
('Start where you are. Use what you have. Do what you can.', 'ابدأ من مكانك، استعمل اللي معاك، واعمل اللي تقدر عليه.', 'Arthur Ashe', 'starting'),
('A goal without a timeline is just a dream.', 'الهدف من غير وقت محدد هو مجرد حلم.', 'Robert Herjavec', 'planning'),
('Stop talking. Start walking.', 'بطل رغي.. وابدأ مشي.', 'Anonymous', 'action'),
('Either you run the day or the day runs you.', 'يا إنت اللي بتسوق يومك، يا يومك هو اللي هيسوقك.', 'Jim Rohn', 'discipline'),
('Make each day your masterpiece.', 'خلي كل يوم في حياتك يكون لوحة فنية.', 'John Wooden', 'excellence'),
('Believe you can and you''re halfway there.', 'صدق إنك تقدر وهتكون قطعت نص الطريق.', 'Theodore Roosevelt', 'mindset'),
('It always seems impossible until it''s done.', 'الحاجة دايمًا بتبان مستحيلة لحد ما تخلص.', 'Nelson Mandela', 'persistence'),
('Quality means doing it right when no one is looking.', 'الجودة هي إنك تعمل الصح لما مفيش حد شايفك.', 'Henry Ford', 'quality'),
('He who has a why to live can bear almost any how.', 'اللي عنده "ليه" يعيش عشانها، هيقدر يتحمل أي "إزاي".', 'Friedrich Nietzsche', 'purpose'),
('Don''t be busy, be productive.', 'ماتكونش مجرد مشغول، خليك منتج.', 'Anonymous', 'productivity'),
('Focus on the signal, not the noise.', 'ركز في المفيد وسيبك من الدوشة اللي حواليك.', 'Elon Musk', 'focus'),
('The journey of a thousand miles begins with one step.', 'مشوار الألف ميل بيبدأ بخطوة.', 'Lao Tzu', 'starting'),
('If you want to live a happy life, tie it to a goal.', 'لو عايز تعيش سعيد، اربط حياتك بهدف.', 'Albert Einstein', 'purpose'),
('Hard work beats talent when talent doesn’t work hard.', 'الشغل بمرجلة بيغلب الموهبة لو الموهبة مابتشتغلش.', 'Tim Notke', 'work-ethic'),
('The key is not to prioritize what''s on your schedule, but to schedule your priorities.', 'السر مش في ترتيب اللي وراك، السر في إنك تعمل وقت لأولوياتك.', 'Stephen Covey', 'priority'),
('Life is short, live it.', 'العمر قصير، عيشه صح.', 'Anonymous', 'life'),
('Failure is the opportunity to begin again more intelligently.', 'الفشل هو فرصة إنك تبدأ تاني بس بذكاء أكتر.', 'Henry Ford', 'resilience'),
('It is not the mountains ahead to climb that wear you out; it is the pebble in your shoe.', 'مش الجبل اللي قدامك هو اللي بيتعبك، دي الطوبة اللي في جزمتك.', 'Muhammad Ali', 'focus'),
('Everything you''ve ever wanted is on the other side of fear.', 'كل اللي بتتمناه موجود الناحية التانية من الخوف.', 'George Addair', 'courage'),
('What we fear of doing most is usually what we most need to do.', 'الحاجة اللي بنخاف منها هي غالباً أكتر حاجة محتاجين نعملها.', 'Tim Ferriss', 'mindset'),
('You miss 100% of the shots you don''t take.', 'إنت بتخسر كل الفرص اللي مابتجربش فيها أصلاً.', 'Wayne Gretzky', 'action'),
('Small progress is still progress.', 'أي تقدم صغير، لسه اسمه تقدم.', 'Anonymous', 'consistency'),
('Success doesn’t just find you. You have to go out and get it.', 'النجاح مش هيخبط على بابك، إنت اللي لازم تروح تجيبه.', 'Anonymous', 'action'),
('Dream big and dare to fail.', 'احلم حلم كبير وماتخافش إنك تفشل.', 'Norman Vaughan', 'mindset'),
('Great things never come from comfort zones.', 'الحاجات العظيمة مابتجيش وإنت قاعد مستريح.', 'Anonymous', 'growth'),
('Don''t stop until you''re proud.', 'ماتوقفش غير لما تكون فخور بنفسك.', 'Anonymous', 'persistence'),
('Do something today that your future self will thank you for.', 'اعمل حاجة النهاردة تخلي نفسك في المستقبل تشكرك عليها.', 'Anonymous', 'planning'),
('Little things make big days.', 'الحاجات الصغيرة هي اللي بتعمل الأيام الكبيرة.', 'Anonymous', 'gratitude'),
('Keep your eyes on the stars, and your feet on the ground.', 'خلي عينك على النجوم، ورجلك على الأرض.', 'Theodore Roosevelt', 'mindset'),
('Motivation is what gets you started. Habit is what keeps you going.', 'التحفيز هو اللي بيخليك تبدأ، بس العادة هي اللي بتخليك تكمل.', 'Jim Ryun', 'habits'),
('You are never too old to set another goal or to dream a new dream.', 'عمرك ما هتكون كبير على إنك تحط هدف جديد أو تحلم حلم جديد.', 'C.S. Lewis', 'goals'),
('Your only limit is your mind.', 'الحدود الوحيدة ليك هي اللي في عقلك.', 'Anonymous', 'mindset'),
('Work hard in silence, let your success be the noise.', 'اشتغل في هدوء، وخلي نجاحك هو اللي يعمل دوشة.', 'Frank Ocean', 'work-ethic'),
('The secret to being productive is to focus on one thing at a time.', 'سر الإنتاجية هو إنك تركز في حاجة واحدة بس في المرة الواحدة.', 'Anonymous', 'focus'),
('Be the change that you wish to see in the world.', 'خليك إنت التغيير اللي عايز تشوفه في الدنيا.', 'Mahatma Gandhi', 'purpose');
