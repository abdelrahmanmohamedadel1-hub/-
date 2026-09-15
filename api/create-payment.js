export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.PAYMOB_API_KEY;

  // Paymob keys aren't configured yet — return a clear, friendly status
  // instead of crashing, so the pricing page can show "coming soon".
  if (!apiKey) {
    return res.status(503).json({ error: 'payment_not_ready' });
  }

  // TODO: once PAYMOB_API_KEY (and related Paymob credentials) are set
  // in Vercel's Environment Variables, replace this with the real
  // Paymob order + payment-key + iframe flow.
  return res.status(501).json({ error: 'not_implemented' });
}
