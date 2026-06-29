# 🚀 Strategic Alignment & Performance Suite | Life Coaching & Productivity Hub

This application is an intelligent digital ecosystem designed to bridge the gap between long-term strategic planning (Life Coaching/Goals), mid-term execution (Projects), and daily tactical performance (Habits, Tasks, and Focus Sessions). Underpinned by custom-tailored AI interventions—serving as a psychological and performance-optimizing life coach—it keeps your goals aligned with your daily output.

---

## 🛠️ Unified System Ecosystem & Relational Interconnections

Traditional productivity applications keep tasks, projects, calendars, and timers in siloed views. This platform is engineered with **organic data lineage and real-time bidirectional triggers** that sync your focus sessions, daily tasks, project progress, and long-term roadmap.

```
                     ┌────────────────────────────────────────┐
                     │          AI Life Coach Mentor          │
                     │  - Reads: Mood, Streaks, Projects,     │
                     │           Tasks, and Strategic Plans   │
                     └───────────▲──────────────────▲─────────┘
                                 │                  │ (With Plan Context)
                                 │                  │
    ┌────────────────┐      (Link)   ┌──────────────┴─┐   (Export)   ┌───────────────────────┐
    │  Projects Hub  ◄───────────────┼►  Daily Tasks   ◄─────────────┼  Goals & Plans (AI)   │
    │ - Build Phases │               │  - Kanban Board│              │  - Timeframe Roadmap  │
    │ - Actual Hours │               │  - Prioritized │              │  - Seed Milestones    │
    └────────▲───────┘               └──────▲─────────┘              └───────────────────────┘
             │                              │
  (Auto Log  │                              │ (Launch Focus Session on Task)
   Session)  │                              │
             │                    ┌─────────┴─────────────┐
             └────────────────────┤ Global Pomodoro Engine│
                                  │ - Countdown/Stopwatch │
                                  └───────────────────────┘
```

### 1. Daily Tasks ↔ Project Analytics & Progress
* When structuring a task, it can be assigned a `project_id`.
* **Automatic Progress Synchronization:** Whenever you complete or toggle a task associated with a project, or log focus hours on it, the system calculates the ratio of completed goals. In the database, the backend dynamically calculates **Project Progress %** based on linked task completion and hours logged. 
* Once project progress reaches `100%`, the server automatically marks its status as `"completed"` and records the completion date timestamp.

### 2. Pomodoro & Stopwatch Timer ↔ Task Execution ↔ Project Sessions
* Focus blocks are initiated directly on active tasks (`activePomodoro`), rather than running as random timers.
* When a focus period successfully completes (either a 25-minute countdown block or manual stop of the Stopwatch):
  1. **Focus Activity Log:** A new record is registered in the database table `pomodoro_sessions` and linked to the active task (`task_id`), incrementing your focus streaks.
  2. **Automated Project session mapping:** If the task belongs to a project, the client triggers a background API call (`POST /api/projects/:id/sessions`) logging a project work session. This automatically updates the project's **Actual Hours Spent (total_hours_spent)** and increments its active **Completed Sessions**, reflecting real logged efforts instantly in your project analytics dashboard.

### 3. Long-Term Strategic Plans ↔ Task Board ↔ AI Advisor
* Goals are created with categorized timelines (e.g., 3 months, 6 months, 1 year). The **AI Plan Generator** parses the goal and triggers an elite roadmap generation, seeding the database with **Roadmap Milestones** and atomic action steps.
* **Direct Task Seeding:** Any milestone or task from your AI-designed roadmap has a "Today" button. Clicking this instantly instantiates the item as a real, active task on your daily Kanban board, automatically carrying the `goal_id` reference to maintain clean data lineage.
* **Contextual Discussion Interlinking:** Clicking the **Discuss** button on any strategic plan aggregates the entire goal description, currently defined milestones, and active-to-completed task counts. It redirects the user to the **AI Coach Room** preloaded with this precise JSON context, permitting deep conversational coaching on how to address obstacles on that particular goal.

### 4. Live-Coach Awareness of User State
* The AI Life Coach possesses full access to database contexts: user's daily habits compliance rates, remaining pending tasks, active project timelines, and their self-reported cognitive mood states. It leverages this context-awareness to deliver nuanced coaching recommendations, avoiding generic advice in favor of structured, psychological, and culturally attuned (English/Egyptian Arabic) coaching.

---

## 📂 Comprehensive Page-by-Page Architecture

### 1. 🏠 Dashboard (Primary Ingress Panel)
* **Core Goal:** Serves as a flight controller, displaying high-signal metrics for cognitive alignment.
* **Functional Capabilities:**
  - Displays daily completion progress: habit streaks, total logged Pomodoro sessions, and ratios of high-priority tasks.
  - Dynamically updates with situational, time-sensitive greetings matched to the user's timezone (e.g., morning reflections, evening winding-down check-ins).
  - Quick widgets to resume the `activePomodoro` session or launch high-priority tasks immediately.

### 2. 📋 Kanban Board & Tasks Workspace (`/pages/Tasks.tsx`)
* **Core Goal:** Combating procrastination, tracking daily commitments, and organizing workflows.
* **Functional Capabilities:**
  - Standard Kanban Swimlanes: "Yesterday's Pending / Draft", "📌 TO DO", "In Progress", and "Completed / Done".
  - **Overdue Task Relegation:** Features automatic end-of-day task rotation. If a task remains uncompleted past its designated due-date, it does not clutter your focused "TO DO" column; it is automatically relegated back to the "Yesterday's Pending" column upon starting a new day, maintaining focus discipline.
  - Direct Pomodoro Launchers on each card, which moves the task to the "In Progress" swimlane on start.

### 3. 🎯 Goals & Strategic Plans (`/pages/Plans.tsx`)
* **Core Goal:** Long-term vector management across various key facets of life (Professional, Health, Finance, Self-Development).
* **Functional Capabilities:**
  - **AI Plan Generator:** Leverages generative AI on the backend to design structured milestones and atomic, actionable steps.
  - Interactive roadmaps with progress check-blocks.
  - Manual micro-task additions linking back to the overall goal.
  - Unified "Discuss" flow translating goals directly into active conversation threads with the AI Life Coach.

### 4. 🗂️ Project Workspace (`/pages/ProjectsPage.tsx`)
* **Core Goal:** Tracking build phases, software architectures, hours logged, and development workflows.
* **Functional Capabilities:**
  - Comprehensive Project Grid categorizing projects into "planning", "in-progress", "on-hold", and "completed".
  - **Work Session Tracker & Interactive Timeline:** View and manage detailed logs of logged work sessions containing durations, notes, and task lists.
  - **GitHub API Integration:** Fetch repository logs, branch status, and structure maps for projects that require technical version tracking.
  - Fully integrated analytics utilizing Recharts (visualization of hours logged, workload distributions, and project statuses).

### 5. 🍅 Pomodoro & Focus Suite (`/pages/PomodoroPage.tsx`)
* **Core Goal:** Inducing deep-work states and tracking cognitive attention spans.
* **Functional Capabilities:**
  - **Flexible Timer Engine:** Seamlessly switch between Pomodoro Countdown (with automatic short/long break calculations) and an open-ended stopwatch focus mode.
  - **Dual Display Nodes:**
    - *Full-screen Focus Mode:* Strips out all sidebar navigation and dashboard artifacts, keeping your screen locked on the timer, sounds, and active task text to neutralize desktop distractions.
    - *Mini-Floating Timer:* A persistent, draggable global overlay allowing you to jump across pages (e.g., checking project files or writing notes) while keeping an eye on your countdown.
  - Micro-rewards and encouraging animations upon completing each focus block.

### 6. 📅 Habits Tracker (`/pages/Habits.tsx`)
* **Core Goal:** Behavioral conditioning through repetitive daily commitment patterns.
* **Functional Capabilities:**
  - Habit configurations with customizable schedules (daily, custom days of week).
  - Calculated daily compliance logs and streak counters (`streak_count`, `max_streak`).
  - Staggered calendar grids representing daily engagement rates over time.

### 7. 💬 AI Life Coach Conversational Chamber (`/pages/Chat.tsx`)
* **Core Goal:** Cognitive restructuring, stress resolution, and productivity analysis.
* **Functional Capabilities:**
  - Offers adaptive coaching personas (Strategic Life Coach vs. supportive Colloquial Egyptian Arab mentor).
  - Rich chat interface with action-trigger cards (e.g., "Analyze Procrastination", "Analyze Overdue Tasks", "Review My Week").
  - Seamlessly reads and references active habits compliance and project statuses during conversations to keep advice highly contextual.

### 8. 📝 Smart Notes Desk (`/pages/Notes.tsx`)
* **Core Goal:** Quick capture of cognitive ideas, technical specs, and reflection journals.
* **Functional Capabilities:**
  - Notes editor with categorize tags, custom card palettes, and search indexes.
  - **AI Text Summary Tool:** Instantly condenses long journals into bulleted takeaways, pushing action-points directly to your task queue.

### 9. ⭐ Favorites & Settings Control Panel
* **Favorites View:** Concentrates all bookmarked projects, note pads, and high-impact tasks across resources in a single, high-contrast dashboard block.
* **Settings Configuration:** Toggle language locales (EN/AR), adjust voice coaching settings, confirm database connections, and configure customizable focus-to-break intervals.

---

## 💾 Core Schemas & Database Operations

The application operates on a full-stack platform using Express + Vite. Data is persisted to a PostgreSQL Database (Supabase) with local file-storage fallbacks integrated dynamically on the server.

### Database Tables:
* `goals` - Long-term objectives with category, timeline, and descriptive notes.
* `plan_milestones` - Phase landmarks supporting strategic goals, containing estimated weeks, titles, and completion markers.
* `tasks` - Atomic action steps. Tracks priority levels (`high`, `medium`, `low`), statuses (`todo`, `in_progress`, `done`, `draft`), due dates, and links to `project_id` or `goal_id`.
* `projects` - Medium-term build projects containing target deadlines, total actual tracked hours, estimated hours, and repository structures.
* `sessions` - Individual logged duration cards mapped specifically to active projects.
* `pomodoro_sessions` - Focused deep work logs tied back to discrete tasks.
* `habits` - Routine metrics with execution rules, tracking schedules, and success arrays.
* `notes` - Content bodies with tags and customized color categories.

---

## 📦 Setting Up Environment Variable Credentials

Ensure your root `.env` or Server Environment configuration is populated with the following parameters:

```env
# Google Gemini API key used for server-side coaching & roadmap generation (NOT prefixed with VITE_)
GEMINI_API_KEY=your_gemini_api_key

# Supabase Database authentication credentials (client-side variables)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation & Launching Development Server locally:
1. Run `npm install` to download dependencies.
2. Launch the client and backend simultaneously through: `npm run dev`.
3. Verify linter and compilation with: `npm run lint` and `npm run build`.
