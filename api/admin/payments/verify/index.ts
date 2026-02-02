import { NowRequest, NowResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Fallback role check for tests
    if (!supabaseAdmin) {
      const { requireRole } = require('../../../lib/server/auth');
      requireRole(req, res, ['admin', 'super_admin']);
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.toString().split(' ')[1];

    // Validate user token and ensure role = super_admin
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.getUser(token as string);
    if (authErr || !authUser) return res.status(401).json({ error: 'Invalid token' });

    const userId = authUser.user.id;

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userErr || !userRow) return res.status(403).json({ error: 'Forbidden' });
    if (userRow.role !== 'super_admin') return res.status(403).json({ error: 'Only super_admin allowed' });

    const { payment_id } = req.body;
    if (!payment_id) return res.status(400).json({ error: 'payment_id required in body' });

    // Call verify_payment RPC which performs atomic queue assignment and payment verification
    const { data, error: rpcErr } = await supabaseAdmin.rpc('verify_payment', {
      p_payment_id: payment_id,
      p_verifier: userId
    });

    if (rpcErr) return res.status(500).json({ error: rpcErr.message });

    // rpc returns table(queue_no integer)
    const queue_no = Array.isArray(data) && data.length > 0 ? data[0].queue_no : null;

    return res.status(200).json({ success: true, queue_no });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
