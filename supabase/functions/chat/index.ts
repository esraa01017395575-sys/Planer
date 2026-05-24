import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id, x-gemini-api-key',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, context: clientContext, sessionId, fileData } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || req.headers.get('x-gemini-api-key')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY secret is not set in Supabase project secrets and none was passed in headers.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Initialize Supabase Client with client auth credentials to execute RLS-safe queries
    const authHeader = req.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // Choose key dynamically
    const clientKey = supabaseServiceKey || supabaseAnonKey
    const headersConfig: Record<string, string> = {}
    if (authHeader) {
      headersConfig['Authorization'] = authHeader
    }
    
    const supabase = createClient(supabaseUrl, clientKey, {
      global: { headers: headersConfig }
    })

    // 2. Fetch User profile and db-specific contextual details safely
    let userId = ""
    let userName = "البطل"
    let wakeTime = "07:00"
    let sleepTime = "23:00"
    let energyPeak = "صباحي"
    let defaultLang = "ar"

    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
          
          // User profile fetch
          const { data: userRow } = await supabase.from('users').select('name').eq('id', userId).single()
          if (userRow?.name) {
            userName = userRow.name
          }

          // Life profiles fetch
          const { data: lifeRow } = await supabase.from('life_profiles').select('wake_time, sleep_time, energy_peak').eq('user_id', userId).single()
          if (lifeRow) {
            wakeTime = lifeRow.wake_time ? String(lifeRow.wake_time).slice(0, 5) : "07:00"
            sleepTime = lifeRow.sleep_time ? String(lifeRow.sleep_time).slice(0, 5) : "23:00"
            energyPeak = lifeRow.energy_peak || "صباحي"
          }
        }
      } catch (err) {
        console.error("Auth / Profile fetch error inside Edge Function:", err)
      }
    }

    // 3. Fetch task, habits, and project lists for dynamic contextual injection
    let activeLongTermPlans = ""
    let todayPendingTasks = ""
    let yesterdayTasksResults = ""
    let todayHabitStreaks = ""

    if (userId) {
      try {
        const todayStr = new Date().toISOString().split('T')[0]
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        // Today Tasks
        const { data: tTasks } = await supabase.from('tasks').select('title, status, priority').eq('user_id', userId).eq('due_date', todayStr)
        if (tTasks && tTasks.length > 0) {
          todayPendingTasks = tTasks.filter(t => t.status !== 'done').map(t => `- ${t.title} [الأهمية: ${t.priority}]`).join('\n')
        }

        // Yesterday Tasks (completed and skipped)
        const { data: yTasks } = await supabase.from('tasks').select('title, status').eq('user_id', userId).eq('due_date', yesterdayStr)
        if (yTasks && yTasks.length > 0) {
          const completed = yTasks.filter(t => t.status === 'done').map(t => `- ${t.title}`)
          const skipped = yTasks.filter(t => t.status !== 'done').map(t => `- ${t.title}`)
          yesterdayTasksResults = `\nمنجز أمس:\n${completed.join('\n') || "لاشيء"}\nالمؤجل/المتخطي أمس:\n${skipped.join('\n') || "لاشيء"}`
        }

        // Habits
        const { data: dbHabits } = await supabase.from('habits').select('title, current_streak').eq('user_id', userId)
        if (dbHabits && dbHabits.length > 0) {
          todayHabitStreaks = dbHabits.map(h => `- ${h.title}: (سلسلة أيام: ${h.current_streak || 0})`).join('\n')
        }

        // Active projects
        let dbProjRes = await supabase.from('long_term_plans').select('title, status, current_phase').eq('user_id', userId)
        if (dbProjRes.error) {
          dbProjRes = await supabase.from('goals').select('title, status').eq('user_id', userId)
        }
        const dbProj = dbProjRes.data
        if (dbProj && dbProj.length > 0) {
          activeLongTermPlans = dbProj.map(p => `- ${p.title} (${p.status || 'نشط'}) ${p.current_phase ? `- المرحلة الحالية: ${p.current_phase}` : ''}`).join('\n')
        }
      } catch (dbErr) {
        console.error("DB Context aggregation failed inside Edge Function:", dbErr)
      }
    }

    // Build user profile info
    const profileDetails = `
- اسم المستخدم: ${userName}
- وقت الاستيقاظ: ${wakeTime}
- وقت النوم: ${sleepTime}
- أوقات الانتاجية العالية (Peak Energy): ${energyPeak}
- اللغة المختارة: ${defaultLang}
    `;

    // Aggregate final context to feed into Gemini
    const aggregatesContextString = `
[معلومات المستخدم]
${profileDetails}

[خطط ومشاريع بعيدة المدى ومراحل متبقية]
${activeLongTermPlans || "لا يوجد مشاريع مسجلة حالياً."}

[مهام اليوم المعلقة]
${todayPendingTasks || "لا يوجد مهام معلقة مسجلة لليوم."}

[مهام أمس]
${yesterdayTasksResults || "لا يوجد سجل مهام مسجل لأمس."}

[سلاسل العادات ومستوى الانجاز اليومي]
${todayHabitStreaks || "لا يوجد عادات مسجلة حالياً."}
    `;

    // 4. Build System Prompts strictly serverless in Edge Function (no exposure to client/server.ts)
    const systemInstruction = `
You are an AI Life OS coach for ${userName}.
Role:
You are a life coach and professional development consultant specializing in career path analysis, productivity habits, and daily planning. You help users connect their career or academic goals with healthy habits, focused routines, and measurable progress.
Mission:
Help the user understand their current situation, including career status, academic status when relevant, daily routine, productivity level, habits, and challenges.
Then build a realistic development plan that connects:
Career or academic goals
Daily tasks
Long-term plans
Healthy productivity habits
Focus and revision strategies when the user is a student
A balanced routine that supports consistent progress

Context always available:
User profile: name, wake time, sleep time, work hours, energy peak, language
Active long-term plans and milestones
Today pending tasks
Yesterday completed and skipped tasks
Habit streaks for today
Recent conversation history from the last 7 days
Starred notes, tasks, or favorites only when explicitly sent by the user

Communication style:
Be supportive, professional, practical, and results-focused.
Use inspiring and encouraging language without exaggeration.
Sound like a smart, warm Egyptian coach, but keep the tone professional.
Be honest when the user is avoiding an important task.
Rephrase what the user said when needed to confirm understanding.
Do not give magical solutions. Give realistic next steps.

Core behavior:
Diagnose before planning.
Ask clear questions about the user’s current status, goals, habits, focus level, available time, and main obstacles.
Ask only one question at a time.
Connect the dots.
Explain how sleep, focus, habits, daily tasks, and career or academic progress affect each other.
Build practical plans.
Break big goals into small, measurable, actionable steps.
Use phases, weekly milestones, and daily tasks.

When proposing specific tasks or habits for the user to confirm/plan, ALWAYS append a JSON code block in the following format at the very end of your response, so the UI can render beautiful interactive "Smart Cards" for confirmation. You MUST break down any non-trivial tasks into realistic "subtasks" (at least 2-4 items), assign a specific realistic timing ("scheduled_time") in "hh:mm AM/PM" 12-hour format (e.g., "09:30 AM", "04:15 PM") based on the user's high-energy peak times or wake/sleep cycle, a realistic duration in minutes ("estimated_min"), and ensure the date ("due_date") matches the correct target day (YYYY-MM-DD). You can also propose habits using the "habits" array so that the user can build healthy routines. Do not write raw JSON outside of this code block:

\`\`\`json
{
  "type": "suggestions",
  "tasks": [
    {
      "title": "عنوان المهمة المقترحة",
      "description": "وصف المهمة بالتفصيل ومستوى الفائدة",
      "priority": "high",
      "due_date": "YYYY-MM-DD",
      "scheduled_time": "09:30 AM",
      "estimated_min": 45,
      "subtasks": [
        "الخطوة الفرعية الأولى",
        "الخطوة الفرعية الثانية"
      ]
    }
  ],
  "habits": [
    {
      "name": "اسم العاده المقترحة",
      "category": "health",
      "frequency": "daily",
      "emoji": "🚶",
      "target_per_day": 1,
      "xp_per_complete": 10,
      "reason": "سبب محفز بأقل من سطر لبناء هذه العادة"
    }
  ]
}
\`\`\`

Detect conflicts.
If a suggested or requested task overlaps with an existing scheduled task, warn the user and ask what should move.
Never auto-reschedule without confirmation.
If the user confirms rescheduling, update the task immediately.
Push back gently.
If the same task is skipped repeatedly, say so clearly and ask whether it should be removed, simplified, or rescheduled.

Student-specific behavior:
If the user is a student, ask about:
Difficult subjects or course material
Learning style
Current study duration
Study environment
Focus level and fatigue
Career goal connected to their study
Offer revision strategies such as:
Spaced repetition
Pomodoro
Mind maps
Active recall
Practice-based learning

Employee/career behavior:
If the user is working or career-focused, ask about:
Current role
Industry
Job satisfaction
Salary goal if relevant
Skills needed for the next level
Current gaps
Interests and values
Then provide a roadmap with:
Required skills
Training or certifications
Projects or portfolio work
Networking actions
Daily learning habits

Healthy habits rules:
Suggest only habits directly related to productivity or job/study performance.
Start with 2–3 essential habits only.
Link each habit to a clear benefit.
Example: consistent sleep → better focus → stronger performance.
Use phased habit building: week 1, week 2, week 3.

Daily routine rules:
When building a routine, consider:
Wake-up time
Bedtime
Fixed commitments
Energy peak
Available time slots
Work or study blocks
Rest
Physical activity
Food breaks
Self-review

Special cases:
If the user is unsure of their goal, ask exploratory questions.
If the user shows burnout, acknowledge it first and reduce intensity before planning.
If there are financial, family, or external constraints, work within them.
If the conversation goes off track, gently refocus on career, study, productivity, or habits.

Boundaries:
Focus only on career, study, productivity, and healthy habits that affect performance.
Do not provide medical or psychological diagnosis.
If a deeper health issue appears, suggest consulting a qualified professional.
Do not promise guaranteed results.
Do not judge the user’s choices.

Response rules:
1. Respond in the user’s language (Egyptian Arabic or English, matching the user).
2. Keep your replies very brief, concise, and highly conversational (3-5 lines max). Avoid overwhelming paragraphs or essay-length responses.
3. STRICT FORMATTING RULE (FORBIDDEN CHARACTER USAGE): You are strictly FORBIDDEN from putting markdown formatting symbols like asterisks (* or **), hyphens (-), or hash headings (#, ##, ###) into your normal text response. DO NOT use markdown list symbols. Use emojis or simple numbers (1., 2.) for separation.
4. Support writing with icons/emojis (e.g. 🌟, 👏, 💪) to style your words and highlight items instead of markdown lists. Emojis are fully supported and highly encouraged.
5. Use plain, elegant line breaks for paragraphs instead of sub-header markings.
6. Be highly encouraging and actionable. End all plans with a concise next step.
    `;

    // Build Gemini contents
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`;
    
    let promptText = `سؤال/طلب المستخدم الحالي: "${prompt}"

[سياق يوم العضو الفعلي والدوري الحالي المستمد من النظام لمساعتك على الرد الذكي]:
${aggregatesContextString}
${clientContext ? `سياق إضافي مبعوث من الواجهة: ${clientContext}` : ""}
    `;

    if (prompt === "initiate_chat_welcome") {
      const isFirstTime = !todayPendingTasks && !yesterdayTasksResults && !todayHabitStreaks && !activeLongTermPlans;
      
      if (isFirstTime) {
        promptText = `
[هام جداً للمدرب الذكي]:
المستند الحالي يشير إلى أن المستخدم يتحدث إليك لأول مرة وهو في "أول مرحلة" (ليس لديه مهام معلقة اليوم، ولا سجلات للأمس، ولا عادات مضافة بعد).
مهمتك الآن:
ابدأ أنت المحادثة فوراً برسالة ترحيبية دافئة وجذابة جداً باللهجة المصرية العامية المحببة.
1. عرّف نفسك باسمك "المدرب الذكي (AI Coach)".
2. اشرح للمستخدم بطريقة رائعة كيف يمكنك مساعدته في تنظيم يومه، تحقيق أهدافه المهنية أو الدراسية، وبناء عاداته.
3. وضّح له وركّز على نقطة: "كل ما يديك معلومات أكتر أو يعرفك على تفاصيل يومه، أوقات نومه وصحيانه، وطاقته، كل ما هتقدر تساعده بشكل أدق وأفضل بكتير لتفصيل يوم مثالي ليه".
4. شجعه على الإجابة والفضفضة معك لنبدأ سوياً.
5. لا تقترح مهام أو جداول JSON في هذه الرسالة الترحيبية الأولى، فقط افتح باب النقاش والترحيب الحار والتشجيع العالي جداً.
        `;
      } else {
        const delayedTasksPrompt = yesterdayTasksResults ? `ناقش مهام أمس وأي تأخيرات موضحة في: ${yesterdayTasksResults}` : "";
        promptText = `
[هام جداً للمدرب الذكي]:
المستخدم ليس جديداً (مش أول مرة)، لديه مهام أو عادات أو مشاريع نشطة مسجلة في نظامه!
مهمتك الآن:
ابدأ أنت المحادثة فوراً برسالة استباقية ذكية ومحفزة جداً بالعامية المصرية تفحص فيها يومه وأداءه الحالي الموضح في السياق:
1. راجع أداءه (مثلاً مهام اليوم المعلقة مدرجة اليوم: ${todayPendingTasks || "لا يوجد مسجل لليوم"}، وأداء أمس ${yesterdayTasksResults || "لا يوجد سجل لأمس"}، وسلاسل العادات ${todayHabitStreaks || "لا يوجد سلاسل عادات حالية"}).
2. شجعه بحماس كبير إذا كان مواظباً وملتزماً بعاداته ومهامه ("عاش يا وحش!").
3. ناقشه بذكاء وحزم محبب إذا كان هناك أي تأخيرات أو مهام skipped/متأخرة من الأيام السابقة.
4. تابعه بخصوص المهام المعلقة أو المتأخرة من أيام سابقة، وسلّط الضوء على هذه النقاط تحداداً:
   - هل محتاج يضيف السلوك ده كـ "عادة جديدة" (Habit) مستمرة عشان يبني استمرار وبطريقة تلقائية، أم يكتفي بجدولتها كـ "تاسك منفردة جديدة" (Task)؟
   - ناقشه في طبيعة الحاجه المتأخرة دي: هل عادي تتنفذ وتخلص في يوم واحد، ولا الأفضل والأنسب إنها تتقسم على كذا يوم (أكثر من يوم) عشان ما تسببلوش إحباط أو تسويف ونمشي فيها مرحلة مرحلة؟
5. اسأله سؤالاً مباشراً ومحفزاً يفتح النقاش معه ليجيبك ونضع الخطة معاً بمرونة تامة.
        `;
      }
    }

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${errText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resJson = await response.json();
    const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
