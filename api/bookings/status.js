import { getBookingStatus } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { code } = req.query;

    if (req.method === 'GET') {
      if (!code) return res.status(400).json({ error: 'Booking code required' });
      const booking = await getBookingStatus(code);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      return res.status(200).json(booking);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
