export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, prompt } = req.body || {};
    if (!image || !prompt) {
      return res.status(400).json({ error: 'Missing image or prompt' });
    }

    const token = process.env.POLLINATIONS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'POLLINATIONS_TOKEN is not set on the server' });
    }

    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mimeType });

    const form = new FormData();
    form.append('image', blob, 'product.jpg');
    form.append('prompt', prompt);
    form.append('model', 'kontext');
    form.append('size', '1024x1024');

    const upstream = await fetch('https://gen.pollinations.ai/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form,
    });

    const contentType = upstream.headers.get('content-type') || '';

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: text || 'Image edit failed' });
    }

    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      const item = data.data && data.data[0];
      if (!item) {
        return res.status(500).json({ error: 'No image returned' });
      }
      if (item.b64_json) {
        const outBuffer = Buffer.from(item.b64_json, 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(outBuffer);
      }
      if (item.url) {
        const imgRes = await fetch(item.url);
        const arrBuf = await imgRes.arrayBuffer();
        res.setHeader('Content-Type', imgRes.headers.get('content-type') || 'image/png');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(Buffer.from(arrBuf));
      }
      return res.status(500).json({ error: 'Unrecognized response format' });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', contentType || 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(arrayBuffer));

  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
