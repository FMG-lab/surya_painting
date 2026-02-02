import { NowRequest, NowResponse } from '@vercel/node';
import { requireRole } from '../../lib/server/auth';
import fs from 'fs';
import path from 'path';

// Simple admin-only staff list/creation handler (fallback to fixture when supabase not configured)
export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    // allow admin and manager to view staff
    if (req.method === 'GET') {
      requireRole(req, res, ['admin', 'manager']);
      // load fixture
      const fixturePath = path.join(__dirname, '..', '..', '..', 'apps', 'admin', 'public', 'fixtures', 'staff.json');
      let data: any[] = [];
      try { if (fs.existsSync(fixturePath)) data = JSON.parse(fs.readFileSync(fixturePath, 'utf-8')); } catch (e) { }
      return res.status(200).json({ staff: data });
    }

    // create staff (admin only)
    if (req.method === 'POST') {
      requireRole(req, res, ['admin']);
      const body = req.body || {};
      if (!body.name || !body.role) return res.status(422).json({ error: 'name and role required' });
      // In real env: insert into DB. For fallback, return created object.
      const created = { id: `${Date.now()}`, name: body.name, role: body.role };
      return res.status(201).json({ staff: created });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    // requireRole throws after responding; ensure we don't double-send
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Internal error' });
    return;
  }
}
