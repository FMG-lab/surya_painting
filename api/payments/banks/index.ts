import { NowRequest, NowResponse } from '@vercel/node';

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const banks = [
      {
        bank: process.env.BANK_NAME || 'BCA',
        account: process.env.BANK_ACCOUNT || '1234567890',
        holder: process.env.BANK_HOLDER || 'SURYA PAINT',
        notes: process.env.BANK_NOTES || ''
      }
    ];

    return res.status(200).json({ banks });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
