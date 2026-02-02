import { NowRequest, NowResponse } from '@vercel/node';
let createClient: any = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { createClient = null; }

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROOF_BUCKET = process.env.SUPABASE_PROOF_BUCKET || 'payment_proofs';

let supabaseAdmin: any = null;
if (createClient && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    const slug = (req.query.slug || []) as string[];
    const action = (Array.isArray(slug) && slug.length > 0) ? slug[0] : '';

    // proof: GET /api/admin/payments/proof?payment_id=...
    if (action === 'proof' && req.method === 'GET') {
      if (!supabaseAdmin) {
        const { requireRole } = require('../../../lib/server/auth');
        requireRole(req, res, ['admin', 'super_admin']);
      } else {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader || !authHeader.toString().startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing Authorization header' });
        }
        const token = authHeader.toString().split(' ')[1];

        const { data: authUser, error: authErr } = await supabaseAdmin.auth.getUser(token as string);
        if (authErr || !authUser) return res.status(401).json({ error: 'Invalid token' });

        const userId = authUser.user.id;
        const { data: userRow, error: userErr } = await supabaseAdmin.from('users').select('role').eq('id', userId).single();
        if (userErr || !userRow || userRow.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
      }

      const payment_id = (req.query.payment_id as string) || null;
      if (!payment_id) return res.status(400).json({ error: 'payment_id query param is required' });

      const { data: payment, error: paymentErr } = await supabaseAdmin.from('payments').select('proof_path').eq('id', payment_id).single();
      if (paymentErr || !payment) return res.status(404).json({ error: 'Payment or proof not found' });
      if (!payment.proof_path) return res.status(404).json({ error: 'No proof file attached' });

      const { data: signedUrl, error: urlErr } = await supabaseAdmin.storage.from(PROOF_BUCKET).createSignedUrl(payment.proof_path, 60 * 60);
      if (urlErr) return res.status(500).json({ error: urlErr.message });

      return res.status(200).json({ url: signedUrl.signedUrl });
    }

    // verify: POST /api/admin/payments/verify { payment_id }
    if (action === 'verify' && req.method === 'POST') {
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

      const { payment_id } = req.body;
      if (!payment_id) return res.status(400).json({ error: 'payment_id required in body' });

      const { data, error: rpcErr } = await supabaseAdmin.rpc('verify_payment', {
        p_payment_id: payment_id,
        p_verifier: userId
      });

      if (rpcErr) return res.status(500).json({ error: rpcErr.message });

      const queue_no = Array.isArray(data) && data.length > 0 ? data[0].queue_no : null;

      return res.status(200).json({ success: true, queue_no });
    }

    // verify-batch: POST /api/admin/payments/verify-batch { payment_ids: [] }
    if (action === 'verify-batch' && req.method === 'POST') {
      let userId: string | null = null;

      if (!supabaseAdmin) {
        const { requireRole } = require('../../../lib/server/auth');
        requireRole(req, res, ['admin', 'super_admin']);
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
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
