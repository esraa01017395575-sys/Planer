# AI Mentor & Edge Function Implementation Plan

## Overview
The AI Mentor is designed to be a high-performance productivity coach integrated within the Smart OS. The implementation leverages a server-side "Edge Function" path to securely interact with the Gemini API while maintaining context-awareness of the user's data.

## 1. Technical Architecture
- **Backend (Edge Function)**: An Express route at `/api/chat` acting as a secure proxy.
- **AI Model**: Gemini 1.5 Flash (or Pro) for fast, context-aware reasoning.
- **Context Injection**:
  - The frontend sends the current state of tasks, habits, and schedule with each request.
  - The server injects this into the `systemInstruction` to ensure the AI "knows" what the user is working on.

## 2. AI Mentor Characteristics
- **Persona**: Direct, high-performance life coach.
- **Language Support**: Adaptive switching between Arabic and English based on the site's language setting.
- **Action Oriented**: Instead of generic advice, it suggests specific task breakdowns, Pomodoro sessions, and habit adjustments.

## 3. Key Features
- **Semantic Search**: (Future) Ability to search through user notes and past sessions.
- **Image Analysis**: Multimodal support for analyzing screenshots of plans or handwritten notes.
- **Function Calling**: Implementing tools that allow the AI to:
  - `create_task(title, priority, due_date)`
  - `log_habit(habit_id)`
  - `suggest_schedule(day_data)`

## 4. Implementation Steps
1. **Context Synchronization**: Refine how the frontend harvests context (already implemented).
2. **System Instruction Hardening**: Ensure the persona is consistent across sessions (already implemented).
3. **Multi-turn Memory**: Using `getChatMessages` to provide historical context to the Gemini API for consistent conversation.
4. **Resiliency**: Implementing fallback responses and clear error handling for API quotas.

## 5. Security & Privacy
- **API Keys**: All keys are stored in environment variables and never exposed to the client.
- **Data Isolation**: Each chat session is tied to the `authenticated_user_id`.
