export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { image, langName } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: { message: 'Missing image' } });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: 'GROQ_API_KEY is not set on the server' } });
    }

    const lang = langName || 'Arabic (Modern Standard Arabic, easy to read)';

    const system = `You are an expert product photo analyst and marketing copywriter, writing entirely in ${lang}. Look carefully at the product photo, read any visible text, brand name, or label on it, and identify the product type, then write marketing content following AIDA principles (Attention, Interest, Desire, Action).

Respond using EXACTLY this format, with no extra commentary before or after, and no Markdown symbols like asterisks:

[SEO]
(a 3-4 sentence SEO-friendly product description with natural keywords, based on what you see in the photo)
[KEYWORDS]
(5-8 short keywords separated by commas)
[BULLETS]
- selling point 1
- selling point 2
- selling point 3
- selling point 4
- selling point 5
[FB]
(a short-to-medium Facebook/Instagram ad paragraph following AIDA, ending with a clear call to action)
[TIKTOK]
(a very short, fast-paced TikTok ad script, max 3-4 short sentences)

IMPORTANT: Keep the section markers [SEO] [KEYWORDS] [BULLETS] [FB] [TIKTOK] exactly as shown, in English, but write ALL the actual content inside each section entirely in ${lang}. If you can read a product name or brand on the packaging, use it naturally in the description. If you can see a price written on the product, mention it briefly in the description.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this product and write the marketing content as instructed.' },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return res.status(groqResponse.status).json({
        error: { message: (data.error && data.error.message) || 'Groq request failed' },
      });
    }

    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    return res.status(200).json({ content: [{ text }] });

  } catch (e) {
    return res.status(500).json({ error: { message: e.message || 'Server error' } });
  }
}
