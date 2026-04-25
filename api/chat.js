export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var messages = req.body && req.body.messages;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  var SYSTEM_PROMPT = "You are Clementine, the warm and charming AI assistant for Creme de la Crepe. Help with locations, hours, menu, reservations, and catering. Be concise and friendly. If unsure, direct guests to call or visit the website.";

  try {
    var response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages),
        max_tokens: 300,
        temperature: 0.7
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
