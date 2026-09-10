export const config = {
  maxDuration: 60,
};
 
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  try {
    const prompt = req.query.prompt;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }
 
    const token = process.env.POLLINATIONS_TOKEN;
    const seed = Math.floor(Math.random() * 2147483647);
    const targetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&nofeed=true&safe=true&seed=${seed}`;
 
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
 
    const upstream = await fetch(targetUrl, { headers });
 
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: text || 'Image generation failed' });
    }
 
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
 
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
 
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
 
