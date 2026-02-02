import { NowRequest, NowResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // In fallback / tests we rely on header-based role simulation
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

    const { booking_id } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'booking_id required in body' });

    // Call assign_queue_for_booking RPC
    const { data, error: rpcErr } = await supabaseAdmin.rpc('assign_queue_for_booking', { p_booking_id: booking_id });
    if (rpcErr) return res.status(500).json({ error: rpcErr.message });

    const queue_no = Array.isArray(data) && data.length > 0 ? data[0] : null;

    return res.status(200).json({ success: true, queue_no });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
