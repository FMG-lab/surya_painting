import { NowRequest, NowResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function loadFixture() {
  try {
    const fixturePath = path.join(process.cwd(), 'apps/admin/public/fixtures/branches.json');
    if (fs.existsSync(fixturePath)) {
      return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    const id = (req.query.id as string) || null;
    if (!id) return res.status(400).json({ error: 'id is required' });

    if (req.method === 'GET') {
      if (!supabaseAdmin) {
        const { requireRole } = require('../../../lib/server/auth');
        requireRole(req, res, ['admin', 'manager', 'branch_manager']);
        const data = loadFixture().filter((b: any) => b.id === id);
        return res.status(200).json({ data: data.length ? data[0] : null });
      }

      const { data, error } = await supabaseAdmin.from('branches').select('*').eq('id', id).single();
      if (error) return res.status(404).json({ error: 'Branch not found' });
      return res.status(200).json({ data });
    }

    // For modifying data require super_admin when using real DB
    if (!supabaseAdmin) {
      const { requireRole } = require('../../../lib/server/auth');
      if (req.method === 'PUT') {
        requireRole(req, res, ['admin', 'super_admin']);
        const { name, address, capacity } = req.body;
        const updated = { id, name, address, capacity };
        return res.status(200).json({ data: updated });
      }
      if (req.method === 'DELETE') {
        requireRole(req, res, ['admin', 'super_admin']);
        return res.status(200).json({ success: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.toString().startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization header' });
    const token = authHeader.toString().split(' ')[1];

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.getUser(token as string);
    if (authErr || !authUser) return res.status(401).json({ error: 'Invalid token' });
    const userId = authUser.user.id;

    const { data: userRow } = await supabaseAdmin.from('users').select('role').eq('id', userId).single();
    if (!userRow || userRow.role !== 'super_admin') return res.status(403).json({ error: 'Only super_admin allowed' });

    if (req.method === 'PUT') {
      const { name, address, capacity } = req.body;
      const { data, error } = await supabaseAdmin.from('branches').update({ name, address, capacity }).eq('id', id).select('*');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data: data[0] });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin.from('branches').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
