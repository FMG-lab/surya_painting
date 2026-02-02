import { NowRequest, NowResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { requireRole } from '../../../lib/server/auth';

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // only manager or admin can access
    requireRole(req, res, ['manager', 'admin']);

    // fallback reading payments fixture and return booking-like items
    const fixturePath = path.join(__dirname, '..', '..', '..', 'apps', 'admin', 'public', 'fixtures', 'payments.json');
    let data: any[] = [];
    try { if (fs.existsSync(fixturePath)) data = JSON.parse(fs.readFileSync(fixturePath, 'utf-8')); } catch (e) { }

    const bookings = data.map((p: any) => ({ id: p.bookings?.id || null, booking_code: p.bookings?.code || null, status: p.status }));
    return res.status(200).json({ bookings });
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Internal error' });
    return;
  }
}