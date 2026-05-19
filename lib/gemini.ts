import { GoogleGenAI, Type } from "@google/genai";

const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;

// Client-side initialization removed for security. Use server-side proxy instead.
export const ai = null as any;

export const suggestTasksTool = {
  name: "suggest_tasks",
  description: "Suggest a list of tasks for the user's daily schedule",
  parameters: {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            time: { type: Type.STRING, description: "Format: HH:MM" },
            duration: { type: Type.NUMBER, description: "Duration in minutes" },
            priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "time", "duration"]
        }
      }
    },
    required: ["tasks"]
  }
};

export const cleanAIResponse = (text: string) => {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/##/g, "")
    .replace(/```/g, "")
    .trim();
};

export const buildSystemPrompt = (profile: any, context: any) => {
  return `You are a productivity coach and life OS for ${profile.name || "user"}.
Context loaded:
- Schedule: wake ${profile.wake_time || "07:00"}, sleep ${profile.sleep_time || "23:00"}, work ${profile.work_start || "09:00"}–${profile.work_end || "17:00"}
- Energy peak: ${profile.energy_peak || "morning"}
- Active plans: ${context.active_plans || "none"}
- Today pending tasks: ${context.pending_tasks || "none"}
- Yesterday completed: ${context.completed_yesterday || "none"}
- Yesterday skipped: ${context.skipped_yesterday || "none"}
- Habit streaks today: ${context.habit_status || "none"}

Behavior rules:
1. Respond in ${context.language || "English"} (default: English)
2. Keep responses short — max 5 lines
3. Never output JSON, markdown bold, or bullet symbols in chat
4. When suggesting tasks, ALWAYS use the suggest_tasks function (Smart Cards)
5. Push back on repeated skipped tasks or bad patterns
6. One question at a time — never ask two things in one message
7. When a note or task is sent via ⭐ or ?, acknowledge and respond to it
8. Detect time conflicts — warn, ask, then update on confirmation`;
};
