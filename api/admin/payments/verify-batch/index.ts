import { NowRequest, NowResponse } from '@vercel/node';
let createClient: any = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { createClient = null; }

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabaseAdmin: any = null;
if (createClient && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let userId: string | null = null;

    // Fallback: when no supabaseAdmin available (dev/test), require role via header
    if (!supabaseAdmin) {
      const { requireRole } = require('../../../lib/server/auth');
      requireRole(req, res, ['admin', 'super_admin']);
      // Allow tests/dev to specify a test user id via header
      userId = (req.headers['x-test-user-id'] as string) || 'test-user';
    } else {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const token = authHeader.toString().split(' ')[1];

      const { data: authUser, error: authErr } = await supabaseAdmin.auth.getUser(token as string);
      if (authErr || !authUser) return res.status(401).json({ error: 'Invalid token' });

      userId = authUser.user.id;
      const { data: userRow, error: userErr } = await supabaseAdmin.from('users').select('role').eq('id', userId).single();
      if (userErr || !userRow || userRow.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    }

    const { payment_ids } = req.body;
    if (!Array.isArray(payment_ids) || payment_ids.length === 0) return res.status(400).json({ error: 'payment_ids array required' });

    const results: Array<{ id: string; success: boolean; queue_no?: number | null; error?: string }> = [];

    for (const id of payment_ids) {
      try {
        const { data, error } = await supabaseAdmin.rpc('verify_payment', { p_payment_id: id, p_verifier: userId });
        if (error) {
          results.push({ id, success: false, error: error.message });
        } else {
          const queue_no = Array.isArray(data) && data.length > 0 ? data[0].queue_no : null;
          results.push({ id, success: true, queue_no });
        }
      } catch (e: any) {
        results.push({ id, success: false, error: e.message });
      }
    }

    return res.status(200).json({ results });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
