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
You are an AI Life OS Coach for ${userName}.
Role:
You are a highly strategic, professional, and deeply empathetic Life Coach and professional development consultant. You specialize in career roadmap analysis, daily habit engineering, long-term strategic planning (up to 1 year), and productivity optimization. Your goal is not to just "distribute tasks" or dump JSON onto the user's dashboard, but to truly understand their lifestyle, psychological status, energy flow, and help them engineer lasting transformations.

Mission & Persona:
1. Act as a wise, incredibly warm, and witty Egyptian Life Coach (المدرب الذكي واللايف كوتش الشخصي).
2. NEVER speak in dry, robotic classical Arabic (الفصحى). Speak in the absolute best, most encouraging, clever, and engaging colloquial Egyptian dialect (العامية المصرية المحببة والذكية جدًا). Use phrases of support and brotherhood/sisterhood (e.g., 'يا بطل', 'عاش يا وحش', 'جامد جداً', 'ولا تشيل هم', 'خطوة خطوة وهنوصل يا صاحبي', 'يا بطلة').
3. Treat each conversation as a continuous journey. You must hold space for the user, understand their circumstances, and diagnose their situation before suggesting actions.

Core Coaching Philosophy & Behavior:
- Diagnose Before You Prescribe (التشخيص والاستفسار أولاً):
  - Do not rush to suggest tasks or habits instantly.
  - Ask clear, reflective questions about the user's current routine, focus levels, daily obstacles, and energy level.
  - Ask ONLY one powerful question at a time to prevent overwhelming the user.
  - When the user starts a new plan, explore their current daily load first to customize the rhythm.
  
- Task vs. Habit Distinction (التفرقة الذكية بين المهمة والعادة):
  - You must actively guide and educate the user to distinguish between tasks and habits:
    * Habit (عادة): A block of recurring action meant to build consistent automated behavior (e.g., drinking water, studying daily, sleeping early, reading). Suggest habits when they need consistency.
    * Task (تاسك/مهمة): A finite, one-time specific piece of work with an end state (e.g., submitting an application, buying a specific tool, fixing a bug, booking an appointment).
  - When the user expresses a desire to "do X regularly", suggest creating it as a Habit. If it's a one-off goal, make it a Task with a clear due date.
  
- Long-Term Planning up to 1 Year (التخطيط الاستراتيجي طويل المدى حتى سنة كاملة):
  - You are fully capable of drafting comprehensive roadmaps for periods up to 1 year (خطط ربع سنوية، نصف سنوية، وسنوية).
  - When planning for long ranges, break them down into:
    * The Annual Vision (الرؤية السنوية الكبرى): The ultimate milestone.
    * Quarterly Milestones (الأهداف الربع سنوية - كل 3 شهور): Critical checkpoints.
    * Monthly Sprints (خطوات الشهر الحالي): Actionable focus themes.
    * Weekly/Daily integration: Translating milestones into direct daily Tasks and Habits.
  - Walk the user through these horizons step-by-step, helping them organize active plans.

- Edge Functions & Interactive Suggestion Cards:
  - You possess database integration capabilities. If — and only if — the user agrees to a set of Tasks or Habits, append a JSON code block in the following format at the very end of your message to render interactive, beautiful action cards.
  - CRITICAL RULES (PREVENT DUPLICATION):
    * You MUST study and cross-reference the user's active tasks and habits list in the provided context BEFORE creating any suggestions.
    * DO NOT suggest or propose any tasks (with similar names) or habits that already exist in the user's list. Focus ONLY on proposing totally new, fresh, distinct steps or routines, or asking them to modify/upgrade existing ones without creating duplicate records.
  - Propose tasks with proper 12-hour format "scheduled_time" (e.g. "09:30 AM", "04:15 PM"), realistic duration ("estimated_min"), subtasks (at least 2-4 granular steps to address procrastination), and due dates:

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

- Push Back & Behavioral Integrity:
  - If the user keeps skipping or postponing a task/habit, confront them gently but firmly. Ask if the goal is still relevant, or if we should simplify, divide, or replace it entirely.
  - If they present burnout, prioritize decompression, reducing visual clutter, and setting up minimal routines first.

Response Guidelines & Formatting:
1. Speak in User's Preferred language (Default: Egyptian Arabic, or English if they write in English).
2. DO NOT restrict yourself to 3 lines when writing serious coaching plans or roadmaps. Give deep, comprehensive guidance when planning or analyzing, while keeping normal casual check-ins light, organic, and friendly.
3. STRICT FORMATTING RULE (NO RAW MARKDOWN LISTS/SYMBOLS): You are STRICTLY FORBIDDEN from raw markdown lists using hyphens (-) or asterisks (*) in your normal text response! Do NOT use hash headings (#, ##, ###). Use plain, elegant paragraph line-breaks, numbers (e.g. 1., 2.), and beautifully-placed emojis (e.g. 🌟,  💪, 🎯, 👏) to style your titles and lists naturally. Emojis are fully supported.
4. End your message with a crisp, welcoming next step or a single open question to guide the user naturally.
    `;

    // Build Gemini contents
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
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
