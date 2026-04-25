/**
 * Vercel Serverless Function — POST /api/chat
 * Body: { messages: [{ role, content }], systemPrompt?: string }
 * Env: OPENAI_API_KEY (set in Vercel Dashboard → Settings → Environment Variables)
 */

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      ok: true,
      hint: 'POST JSON { messages: [...] } to use OpenAI. Optional: systemPrompt (string).',
      openaiConfigured: !!process.env.OPENAI_API_KEY
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch (e) {
      body = {};
    }
  }
  if (!body || typeof body !== 'object') {
    body = {};
  }

  var messages = body.messages;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  var customPrompt = body.systemPrompt;
  var isProFast =
    typeof customPrompt === 'string' && customPrompt.trim().length > 0;
  var SYSTEM_PROMPT = isProFast
    ? customPrompt.trim()
    : "You are Clementine, the warm and charming AI assistant for Creme de la Crepe. Help with locations, hours, menu, reservations, and catering. Be concise and friendly. If unsure, direct guests to call or visit the website.";

  var MAX_SYSTEM_CHARS = 12000;
  if (SYSTEM_PROMPT.length > MAX_SYSTEM_CHARS) {
    SYSTEM_PROMPT =
      SYSTEM_PROMPT.slice(0, MAX_SYSTEM_CHARS) + '\n[Truncated for model limits.]';
  }

  var maxTokens = isProFast ? 450 : 300;
  var temperature = isProFast ? 0.4 : 0.7;

  try {
    var response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages),
        max_tokens: maxTokens,
        temperature: temperature
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'AI service error' });
    }

    var data = await response.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ reply: reply || 'Sorry, I could not generate a reply.' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = handler;
