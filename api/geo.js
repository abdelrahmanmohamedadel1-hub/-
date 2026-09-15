export default function handler(req, res) {
  const country =
    req.headers['x-vercel-ip-country'] ||
    req.headers['x-vercel-ip-country-region'] ||
    null;

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ country });
}
