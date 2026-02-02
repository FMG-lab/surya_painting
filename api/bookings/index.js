import { createBooking } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { guest_name, guest_phone, branch_id } = req.body;
    const booking = await createBooking(guest_name, guest_phone, branch_id);
    res.status(201).json({ booking_id: booking.id, code: booking.booking_token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
