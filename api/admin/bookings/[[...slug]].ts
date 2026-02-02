import { NowRequest, NowResponse } from '@vercel/node';
let createClient: any = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { createClient = null; }

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabaseAdmin: any = null;
if (createClient && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    const slug = (req.query.slug || []) as string[];
    const action = (Array.isArray(slug) && slug.length > 0) ? slug[0] : '';

    // assign-queue: POST /api/admin/bookings/assign-queue { booking_id }
    if (action === 'assign-queue' && req.method === 'POST') {
      if (!supabaseAdmin) {
        const { requireRole } = require('../../../lib/server/auth');
        requireRole(req, res, ['admin', 'super_admin']);
      }

      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }

      const token = authHeader.toString().split(' ')[1];

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

      const { data, error: rpcErr } = await supabaseAdmin.rpc('assign_queue_for_booking', { p_booking_id: booking_id });
      if (rpcErr) return res.status(500).json({ error: rpcErr.message });

      const queue_no = Array.isArray(data) && data.length > 0 ? data[0] : null;

      return res.status(200).json({ success: true, queue_no });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
