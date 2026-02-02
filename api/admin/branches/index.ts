import { NowRequest, NowResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { loadFixture, findBranchById } from './utils.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method === 'GET') {
      // list branches
      if (!supabaseAdmin) {
        const data = loadFixture();
        return res.status(200).json({ data });
      }

      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const token = authHeader && authHeader.toString().startsWith('Bearer ') ? authHeader.toString().split(' ')[1] : null;
      if (!token) return res.status(401).json({ error: 'Missing Authorization header' });

      const { data: authUser, error: authErr } = await supabaseAdmin.auth.getUser(token as string);
      if (authErr || !authUser) return res.status(401).json({ error: 'Invalid token' });

      const userId = authUser.user.id;
      const { data: userRow } = await supabaseAdmin.from('users').select('role, branch_id').eq('id', userId).single();
      if (!userRow) return res.status(403).json({ error: 'Forbidden' });

      if (userRow.role === 'super_admin') {
        const { data, error } = await supabaseAdmin.from('branches').select('*').order('created_at', { ascending: true });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ data });
      }

      if (userRow.role === 'branch_manager') {
        const { data, error } = await supabaseAdmin.from('branches').select('*').eq('id', userRow.branch_id).single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ data: data ? [data] : [] });
      }

      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'POST') {
      // create branch (super_admin only)
      if (!supabaseAdmin) {
        // return created object based on request body
        const { name, address, capacity } = req.body;
        const id = require('crypto').randomUUID();
        const created = { id, name, address, capacity: capacity || 1 };
        return res.status(201).json({ data: created });
      }

      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (!authHeader || !authHeader.toString().startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization header' });
      const token = authHeader.toString().split(' ')[1];

      const { data: authUser, error: authErr } = await supabaseAdmin.auth.getUser(token as string);
      if (authErr || !authUser) return res.status(401).json({ error: 'Invalid token' });
      const userId = authUser.user.id;

      const { data: userRow } = await supabaseAdmin.from('users').select('role').eq('id', userId).single();
      if (!userRow || userRow.role !== 'super_admin') return res.status(403).json({ error: 'Only super_admin allowed' });

      const { name, address, capacity } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });

      const { data, error } = await supabaseAdmin.from('branches').insert([{ name, address, capacity }]).select('*');
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ data: data[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
