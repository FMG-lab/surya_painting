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
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Fallback: when no supabaseAdmin available, require role via header
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
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
