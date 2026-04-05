export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body ?? {};
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }

  const secret = process.env.ADD_LINK_PASSWORD;
  if (!secret) {
    return res.status(500).json({ error: 'Server password not configured' });
  }

  const valid = password === secret;
  return res.status(200).json({ valid });
}
