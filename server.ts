import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
// import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { Project, Session } from "./types/projects";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// On the server side, we prioritize using the Service Role Key if available.
// This allows the backend to perform database operations securely across RLS boundaries.
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client on backend:", err);
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.warn("WARNING: Supabase credentials are not configured in environment. File fallback active.");
} else if (!supabaseServiceKey) {
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not configured on the backend. RLS policy issues might occur for server-initiated DB operations.");
}

// Helpers for mappings between PG snake_case and interface camelCase
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function dbToSession(row: any): Session {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title || "",
    description: row.description || "",
    date: row.date,
    duration: Number(row.duration) || 0,
    tasksCompleted: row.tasks_completed || [],
    notes: row.notes || "",
    mood: row.mood,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function sessionToDb(s: any): any {
  return {
    id: s.id,
    project_id: s.projectId,
    title: s.title || "",
    description: s.description || "",
    date: s.date,
    duration: Number(s.duration) || 0,
    tasks_completed: s.tasksCompleted || [],
    notes: s.notes || "",
    mood: s.mood || "productive"
  };
}

function dbToProject(row: any, sessions: any[] = []): Project {
  let aiContext = row.ai_context || "";
  let milestones = [];
  try {
    if (aiContext && aiContext.startsWith("{")) {
      const parsed = JSON.parse(aiContext);
      aiContext = parsed.aiContext || "";
      milestones = parsed.milestones || [];
    }
  } catch (e) {
    // raw text
  }

  const computedTotalHours = sessions.length > 0
    ? Number((sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) / 60).toFixed(1))
    : Number(row.total_hours_spent) || 0;

  const computedCompletedSessions = sessions.length > 0
    ? sessions.length
    : Number(row.completed_sessions) || 0;

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || "",
    thumbnail: row.thumbnail || "",
    images: row.images || [],
    technologies: row.technologies || [],
    links: row.links || {},
    status: row.status || "planning",
    priority: row.priority || "medium",
    estimatedHours: Number(row.estimated_hours) || 0,
    totalHoursSpent: computedTotalHours,
    plannedSessions: Number(row.planned_sessions) || 0,
    completedSessions: computedCompletedSessions,
    progress: Number(row.progress) || 0,
    currentPhase: row.current_phase || "",
    lastMilestone: row.last_milestone || "",
    nextMilestone: row.next_milestone || "",
    aiContext: aiContext,
    milestones: milestones,
    startDate: row.start_date || "",
    targetEndDate: row.target_end_date || "",
    completedDate: row.completed_date || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    sessions: sessions.map(dbToSession)
  };
}

function projectToDb(p: any): any {
  let aiContextValue = p.aiContext || "";
  if (p.milestones && p.milestones.length > 0) {
    aiContextValue = JSON.stringify({
      aiContext: p.aiContext || "",
      milestones: p.milestones || []
    });
  }

  return {
    id: p.id,
    user_id: p.userId,
    title: p.title || "Untitled Project",
    description: p.description || "",
    thumbnail: p.thumbnail || "",
    images: p.images || [],
    technologies: p.technologies || [],
    links: p.links || {},
    status: p.status || "planning",
    priority: p.priority || "medium",
    estimated_hours: Number(p.estimatedHours) || 0,
    total_hours_spent: Number(p.totalHoursSpent) || 0,
    planned_sessions: Number(p.plannedSessions || p.plannedSesions) || 0,
    completed_sessions: Number(p.completedSessions) || 0,
    progress: Number(p.progress) || 0,
    current_phase: p.currentPhase || "",
    last_milestone: p.lastMilestone || "",
    next_milestone: p.nextMilestone || "",
    ai_context: aiContextValue,
    start_date: p.startDate || null,
    target_end_date: p.targetEndDate || null,
    completed_date: p.completedDate || null
  };
}

const PROJECTS_FILE = path.join(process.cwd(), "projects-db.json");

// Local File DB Helper functions
function readProjects(): any[] {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const data = fs.readFileSync(PROJECTS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading projects DB:", err);
    return [];
  }
}

function writeProjects(projects: any[]) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing projects DB:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to extract user ID gracefully
  const getUserId = (req: express.Request) => {
    const rawId = req.headers["x-user-id"] as string;
    const fallbackUuid = "00000000-0000-0000-0000-000000000000";
    if (!rawId) return fallbackUuid;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
    return isUuid ? rawId : fallbackUuid;
  };

  // Helper for AI responses through GitHub Models API (OpenAI compatible)
  const getAIResponse = async (prompt: string, systemInstruction: string, jsonMode: boolean = false) => {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY;
    
    // Fallback if GITHUB_TOKEN is not configured
    if (!token) {
      console.warn("GITHUB_TOKEN is not configured. Falling back to Gemini key.");
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("Neither GITHUB_TOKEN nor GEMINI_API_KEY is configured on server.");
      }
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: jsonMode ? "application/json" : "text/plain"
        }
      });
      return response.text;
    }

    // Call GitHub Models API
    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const body: any = {
      model: "gpt-4o",
      messages,
      temperature: 0.7,
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
      body.messages.push({
        role: "system",
        content: "Important: output ONLY raw, valid JSON. No markdown backticks, no wrapping."
      });
    }

    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "aistudio-build"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GitHub Models API error (${response.status}): ${errText}`);
    }

    const resJson = await response.json();
    let text = resJson.choices?.[0]?.message?.content || "";
    
    // Strip markdown formatting if any present
    if (jsonMode) {
      text = text.trim();
      if (text.startsWith("```json")) {
        text = text.slice(7);
      }
      if (text.endsWith("```")) {
        text = text.slice(0, -3);
      }
      text = text.trim();
    }
    return text;
  };

  const getAIResponseWithHistory = async (
    systemInstruction: string,
    history: Array<{ role: 'user' | 'model', content: string }>,
    currentPrompt: string,
    jsonMode: boolean = false
  ) => {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_API_KEY;

    if (!token) {
      console.warn("GITHUB_TOKEN is not configured. Falling back to Gemini key.");
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("Neither GITHUB_TOKEN nor GEMINI_API_KEY is configured on server.");
      }
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Map chat history to Gemini schema (and constrain size to last 15 messages so it doesn't overflow)
      const contentsPayload: any[] = [];
      const lastHistory = history.slice(-15);
      for (const msg of lastHistory) {
        contentsPayload.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }

      // Append current user prompt
      contentsPayload.push({
        role: 'user',
        parts: [{ text: currentPrompt }]
      });

      // Clean sequence of consecutive roles (Gemini expects strictly alternating roles)
      const sanitizedContents: any[] = [];
      for (const msg of contentsPayload) {
        if (sanitizedContents.length === 0) {
          sanitizedContents.push(msg);
        } else {
          const last = sanitizedContents[sanitizedContents.length - 1];
          if (last.role === msg.role) {
            last.parts = [...last.parts, ...msg.parts];
          } else {
            sanitizedContents.push(msg);
          }
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: sanitizedContents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: jsonMode ? "application/json" : "text/plain"
        }
      });
      return response.text;
    }

    // OpenAI/Azure chat completions schema
    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }

    // Map history to OpenAI schema
    const lastHistory = history.slice(-15);
    for (const item of lastHistory) {
      messages.push({
        role: item.role === 'model' ? 'assistant' : 'user',
        content: item.content
      });
    }

    // Append current user prompt
    messages.push({
      role: 'user',
      content: currentPrompt
    });

    const body: any = {
      model: "gpt-4o",
      messages,
      temperature: 0.7,
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
      body.messages.push({
        role: "system",
        content: "Important: output ONLY raw, valid JSON. No markdown backticks, no wrapping."
      });
    }

    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "aistudio-build"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fallback HTTP endpoint failed: ${errText}`);
    }

    const resJson = await response.json();
    let text = resJson.choices?.[0]?.message?.content || "";
    if (jsonMode) {
      text = text.trim();
      if (text.startsWith("```json")) {
        text = text.slice(7);
      }
      if (text.endsWith("```")) {
        text = text.slice(0, -3);
      }
      text = text.trim();
    }
    return text;
  };

  const getDBContextForUser = async (userId: string): Promise<string> => {
    if (!supabase || !userId) return "";
    
    try {
      let userName = "البطل";
      let wakeTime = "07:00";
      let sleepTime = "23:00";
      let energyPeak = "صباحي";
      let defaultLang = "ar";

      // 1. Fetch User profile
      const { data: userRow } = await supabase.from('users').select('name').eq('id', userId).maybeSingle();
      if (userRow?.name) {
        userName = userRow.name;
      }

      // 2. Fetch Life profiles
      const { data: lifeRow } = await supabase.from('life_profiles').select('wake_time, sleep_time, energy_peak').eq('user_id', userId).maybeSingle();
      if (lifeRow) {
        wakeTime = lifeRow.wake_time ? String(lifeRow.wake_time).slice(0, 5) : "07:00";
        sleepTime = lifeRow.sleep_time ? String(lifeRow.sleep_time).slice(0, 5) : "23:00";
        energyPeak = lifeRow.energy_peak || "صباحي";
      }

      // 3. Database aggregation
      let activeLongTermPlans = "";
      let todayPendingTasks = "";
      let yesterdayTasksResults = "";
      let todayHabitStreaks = "";

      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Today Tasks
      const { data: tTasks } = await supabase.from('tasks').select('title, status, priority').eq('user_id', userId).eq('due_date', todayStr);
      if (tTasks && tTasks.length > 0) {
        todayPendingTasks = tTasks.filter((t: any) => t.status !== 'done').map((t: any) => `- ${t.title} [الأهمية: ${t.priority}]`).join('\n');
      }

      // Yesterday Tasks
      const { data: yTasks } = await supabase.from('tasks').select('title, status').eq('user_id', userId).eq('due_date', yesterdayStr);
      if (yTasks && yTasks.length > 0) {
        const completed = yTasks.filter((t: any) => t.status === 'done').map((t: any) => `- ${t.title}`);
        const skipped = yTasks.filter((t: any) => t.status !== 'done').map((t: any) => `- ${t.title}`);
        yesterdayTasksResults = `\nمنجز أمس:\n${completed.join('\n') || "لاشيء"}\nالمؤجل/المتخطي أمس:\n${skipped.join('\n') || "لاشيء"}`;
      }

      // Habits
      const { data: dbHabits } = await supabase.from('habits').select('title, current_streak').eq('user_id', userId);
      if (dbHabits && dbHabits.length > 0) {
        todayHabitStreaks = dbHabits.map((h: any) => `- ${h.title}: (سلسلة أيام: ${h.current_streak || 0})`).join('\n');
      }

      // Active plans
      let dbProjRes = await supabase.from('long_term_plans').select('title, status, current_phase').eq('user_id', userId);
      if (dbProjRes.error) {
        dbProjRes = await supabase.from('goals').select('title, status').eq('user_id', userId);
      }
      const dbProj = dbProjRes.data;
      if (dbProj && dbProj.length > 0) {
        activeLongTermPlans = dbProj.map((p: any) => `- ${p.title} (${p.status || 'نشط'}) ${p.current_phase ? `- المرحلة الحالية: ${p.current_phase}` : ''}`).join('\n');
      }

      const profileDetails = `
- اسم المستخدم: ${userName}
- وقت الاستيقاظ: ${wakeTime}
- وقت النوم: ${sleepTime}
- أوقات الانتاجية العالية (Peak Energy): ${energyPeak}
- اللغة المختارة: ${defaultLang}
      `;

      return `
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
    } catch (err) {
      console.error("Failed to fetch user DB context in local backup flow:", err);
      return "";
    }
  };

  const getChatSystemInstruction = async (userId: string): Promise<string> => {
    let userName = "البطل";
    if (supabase && userId) {
      try {
        const { data: userRow } = await supabase.from('users').select('name').eq('id', userId).maybeSingle();
        if (userRow?.name) userName = userRow.name;
      } catch (e) {}
    }

    const todayStr = new Date().toISOString().split('T')[0];

    return `
CRITICAL CONTEXT: Today's date is ${todayStr}. All task due dates you suggest MUST be on or after ${todayStr} (default to ${todayStr} for immediate/today's tasks). Never generate dates in the past (like 2023 or 2024).

You are an AI Life OS Coach for ${userName}.
Role:
You are a highly strategic, professional, and deeply empathetic Life Coach and professional development consultant. You specialize in career roadmap analysis, daily habit engineering, long-term strategic planning (up to 1 year), and productivity optimization. Your goal is not to just "distribute tasks" or dump JSON onto the user's dashboard, but to truly understand their lifestyle, psychological status, energy flow, and help them engineer lasting transformations.

Mission & Persona:
1. Act as a wise, incredibly warm, and witty Egyptian Life Coach (المدرب الذكي واللايف كوتش الشخصي).
2. NEVER speak in dry, robotic classical Arabic (الفصحى). Speak in the absolute best, most encouraging, clever, and engaging colloquial Egyptian dialect (العامية المصرية المحببة والذكية جدًا). Use phrases of support and brotherhood/sisterhood (e.g., 'يا بطل', 'عاش يا وحش', 'جامد جداً', 'ولا تشيل هم', 'خطوة خطوة وهنوصل يا صاحبي', 'يا بطلة').
3. Treat each conversation as a continuous journey. You must hold space for the user, understand their circumstances, and diagnose their situation before suggesting actions.

Core Coaching Philosophy & Behavior:
- PROACTIVE USER LIFE AND CAREER DISCOVERY (المبادرة والاستكشاف الفطري):
  * You MUST be highly PROACTIVE (مبادر جداً بالأسئلة الهادفة) to learn about the user's life, career, lifestyle, and priorities. Always initiate questions to discover what is important, analyze them, and plan their life correctly.
  * Do not wait for the user to tell you about their day; instead, initiate and ask clear, friendly, and powerful questions to understand what truly matters to them.
  * Analyze their answers to dynamically profile them, construct structured lifegoals, and plan their life correctly.
  * At the end of every response, you MUST ask a single, highly engaging, open-ended question that prompts them to share more details about their career goals, daily routine, wake/sleep patterns, or energy levels (e.g., "أنا عايز أعرف أكتر عن طبيعة شغلك أو دراستك عشان نفصلك خطة عبقرية.. يومك بيمشي إزاي؟").

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
  - CRITICAL RULES (PREVENT DUPLICATION & CONFLICTS):
    * You MUST study and cross-reference the user's active tasks and habits list in the provided context BEFORE creating any suggestions.
    * DO NOT suggest or propose any tasks (with similar names) or habits that already exist in the user's list. Focus ONLY on proposing totally new, fresh, distinct steps or routines, or asking them to modify/upgrade existing ones without creating duplicate records.
    * Allowed Habit Categories: When suggesting a habit, you MUST select a ("category") value strictly from this list of exact allowed parts: ["spiritual", "health", "learning", "productivity", "social", "work", "fitness", "mindfulness"]. Do not recommend any other category values (e.g., "nutrition" or "career" are STRICTLY FORBIDDEN).
    * Allowed Habit Frequencies: When suggesting a habit, you MUST select a ("frequency") value strictly from this list of exact allowed parts: ["daily", "weekly"]. Any other value (e.g., "3 days a week", "monthly", "twice daily") is ABSOLUTELY FORBIDDEN and will fail database validation!
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
2. STRICT RESPONSES FORMAT AND LENGTH LIMITATION (MOST CRITICAL RULES):
   - ALWAYS keep your responses VERY SHORT and concise (أقصى حد ثلاث أو أربع فقرات قصيرة ومباشرة)!
   - You are ABSOLUTELY FORBIDDEN from using any asterisks (*) or hash symbols (#) in your response! No bold markdown using asterisks, no italic markdown, no raw markdown bullet points using hyphens or asterisks, and no headers using hash signs.
   - If you need lists/headers, use plain text breaks, Arabic numbering (e.g. 1., 2.), and beautifully-placed emojis (e.g. 🌟, 💪, 🎯, 👏) to style your titles and lists natively.
3. End your message with a single powerful, highly engaging open question to discover their career and lifestyle status.
    `;
  };

  const getGeminiResponse = async (prompt: string, systemInstruction: string) => {
    return getAIResponse(prompt, systemInstruction, true);
  };

  // AI Chat Proxy Endpoint (Existing)
  app.post("/api/chat", async (req, res) => {
    const { prompt, context, sessionId, fileData, systemInstruction } = req.body;
    
    if (supabaseUrl && supabaseKey && supabase) {
      try {
        const authHeader = req.headers["authorization"] || "";
        
        // Invoke the Supabase Edge Function 'chat'
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { prompt, context, sessionId, fileData },
          headers: {
            ...(authHeader ? { 'Authorization': authHeader } : {}),
            'x-gemini-api-key': process.env.GEMINI_API_KEY || ''
          }
        });

        if (error) {
          throw error;
        }

        return res.json(data);
      } catch (error: any) {
        console.error("Chat Supabase Edge Function Proxy Error, falling back to server-side model:", error);
        try {
          const userId = (req.headers["x-user-id"] || "") as string;
          const dbContext = await getDBContextForUser(userId) || "";
          const sysInstruction = await getChatSystemInstruction(userId);
          
          let chatHistory: any[] = [];
          if (sessionId && supabase && !sessionId.startsWith('temp_')) {
            try {
              const { data: chatRow } = await supabase
                .from('chat_messages')
                .select('content')
                .eq('id', sessionId)
                .single();
              if (chatRow) {
                const parsed = JSON.parse(chatRow.content);
                if (parsed && Array.isArray(parsed.messages)) {
                  chatHistory = parsed.messages;
                }
              }
            } catch (historyErr) {
              console.error("Error loading chat history in server fallback:", historyErr);
            }
          }

          let promptText = prompt;
          if (prompt === "initiate_chat_welcome") {
            const hasExistingData = dbContext.includes("مهام معلقة") || dbContext.includes("سلاسل العادات") || dbContext.includes("عادات") || dbContext.includes("مشاريع");
            if (!hasExistingData) {
              promptText = `
[هام جداً للمدرب الذكي]:
المستند الحالي يشير إلى أن المستخدم يتحدث إليك لأول مرة وهو في "أول مرحلة" (ليس لديه مهام معلقة اليوم، ولا سجلات للأمس، ولا عادات مضافة بعد).
مهمتك الآن:
ابدأ أنت المحادثة فوراً برسالة ترحيبية دافئة وجذابة جداً باللهجة المصرية العامية المحببة.
1. عرّف نفسك باسمك "المدرب الذكي (AI Coach)".
2. اشرح للمستخدم بطريقة رائعة كيف يمكنك مساعدته في تنظيم يومه، تحقيق أهدافه المهنية أو الدراسية، وبناء عاداته.
3. وضّح له وركّز على نقطة: "كل ما يديك معلومات أكتر أو يعرفك على تفاصيل يومه، أوقات نومه وصحيانه، وطاقته، كل ما هتقدر تساعده بشكل أدق وأفضل بكتير لتفصيل يوم مثالي ليه".
4. شجعه على الإجابة والفضفضة معك لنبدأ سوياً.
5. لا تقترح مهام أو عادات JSON في هذه الرسالة الترحيبية الأولى، فقط افتح باب النقاش والترحيب الحار والتشجيع العالي جداً.
              `;
            } else {
              promptText = `
[هام جداً للمدرب الذكي]:
المستخدم ليس جديداً (مش أول مرة)، لديه مهام أو عادات أو مشاريع نشطة مسجلة في نظامه!
مهمتك الآن:
ابدأ أنت المحادثة فوراً برسالة استباقية ذكية ومحفزة جداً بالعامية المصرية تفحص فيها يومه وأداءه الحالي الموضح في السياق:
1. راجع أداءه المعروض في سياق يوم العضو الفعلي (مثل سلاسل العادات، والمهام المعلقة، وأداء أمس).
2. شجعه بحماس كبير إذا كان مواظباً وملتزماً بعاداته ومهامه ("عاش يا وحش!").
3. ناقشه بذكاء وحزم محبب إذا كان هناك أي تأخيرات أو مهام skipped/متأخرة من الأيام السابقة.
4. تابعه بخصوص المهام المعلقة أو المتأخرة من أيام سابقة، وسلّط الضوء على هذه النقاط تحديداً:
   - هل محتاج يضيف السلوك ده كـ "عادة جديدة" (Habit) مستمرة عشان يبني استمرار وبطريقة تلقائية، أم يكتفي بجدولتها كـ "تاسك منفردة جديدة" (Task)؟
   - ناقشه في طبيعة الحاجه المتأخرة دي: هل عادي تتنفذ وتخلص في يوم واحد، ولا الأفضل والأنسب إنها تتقسم على كذا يوم (أكثر من يوم) عشان ما تسببلوش إحباط أو تسويف ونمشي فيها مرحلة مرحلة؟
5. اسأله سؤالاً مباشراً ومحفزاً يفتح النقاش معه ليجيبك ونضع الخطة معاً بمرونة تامة ونظام 12-ساعة.
              `;
            }
          }

          const localResponseText = await getAIResponseWithHistory(
            sysInstruction,
            chatHistory,
            `Context about my life:\n${dbContext}\n\n${context ? `سياق إضافي: ${context}` : ""}\n\nPrompt: ${promptText}`,
            false
          );
          return res.json({ text: localResponseText });
        } catch (fbErr: any) {
          console.error("Local model fallback failed:", fbErr);
          return res.status(500).json({ error: error.message || "Failed to execute Supabase Chat Edge Function" });
        }
      }
    } else {
      try {
        const userId = (req.headers["x-user-id"] || "") as string;
        const dbContext = await getDBContextForUser(userId) || "";
        const sysInstruction = await getChatSystemInstruction(userId);

        let chatHistory: any[] = [];
        if (sessionId && supabase && !sessionId.startsWith('temp_')) {
          try {
            const { data: chatRow } = await supabase
              .from('chat_messages')
              .select('content')
              .eq('id', sessionId)
              .single();
            if (chatRow) {
              const parsed = JSON.parse(chatRow.content);
              if (parsed && Array.isArray(parsed.messages)) {
                chatHistory = parsed.messages;
              }
            }
          } catch (historyErr) {
            console.error("Error loading chat history in server fallback:", historyErr);
          }
        }

        let promptText = prompt;
        if (prompt === "initiate_chat_welcome") {
          const hasExistingData = dbContext.includes("مهام معلقة") || dbContext.includes("سلاسل العادات") || dbContext.includes("عادات") || dbContext.includes("مشاريع");
          if (!hasExistingData) {
            promptText = `
[هام جداً للمدرب الذكي]:
المستند الحالي يشير إلى أن المستخدم يتحدث إليك لأول مرة وهو في "أول مرحلة" (ليس لديه مهام معلقة اليوم، ولا سجلات للأمس، ولا عادات مضافة بعد).
مهمتك الآن:
ابدأ أنت المحادثة فوراً برسالة ترحيبية دافئة وجذابة جداً باللهجة المصرية العامية المحببة.
1. عرّف نفسك باسمك "المدرب الذكي (AI Coach)".
2. اشرح للمستخدم بطريقة رائعة كيف يمكنك مساعدته في تنظيم يومه، تحقيق أهدافه المهنية أو الدراسية، وبناء عاداته.
3. وضّح له وركّز على نقطة: "كل ما يديك معلومات أكتر أو يعرفك على تفاصيل يومه، أوقات نومه وصحيانه، وطاقته، كل ما هتقدر تساعده بشكل أدق وأفضل بكتير لتفصيل يوم مثالي ليه".
4. شجعه على الإجابة والفضفضة معك لنبدأ سوياً.
5. لا تقترح مهام أو عادات JSON في هذه الرسالة الترحيبية الأولى، فقط افتح باب النقاش والترحيب الحار والتشجيع العالي جداً.
            `;
          } else {
            promptText = `
[هام جداً للمدرب الذكي]:
المستخدم ليس جديداً (مش أول مرة)، لديه مهام أو عادات أو مشاريع نشطة مسجلة في نظامه!
مهمتك الآن:
ابدأ أنت المحادثة فوراً برسالة استباقية ذكية ومحفزة جداً بالعامية المصرية تفحص فيها يومه وأداءه الحالي الموضح في السياق:
1. راجع أداءه المعروض في سياق يوم العضو الفعلي (مثل سلاسل العادات، والمهام المعلقة، وأداء أمس).
2. شجعه بحماس كبير إذا كان مواظباً وملتزماً بعاداته ومهامه ("عاش يا وحش!").
3. ناقشه بذكاء وحزم محبب إذا كان هناك أي تأخيرات أو مهام skipped/متأخرة من الأيام السابقة.
4. تابعه بخصوص المهام المعلقة أو المتأخرة من أيام سابقة، وسلّط الضوء على هذه النقاط تحديداً:
   - هل محتاج يضيف السلوك ده كـ "عادة جديدة" (Habit) مستمرة عشان يبني استمرار وبطريقة تلقائية، أم يكتفي بجدولتها كـ "تاسك منفردة جديدة" (Task)؟
   - ناقشه في طبيعة الحاجه المتأخرة دي: هل عادي تتنفذ وتخلص في يوم واحد، ولا الأفضل والأنسب إنها تتقسم على كذا يوم (أكثر من يوم) عشان ما تسببلوش إحباط أو تسويف ونمشي فيها مرحلة مرحلة؟
5. اسأله سؤالاً مباشراً ومحفزاً يفتح النقاش معه ليجيبك ونضع الخطة معاً بمرونة تامة ونظام 12-ساعة.
            `;
          }
        }

        const localResponseText = await getAIResponseWithHistory(
          sysInstruction,
          chatHistory,
          `Context about my life:\n${dbContext}\n\n${context ? `سياق إيجابي: ${context}` : ""}\n\nPrompt: ${promptText}`, 
          false
        );
        return res.json({ text: localResponseText });
      } catch (fbErr: any) {
        console.error("Local chat response failed:", fbErr);
        return res.status(500).json({ error: "Supabase integration not configured on backend and local AI fallback failed." });
      }
    }
  });

  // ================= AI SMART EXPLAIN API (Edge Function Proxy) =================
  app.post("/api/smart-explain", async (req, res) => {
    try {
      const { taskTitle, context } = req.body;

      if (!taskTitle) {
        return res.status(400).json({ error: "taskTitle is required" });
      }

      if (supabaseUrl && supabaseKey && supabase) {
        try {
          // Delegate completely to Supabase Edge Function
          const { data, error } = await supabase.functions.invoke('smart-explain', {
            body: { taskTitle, context },
            headers: {
              'x-gemini-api-key': process.env.GEMINI_API_KEY || ''
            }
          });

          if (error) {
            throw error;
          }

          return res.json(data);
        } catch (error: any) {
          console.error("Smart Explain Edge Function Error, falling back to local AI:", error);
          const sysInstruction = "You are a life coach and productivity expert. Give a brief, high-impact colloquial Egyptian-Arabic explanation on the best way to execute this task based on context.";
          const localResponseText = await getAIResponse(`Task: "${taskTitle}"\nContext: ${context || ""}`, sysInstruction, false);
          return res.json({ text: localResponseText });
        }
      } else {
        const sysInstruction = "You are a life coach and productivity expert. Give a brief, high-impact colloquial Egyptian-Arabic explanation on the best way to execute this task based on context.";
        const localResponseText = await getAIResponse(`Task: "${taskTitle}"\nContext: ${context || ""}`, sysInstruction, false);
        return res.json({ text: localResponseText });
      }
    } catch (error: any) {
      console.error("Smart Explain Error:", error);
      res.status(500).json({ error: error.message || "Failed to execute Supabase Edge Function" });
    }
  });

  // ================= AI PLANS GENERATION =================

  app.post("/api/goals/:id/generate-ai-plan", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    const { title, description, timeframe, category } = req.body;

    try {
      if (!title) {
        return res.status(400).json({ error: "Goal title is required" });
      }

      const systemInstruction = `You are an elite, results-focused AI Life & Performance Coach.
Provide a high-performance roadmap to achieve this long-term goal.
You must return a JSON object with exactly the following structure:
{
  "milestones": [
    { "title": "Milestone Title 1", "duration": "Duration description (e.g. Week 1)" },
    { "title": "Milestone Title 2", "duration": "Duration description" }
  ],
  "tasks": [
    { "title": "Task 1", "description": "Short description of what to do for this task", "priority": "high" },
    { "title": "Task 2", "description": "Short description of what to do for this task", "priority": "medium" }
  ]
}
Provide strictly between 3-5 milestones and 5-8 highly actionable corresponding tasks.
Ensure the milestones represent the high-level roadmap, and the tasks are granular action points.
Do NOT wrap in code blocks (like \`\`\`json) of markdown. Return valid parsing-safe JSON only.`;

      const prompt = `Goal: "${title}"
Description: "${description || 'No description provided'}"
Timeframe: "${timeframe || 'monthly'}"
Category: "${category || 'personal'}"

Generate the high-level milestones and actionable tasks to complete this goal.`;

      const rawResponse = await getAIResponse(prompt, systemInstruction, true);
      let parsed;
      try {
        let cleanText = rawResponse.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();
        parsed = JSON.parse(cleanText);
      } catch (parseError: any) {
        console.error("AI JSON Parse Error fallback:", rawResponse, parseError);
        parsed = {
          milestones: [
            { "title": "Establish Foundations", "duration": "Week 1" },
            { "title": "Active Execution & Milestones", "duration": "Week 2-3" },
            { "title": "Review, Polish & Launch", "duration": "Week 4" }
          ],
          tasks: [
            { "title": `Set up foundation for ${title}`, "description": "Prepare essential materials and tools", "priority": "high" },
            { "title": `Deep focus execution on ${title}`, "description": "Execute critical items and daily trackers", "priority": "medium" },
            { "title": `Post-mortem and retro for ${title}`, "description": "Compare achievements against expectations", "priority": "low" }
          ]
        };
      }

      if (supabaseUrl && supabaseAnonKey) {
        // A. Delete existing plan_milestones for this plan
        await supabase
          .from("plan_milestones")
          .delete()
          .eq("plan_id", id);

        // B. Insert generated plan_milestones
        const milestonesToInsert = (parsed.milestones || []).map((m: any, index: number) => ({
          plan_id: id,
          title: `${m.title} (${m.duration || "Phase"})`,
          is_done: false,
          order_index: index,
          due_date: null
        }));

        if (milestonesToInsert.length > 0) {
          const { error: mErr } = await supabase.from("plan_milestones").insert(milestonesToInsert);
          if (mErr) console.error("Error inserting generated milestones:", mErr);
        }

        // C. Clean up any previous tasks from AI for this goal to avoid duplicates if re-generated
        await supabase
          .from("tasks")
          .delete()
          .eq("goal_id", id);

        // D. Insert generated tasks with goal_id
        const tasksToInsert = (parsed.tasks || []).map((t: any) => ({
          user_id: userId,
          title: t.title,
          description: `${t.description || ""}\n\n[Plan Action Step for: ${title}]`,
          priority: t.priority || "medium",
          status: "todo",
          goal_id: id,
          due_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }));

        if (tasksToInsert.length > 0) {
          const { error: tErr } = await supabase.from("tasks").insert(tasksToInsert);
          if (tErr) console.error("Error inserting generated tasks:", tErr);
        }

        // E. Update goal status or metadata
        await supabase
          .from("goals")
          .update({
            progress: 0,
            metadata: {
              ai_generated: true,
              generated_at: new Date().toISOString(),
              current_phase: parsed.milestones?.[0]?.title || "Foundations"
            }
          })
          .eq("id", id);
      }

      return res.json({ success: true, parsed });

    } catch (err: any) {
      console.error("AI Plan generation error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate AI plan" });
    }
  });

  // ================= PROJECTS API =================

  // GET /api/projects - List all projects
  app.get("/api/projects", async (req, res) => {
    const userId = getUserId(req);
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Load sessions for each project to construct full Project object
        const mapped = await Promise.all((dbProj || []).map(async (p: any) => {
          const { data: dbSess } = await supabase
            .from("sessions")
            .select("*")
            .eq("project_id", p.id)
            .order("date", { ascending: false });
          
          return dbToProject(p, dbSess || []);
        }));

        return res.json(mapped);
      } catch (err: any) {
        console.error("Supabase GET /api/projects error, falling back to local file:", err.message);
      }
    }
    // Fallback to local
    const projects = readProjects();
    const userProjects = projects.filter(p => p.userId === userId);
    res.json(userProjects);
  });

  // GET /api/projects/stats - Overall stats
  app.get("/api/projects/stats", async (req, res) => {
    const userId = getUserId(req);
    let projects: Project[] = [];

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", userId);

        if (error) throw error;

        projects = await Promise.all((dbProj || []).map(async (p: any) => {
          const { data: dbSess } = await supabase
            .from("sessions")
            .select("*")
            .eq("project_id", p.id);
          
          return dbToProject(p, dbSess || []);
        }));
      } catch (err: any) {
        console.error("Supabase GET /api/projects/stats error, falling back to local file:", err.message);
        projects = readProjects().filter(p => p.userId === userId);
      }
    } else {
      projects = readProjects().filter(p => p.userId === userId);
    }

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'planning').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;

    const totalHoursLogged = projects.reduce((acc, p) => acc + (p.totalHoursSpent || 0), 0);
    const averageProgress = totalProjects > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects)
      : 0;
    
    const completionRate = totalProjects > 0
      ? Math.round((completedProjects / totalProjects) * 100)
      : 0;

    res.json({
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalHoursLogged,
      averageProgress,
      completionRate
    });
  });

  // GET /api/projects/:id - Get project details
  app.get("/api/projects/:id", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return res.status(404).json({ error: "Project not found or access denied" });
          }
          throw error;
        }

        const { data: dbSess } = await supabase
          .from("sessions")
          .select("*")
          .eq("project_id", id)
          .order("date", { ascending: false });

        return res.json(dbToProject(dbProj, dbSess || []));
      } catch (err: any) {
        console.error(`Supabase GET /api/projects/${id} error, falling back to local file:`, err.message);
      }
    }

    const projects = readProjects();
    const project = projects.find(p => p.id === id && p.userId === userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }
    res.json(project);
  });

  // GET /api/projects/:id/analytics - Project analytics
  app.get("/api/projects/:id/analytics", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    let sessions: any[] = [];
    let dbTasks: any[] = [];

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error: pErr } = await supabase
          .from("projects")
          .select("id")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (pErr) throw pErr;

        const { data: dbSess, error: sErr } = await supabase
          .from("sessions")
          .select("*")
          .eq("project_id", id)
          .order("date", { ascending: true });

        if (sErr) throw sErr;
        sessions = (dbSess || []).map(dbToSession);

        const { data: fetchedTasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", id)
          .eq("user_id", userId);
        if (fetchedTasks) {
          dbTasks = fetchedTasks;
        }
      } catch (err: any) {
        console.error(`Supabase GET /api/projects/${id}/analytics error, falling back to local file:`, err.message);
        const projects = readProjects();
        const project = projects.find(p => p.id === id && p.userId === userId);
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }
        sessions = project.sessions || [];
      }
    } else {
      const projects = readProjects();
      const project = projects.find(p => p.id === id && p.userId === userId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      sessions = project.sessions || [];
    }

    const moods = sessions.reduce((acc: any, s: any) => {
      if (s.mood) acc[s.mood] = (acc[s.mood] || 0) + 1;
      return acc;
    }, {});

    const totalMinutes = sessions.reduce((acc: number, s: any) => acc + (Number(s.duration) || 0), 0);
    
    const totalTasksCount = dbTasks.length;
    const completedTasksCount = dbTasks.filter((t: any) => t.status === "done").length;
    const pendingTasksCount = dbTasks.filter((t: any) => t.status !== "done" && t.status !== "cancelled").length;
    const tasksTotalMinutes = dbTasks.reduce((sum: number, t: any) => sum + (Number(t.spent_min) || 0), 0);
    const tasksList = dbTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      spent_min: Number(t.spent_min) || 0
    }));

    const productivityReport = {
      totalMinutes,
      avgSessionDuration: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
      moodDistribution: moods,
      recentVelocity: sessions.slice(-5).map((s: any) => ({
        date: s.date,
        duration: s.duration,
        tasksCount: s.tasksCompleted?.length || 0
      })),
      totalTasksCount,
      completedTasksCount,
      pendingTasksCount,
      tasksTotalMinutes,
      tasksList
    };

    res.json(productivityReport);
  });

  // POST /api/projects - Create project
  app.post("/api/projects", async (req, res) => {
    const userId = getUserId(req);
    const body = req.body;

    const generatedId = generateUUID();
    
    const newProject: Project = {
      id: generatedId,
      userId,
      title: body.title || "Untitled Project",
      description: body.description || "",
      thumbnail: body.thumbnail || "",
      images: body.images || [],
      technologies: body.technologies || [],
      links: body.links || {},
      status: body.status || "planning",
      priority: body.priority || "medium",
      estimatedHours: Number(body.estimatedHours) || 0,
      totalHoursSpent: 0,
      plannedSessions: Number(body.plannedSessions || body.plannedSesions) || 0,
      completedSessions: 0,
      sessions: [],
      progress: Number(body.progress) || 0,
      currentPhase: body.currentPhase || "Design",
      lastMilestone: body.lastMilestone || "",
      nextMilestone: body.nextMilestone || "",
      aiContext: body.aiContext || "Project initialized in planning phase.",
      milestones: body.milestones || [],
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      targetEndDate: body.targetEndDate || "",
      completedDate: body.completedDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const dbPayload = projectToDb(newProject);
        const { error } = await supabase
          .from("projects")
          .insert(dbPayload);

        if (error) throw error;
        return res.status(201).json(newProject);
      } catch (err: any) {
        console.error("Supabase POST /api/projects error, falling back to local file:", err.message);
      }
    }

    const projects = readProjects();
    projects.push(newProject);
    writeProjects(projects);

    res.status(201).json(newProject);
  });

  // PUT /api/projects/:id - Update project
  app.put("/api/projects/:id", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = req.body;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error: fErr } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fErr) throw fErr;

        const currentProject = dbToProject(dbProj, []);
        const updatedProject = {
          ...currentProject,
          ...body,
          id,
          userId,
          updatedAt: new Date().toISOString()
        };

        const dbPayload = projectToDb(updatedProject);
        const { error } = await supabase
          .from("projects")
          .update(dbPayload)
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;

        const { data: dbSess } = await supabase
          .from("sessions")
          .select("*")
          .eq("project_id", id)
          .order("date", { ascending: false });

        return res.json(dbToProject(dbPayload, dbSess || []));
      } catch (err: any) {
        console.error(`Supabase PUT /api/projects/${id} error, falling back to local file:`, err.message);
      }
    }

    const projects = readProjects();
    const index = projects.findIndex(p => p.id === id && p.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: "Project not found" });
    }

    const updatedProject = {
      ...projects[index],
      ...body,
      id: projects[index].id,
      userId: projects[index].userId,
      updatedAt: new Date().toISOString()
    };

    projects[index] = updatedProject;
    writeProjects(projects);

    res.json(updatedProject);
  });

  // DELETE /api/projects/:id - Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error: fErr } = await supabase
          .from("projects")
          .select("id")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fErr) {
          if (fErr.code === "PGRST116") {
            return res.status(404).json({ error: "Project not found" });
          }
          throw fErr;
        }

        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        return res.json({ success: true, message: "Project deleted successfully" });
      } catch (err: any) {
        console.error(`Supabase DELETE /api/projects/${id} error, falling back to local file:`, err.message);
      }
    }

    const projects = readProjects();
    const filtered = projects.filter(p => !(p.id === id && p.userId === userId));

    if (projects.length === filtered.length) {
      return res.status(404).json({ error: "Project not found" });
    }

    writeProjects(filtered);
    res.json({ success: true, message: "Project deleted successfully" });
  });

  // Helper to parse GitHub URL into owner and repo
  function parseGithubUrl(url: string) {
    if (!url) return null;
    const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "").trim();
    const parts = cleanUrl.split("/");
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/i, "")
      };
    }
    return null;
  }

  // GET /api/projects/:id/github - Fetch repository statistics and files from GitHub API
  app.get("/api/projects/:id/github", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;

    let project: any = null;
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();
        if (dbProj) project = dbToProject(dbProj, []);
      } catch (e) {}
    }

    if (!project) {
      const projects = readProjects();
      project = projects.find(p => p.id === id && p.userId === userId);
    }

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const githubUrl = project.links?.github;
    if (!githubUrl) {
      return res.json({ configured: false, error: "No GitHub URL configured for this project" });
    }

    const repoInfo = parseGithubUrl(githubUrl);
    if (!repoInfo) {
      return res.status(400).json({ configured: false, error: "Invalid GitHub URL format. Expected 'https://github.com/owner/repo'" });
    }

    const { owner, repo } = repoInfo;
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      "User-Agent": "AILearnerCoach-Applet"
    };
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }

    try {
      // 1. Fetch main repo details
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!repoRes.ok) {
        if (repoRes.status === 404) {
          return res.status(404).json({ configured: true, error: "Repository not found. Make sure it is public or GITHUB_TOKEN has access." });
        }
        throw new Error(`GitHub API returned status ${repoRes.status}`);
      }
      const repoData = await repoRes.json();

      // 2. Fetch recent commits (per_page=5)
      const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, { headers });
      let commits = [];
      if (commitsRes.ok) {
        const commitData = await commitsRes.json();
        commits = Array.isArray(commitData) ? commitData.map((c: any) => ({
          sha: c.sha,
          message: c.commit?.message,
          author: c.commit?.author?.name || c.author?.login,
          date: c.commit?.author?.date,
          url: c.html_url
        })) : [];
      }

      // 3. Fetch open Pull Requests
      const pullsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?per_page=5&state=all`, { headers });
      let pulls = [];
      if (pullsRes.ok) {
        const pullsData = await pullsRes.json();
        pulls = Array.isArray(pullsData) ? pullsData.map((p: any) => ({
          id: p.id,
          number: p.number,
          title: p.title,
          state: p.state,
          user: p.user?.login,
          createdAt: p.created_at,
          url: p.html_url
        })) : [];
      }

      // 4. Fetch repo languages
      const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
      let languages = {};
      if (langRes.ok) {
        languages = await langRes.json();
      }

      const responseData = {
        configured: true,
        repo: {
          name: repoData.name,
          fullName: repoData.full_name,
          description: repoData.description,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          openIssues: repoData.open_issues_count,
          defaultBranch: repoData.default_branch,
          updatedAt: repoData.updated_at,
          htmlUrl: repoData.html_url
        },
        commits,
        pulls,
        languages
      };

      res.json(responseData);
    } catch (err: any) {
      console.error("Error fetching GitHub details:", err);
      res.status(500).json({ configured: true, error: `Failed to fetch GitHub statistics: ${err.message}` });
    }
  });

  // ================= SESSIONS API =================

  // GET /api/projects/:id/sessions - Get sessions
  app.get("/api/projects/:id/sessions", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error: pErr } = await supabase
          .from("projects")
          .select("id")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (pErr) throw pErr;

        const { data: dbSess, error: sErr } = await supabase
          .from("sessions")
          .select("*")
          .eq("project_id", id)
          .order("date", { ascending: false });

        if (sErr) throw sErr;
        return res.json((dbSess || []).map(dbToSession));
      } catch (err: any) {
        console.error(`Supabase GET /api/projects/${id}/sessions error, falling back to local file:`, err.message);
      }
    }

    const projects = readProjects();
    const project = projects.find(p => p.id === id && p.userId === userId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project.sessions || []);
  });

  // POST /api/projects/:id/sessions - Log session
  app.post("/api/projects/:id/sessions", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = req.body;

    const durationMin = Number(body.duration) || 0;
    const hoursSpent = durationMin / 60;

    const generatedSessionId = generateUUID();

    const newSession = {
      id: generatedSessionId,
      projectId: id,
      title: body.title || `Working Session on ${new Date().toLocaleDateString()}`,
      description: body.description || "",
      date: body.date || new Date().toISOString().split('T')[0],
      duration: durationMin,
      tasksCompleted: body.tasksCompleted || [],
      notes: body.notes || "",
      mood: body.mood || "productive",
      createdAt: new Date().toISOString()
    };

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error: pErr } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (pErr) throw pErr;

        const project = dbToProject(dbProj, []);
        project.totalHoursSpent = Number((project.totalHoursSpent + hoursSpent).toFixed(1));
        project.completedSessions = (project.completedSessions || 0) + 1;

        if (body.progress !== undefined) {
          project.progress = Math.min(100, Math.max(0, Number(body.progress)));
        } else {
          project.progress = Math.min(100, project.progress + 5);
        }

        if (project.progress === 100) {
          project.status = "completed";
          project.completedDate = new Date().toISOString().split("T")[0];
        } else if (project.status === "planning") {
          project.status = "in-progress";
        }

        project.updatedAt = new Date().toISOString();

        const { error: sInsertErr } = await supabase
          .from("sessions")
          .insert(sessionToDb(newSession));

        if (sInsertErr) throw sInsertErr;

        const { error: pUpdateErr } = await supabase
          .from("projects")
          .update(projectToDb(project))
          .eq("id", id)
          .eq("user_id", userId);

        if (pUpdateErr) throw pUpdateErr;

        const { data: allSess } = await supabase
          .from("sessions")
          .select("*")
          .eq("project_id", id)
          .order("date", { ascending: false });

        const mappedProject = dbToProject(project, allSess || []);
        return res.status(201).json({ session: newSession, project: mappedProject });
      } catch (err: any) {
        console.error(`Supabase POST /api/projects/${id}/sessions error, falling back to local file:`, err.message);
      }
    }

    const projects = readProjects();
    const index = projects.findIndex(p => p.id === id && p.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projects[index];
    project.sessions = [newSession, ...(project.sessions || [])];
    project.totalHoursSpent = Number((project.totalHoursSpent + hoursSpent).toFixed(1));
    project.completedSessions = (project.completedSessions || 0) + 1;
    
    if (body.progress !== undefined) {
      project.progress = Math.min(100, Math.max(0, Number(body.progress)));
    } else {
      project.progress = Math.min(100, project.progress + 5);
    }

    if (project.progress === 100) {
      project.status = "completed";
      project.completedDate = new Date().toISOString().split("T")[0];
    } else if (project.status === "planning") {
      project.status = "in-progress";
    }

    project.updatedAt = new Date().toISOString();
    writeProjects(projects);

    res.status(201).json({ session: newSession, project });
  });

  // PUT /api/projects/:id/sessions/:sid - Update session
  app.put("/api/projects/:id/sessions/:sid", async (req, res) => {
    const userId = getUserId(req);
    const { id, sid } = req.params;
    const body = req.body;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data: dbProj, error: pErr } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (pErr) throw pErr;

        const { data: dbSess, error: sErr } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sid)
          .eq("project_id", id)
          .single();

        if (sErr) throw sErr;

        const oldSession = dbToSession(dbSess);
        const oldDuration = oldSession.duration || 0;
        const newDuration = Number(body.duration) || 0;
        const durationDiffHours = (newDuration - oldDuration) / 60;

        const project = dbToProject(dbProj, []);
        project.totalHoursSpent = Number((project.totalHoursSpent + durationDiffHours).toFixed(1));
        project.updatedAt = new Date().toISOString();

        const updatedSession = {
          ...oldSession,
          ...body,
          id: sid,
          projectId: id
        };

        const { error: sUpdateErr } = await supabase
          .from("sessions")
          .update(sessionToDb(updatedSession))
          .eq("id", sid)
          .eq("project_id", id);

        if (sUpdateErr) throw sUpdateErr;

        const { error: pUpdateErr } = await supabase
          .from("projects")
          .update(projectToDb(project))
          .eq("id", id)
          .eq("user_id", userId);

        if (pUpdateErr) throw pUpdateErr;

        return res.json(updatedSession);
      } catch (err: any) {
        console.error(`Supabase PUT /api/projects/${id}/sessions/${sid} error, falling back to local file:`, err.message);
      }
    }

    const projects = readProjects();
    const pIndex = projects.findIndex(p => p.id === id && p.userId === userId);

    if (pIndex === -1) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projects[pIndex];
    const sIndex = (project.sessions || []).findIndex((s: any) => s.id === sid);

    if (sIndex === -1) {
      return res.status(404).json({ error: "Session not found" });
    }

    const oldDuration = Number(project.sessions[sIndex].duration) || 0;
    const newDuration = Number(body.duration) || 0;
    const durationDiffHours = (newDuration - oldDuration) / 60;

    project.sessions[sIndex] = {
      ...project.sessions[sIndex],
      ...body,
      id: sid,
      projectId: id
    };

    project.totalHoursSpent = Number((project.totalHoursSpent + durationDiffHours).toFixed(1));
    project.updatedAt = new Date().toISOString();
    
    writeProjects(projects);
    res.json(project.sessions[sIndex]);
  });

  // ================= AI ESTIMATORS & ANALYZERS =================

  // POST /api/ai/estimate-project - Estimate new project
  app.post("/api/ai/estimate-project", async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Project title is required" });
    }

    try {
      const prompt = `User adds new project: "${title}"\nDescription: "${description || 'None'}"\n
Help me:
1. Suggest dividing the project into milestones with titles, estimatedHours, and tasks
2. Estimate the total Required Hours
3. Suggest a suitable number of sessions
4. Specify the appropriate technologies if none has been specified
5. Suggest an initial task breakdown and development phases.

Please return JSON strictly adhering to the schema. Do not output anything else.`;

      const systemInstruction = `You are a Senior Project Manager Assistant. Help the developer decompose their project.
Response Schema (JSON):
{
  "milestones": [
    { "title": "string", "estimatedHours": 12, "tasks": ["string"] }
  ],
  "totalEstimatedHours": 32,
  "suggestedSessions": 16,
  "technologies": ["string"],
  "phases": ["string"]
}`;

      const aiResponseText = await getGeminiResponse(prompt, systemInstruction);
      res.json(JSON.parse(aiResponseText));
    } catch (error: any) {
      console.error("AI Estimation Error:", error);
      // Fallback
      res.json({
        milestones: [
          { title: "Initialization & Setup", estimatedHours: 4, tasks: ["Initialize repo", "Configure tailwind & router"] },
          { title: "Core Features Development", estimatedHours: 15, tasks: ["Build main UI pages", "Integrate state handlers"] },
          { title: "Testing & Polish", estimatedHours: 6, tasks: ["Write tests", "Polish typography & shadows"] }
        ],
        totalEstimatedHours: 25,
        suggestedSessions: 12,
        technologies: ["React", "TypeScript", "TailwindCSS"],
        phases: ["Design", "Development", "Polish"]
      });
    }
  });

  // POST /api/ai/analyze-project - Analyze & suggest
  app.post("/api/ai/analyze-project", async (req, res) => {
    const { projectTitle, progress, lastSession, blockers } = req.body;

    try {
      const prompt = `Project: "${projectTitle}"
Progress: ${progress || 0}%
Last session: "${lastSession || 'None logged yet'}"
Current issues/blockers: "${blockers || 'None stated'}"

Help me check if the project is on track, recommend focus objectives for the next session, find overdue elements, and estimate remaining hours.`;

      const systemInstruction = `You are a career-focused project advisor. Analyze the logs and return recommendations.
Response Schema (JSON):
{
  "onTrack": true,
  "recommendation": "Main message string in Arabic/English according to tone",
  "nextSessionSuggestions": ["suggestion 1", "suggestion 2"],
  "estimateRemainingHours": 10,
  "warnings": ["warning 1"]
}`;

      const aiResponseText = await getGeminiResponse(prompt, systemInstruction);
      res.json(JSON.parse(aiResponseText));
    } catch (err) {
      console.error("AI Analysis Error:", err);
      res.json({
        onTrack: true,
        recommendation: "حافظ على حماسك! ركز على استكمال المهام الأساسية.",
        nextSessionSuggestions: ["أكمل واجهة الإدخال", "اربط لوحة التحكم بالبيانات"],
        estimateRemainingHours: 8,
        warnings: []
      });
    }
  });

  // POST /api/ai/daily-plan - Daily recommendations
  app.post("/api/ai/daily-plan", async (req, res) => {
    const { activeProjects, availableHours } = req.body;

    try {
      const prompt = `I have ${activeProjects?.length || 0} active projects:
${JSON.stringify(activeProjects || [])}

Context: I have ${availableHours || 4} hours available today.
Help me prioritize, allocate hours, and highlight urgent items or recommendations.`;

      const systemInstruction = `You are an AI planner. Prioritize projects based on deadline, status, and importance.
Response Schema (JSON):
{
  "prioritizedProjects": [
    { "projectId": "string", "suggestedHours": 2, "reason": "Reason details in Arabic/English" }
  ],
  "urgentTasks": ["string"],
  "recommendations": ["string"]
}`;

      const aiResponseText = await getGeminiResponse(prompt, systemInstruction);
      res.json(JSON.parse(aiResponseText));
    } catch (err) {
      console.error("AI Daily Plan Error:", err);
      // Fallback
      res.json({
        prioritizedProjects: (activeProjects || []).slice(0, 1).map((p: any) => ({
          projectId: p.id,
          suggestedHours: 2,
          reason: "مشروع يحتاج للمتابعة الفورية بناءً على تاريخ آخر تواصل."
        })),
        urgentTasks: ["استكمال العمل المفتوح"],
        recommendations: ["رتب جدولك اليومي ليعطيك فترات تركيز مدتها 45 دقيقة"]
      });
    }
  });


  // ================= MONTHLY PLANS API =================

  // GET /api/monthly-plans - List all monthly plans for the user
  app.get("/api/monthly-plans", async (req, res) => {
    const userId = getUserId(req);
    if (supabaseUrl && supabaseAnonKey && supabase) {
      try {
        const { data, error } = await supabase
          .from("monthly_plans")
          .select("*")
          .eq("user_id", userId)
          .order("month", { ascending: false });

        if (error) throw error;
        return res.json(data || []);
      } catch (err: any) {
        console.error("Error fetching monthly plans from database:", err.message);
        return res.status(500).json({ error: err.message });
      }
    }
    return res.json([]);
  });

  // POST /api/monthly-plans - Save or update manually entered focus areas / summary
  app.post("/api/monthly-plans", async (req, res) => {
    const userId = getUserId(req);
    const { month, ai_summary, focus_areas } = req.body;

    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    if (supabaseUrl && supabaseAnonKey && supabase) {
      try {
        const payload = {
          user_id: userId,
          month: month,
          ai_summary: ai_summary || "",
          focus_areas: focus_areas || [],
          generated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from("monthly_plans")
          .upsert(payload, { onConflict: "user_id,month" })
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json(data);
      } catch (err: any) {
        console.error("Error saving monthly plan to database:", err.message);
        return res.status(500).json({ error: err.message });
      }
    }
    return res.status(500).json({ error: "Database integration not configured" });
  });

  // POST /api/monthly-plans/generate - Generate strategy based on user profile and goals via AI
  app.post("/api/monthly-plans/generate", async (req, res) => {
    const userId = getUserId(req);
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }

    try {
      let activeGoalsText = "";
      let activeHabitsText = "";

      if (supabaseUrl && supabaseAnonKey && supabase) {
        try {
          const { data: goals } = await supabase.from("goals").select("title, description, timeframe").eq("user_id", userId);
          if (goals && goals.length > 0) {
            activeGoalsText = goals.map(g => `- [${g.timeframe || 'long-term'}] ${g.title}: ${g.description || ''}`).join("\n");
          }

          const { data: habits } = await supabase.from("habits").select("title, category").eq("user_id", userId);
          if (habits && habits.length > 0) {
            activeHabitsText = habits.map(h => `- [${h.category || ''}] ${h.title}`).join("\n");
          }
        } catch (dbErr) {
          console.error("Context fetch error inside monthly AI planner:", dbErr);
        }
      }

      const dateObj = new Date(month);
      const monthLabelEn = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const monthLabelAr = dateObj.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });

      const systemInstruction = `You are an elite, results-focused AI Life & Performance Coach.
Provide a high-performance monthly strategic roadmap and focus areas for ${monthLabelEn} (month: ${month}).
You must return a JSON response containing exactly the following format:
{
  "ai_summary": "detailed summary of focus points and tactical guidelines for this month in Arabic (Egyptian dialect) starting with a highly motivating coach tone.",
  "focus_areas": [
    { "title": "Focus Title Ar", "description": "Focus detail in Arabic", "category": "career/health/personal/etc" },
    { "title": "Focus Title Ar 2", "description": "Focus detail in Arabic", "category": "category" }
  ]
}
Provide strictly 2 to 4 high-level focus areas.
Ensure you align the monthly roadmap with these existing parameters if provided:
Active Goals:
${activeGoalsText || "No custom goals listed."}

Active Habits: ${activeHabitsText || "No custom habits listed."}

Do NOT wrap response in markdown code blocks like \`\`\`json. Return parseable JSON only.`;

      const prompt = `Generate a customized high-performance strategic monthly plan for ${monthLabelEn} (${monthLabelAr}) to achieve maximum output.`;
      const rawResponse = await getAIResponse(prompt, systemInstruction, true);
      
      let parsed;
      try {
        let cleanText = rawResponse.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();
        parsed = JSON.parse(cleanText);
      } catch (parseError: any) {
        console.error("AI JSON Parse Error fallback:", rawResponse, parseError);
        parsed = {
          ai_summary: `أهلاً بك يا بطل في التخطيط لشهر ${monthLabelAr}. هذا الشهر هو فرصتك لتحقيق أكبر قفزة في مسارك المهني والعملي. ركز على التنظيم والانتظام في عاداتك اليومية وسنحقق سوياً نتائج رائعة!`,
          focus_areas: [
            { "title": "التركيز المهني والتقني", "description": "تطوير مهارات الجوانب البرمجية ومتابعة تخطيط المشاريع أسبوعياً.", "category": "career" },
            { "title": "بناء العادات اليومية", "description": "الالتزام بالنوم والاستيقاظ المنظم لبناء السلاسل (Streaks) بنجاح.", "category": "personal" }
          ]
        };
      }

      if (supabaseUrl && supabaseAnonKey && supabase) {
        const payload = {
          user_id: userId,
          month: month,
          ai_summary: parsed.ai_summary || "",
          focus_areas: parsed.focus_areas || [],
          generated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from("monthly_plans")
          .upsert(payload, { onConflict: "user_id,month" })
          .select()
          .single();

        if (error) throw error;
        return res.json(data);
      } else {
        return res.json({ id: generateUUID(), ...parsed, month, generated_at: new Date().toISOString() });
      }
    } catch (err: any) {
      console.error("Generate Monthly Plan Error:", err);
      return res.status(500).json({ error: err.message || "Failed to generate monthly plan" });
    }
  });

  // DELETE /api/monthly-plans/:id - Delete monthly plan
  app.delete("/api/monthly-plans/:id", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;

    if (supabaseUrl && supabaseAnonKey && supabase) {
      try {
        const { error } = await supabase
          .from("monthly_plans")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        return res.json({ success: true });
      } catch (err: any) {
        console.error("Error deleting monthly plan:", err.message);
        return res.status(500).json({ error: err.message });
      }
    }
    return res.status(500).json({ error: "Database not configured" });
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
