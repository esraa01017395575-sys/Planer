import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader?.replace('Bearer ', '') || '')
    if (!user) throw new Error('Unauthorized')

    const requestBody = await req.json()
    const { messages, context, language = 'ar' } = requestBody
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')

    const { data: profiles } = await supabaseClient.from('life_profiles').select('*').eq('user_id', user.id)
    const profile = profiles?.[0]

    // Define the tool for suggesting tasks
    const tools = [{
      type: "function",
      function: {
        name: "suggest_tasks",
        description: "Suggest a list of tasks and subtasks based on the conversation.",
        parameters: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Task title" },
                  subTasks: { type: "array", items: { type: "string" }, description: "List of subtasks" },
                  priority: { type: "string", enum: ["low", "medium", "high"] }
                },
                required: ["title"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    }]

    const SYSTEM_PROMPT = language === 'ar' 
      ? `أنت AI Coach Pro، مدرب حياة مصري محترف. تحدث بالعامية المصرية فقط.
         ملف المستخدم: يستيقظ ${profile?.wake_time || '07:00'}، ينام ${profile?.sleep_time || '23:00'}.
         المهام الحالية: ${JSON.stringify(context?.tasks || [])}.
         هدفك تحفيز المستخدم وتنظيم يومه. عندما تصل لاتفاق مع المستخدم على مهام معينة، استخدم وظيفة suggest_tasks لاقتراحها رسمياً.`
      : `You are AI Coach Pro, a professional life coach. Speak in English.
         Profile: Wakes ${profile?.wake_time || '07:00'}, Sleeps ${profile?.sleep_time || '23:00'}.
         Current Tasks: ${JSON.stringify(context?.tasks || [])}.
         Goal: Motivate and organize. Use suggest_tasks to formally propose tasks when agreed upon.`;

    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ 
            role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user', 
            content: m.content 
          }))
        ],
        model: 'gpt-4o-mini', // Much cheaper and efficient
        tools,
        tool_choice: "auto",
        stream: true
      })
    })

    return new Response(response.body, { 
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
