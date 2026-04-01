export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
        })
      }
    );
    clearTimeout(timeout);

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Gemini error' });

    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';
    return res.status(200).json({ result });

  } catch (error) {
    const msg = error.name === 'AbortError' ? 'Request timed out. Please try again.' : (error.message || 'Server error');
    return res.status(500).json({ error: msg });
  }
}
