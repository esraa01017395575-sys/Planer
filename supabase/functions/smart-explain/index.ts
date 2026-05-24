const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gemini-api-key',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { taskTitle, context } = await req.json()

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: 'taskTitle is required' }),
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

    const systemInstruction = `
You are AI Coach Pro, an elite life coach and productivity expert.
Your task is to explain how to complete the given task in the absolute best, most efficient, and smartest way possible.

Provide a highly actionable, concise, and motivating guide.
Language: ALWAYS respond in colloquial Egyptian Arabic (اللهجة المصرية العامية المحببة والذكية والكوميدية أحياناً والمشجعة جداً). Use words like 'يا بطل', 'عاش يا وحش', 'جامد جداً', 'ولا تشيل هم', 'تمام كدا يا صاحبي', 'يلا بينا'. Keep responses highly organic, witty, encouraging, and friendly.

Structure your response with:
1. A warm energetic Egyptian greeting.
2. 3 actionable micro-steps to gain immediate momentum (highly specific and practical).
3. A clever time-saving or focus hack specific to the task.

Output in beautiful, clean markdown, but keep it concise and direct (max 120 words).
    `;

    const promptText = `كيف بطلّنا يقدر ينجز المهمة دي بأفضل طريقة وأذكى شكل ممكن؟
اسم المهمة: "${taskTitle}"
${context ? `السياق الحالي ليومه: ${context}` : ""}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`;
    
    const response = await fetch(url, {
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
