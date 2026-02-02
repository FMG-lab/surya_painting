import { NowRequest, NowResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { requireRole } from '../../../lib/server/auth';

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method === 'GET') {
      // allow technicians and admins to list tasks
      requireRole(req, res, ['technician', 'admin']);

      const fixturePath = path.join(__dirname, '..', '..', '..', '..', 'apps', 'admin', 'public', 'fixtures', 'tasks.json');
      let data: any[] = [];
      try { if (fs.existsSync(fixturePath)) data = JSON.parse(fs.readFileSync(fixturePath, 'utf-8')); } catch (e) { }
      return res.status(200).json({ tasks: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Internal error' });
    return;
  }
}