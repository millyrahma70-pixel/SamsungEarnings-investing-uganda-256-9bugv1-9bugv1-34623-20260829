export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { amount, phone, network, userId } = req.body;

  // Use your real PesaJet endpoint from your PesaJet Dashboard > API Docs
  const response = await fetch('https://api.pesajet.com/v1/payments/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PESAJET_SECRET_KEY}`,
    },
    body: JSON.stringify({ amount, phone, network, reference: `LEGENDS-${userId}-${Date.now()}` }),
  });

  const data = await response.json();
  if (!response.ok) return res.status(400).json({ message: data.message || 'PesaJet failed' });
  return res.status(200).json(data);
}
