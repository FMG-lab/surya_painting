import { NowRequest, NowResponse } from '@vercel/node';
import { requireRole } from '../../../../lib/server/auth';

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    const id = (req.query.id as string) || null;
    if (!id) return res.status(400).json({ error: 'id is required' });

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // only technicians may update progress (in fallback/dev)
    requireRole(req, res, ['technician']);

    const { status, note } = req.body || {};
    if (!status) return res.status(422).json({ error: 'status required' });

    // In real DB insert into work_progress. For fallback return created object
    const created = { id: `${Date.now()}`, booking_id: id, status, note, created_at: new Date().toISOString() };
    return res.status(201).json({ progress: created });
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Internal error' });
    return;
  }
}