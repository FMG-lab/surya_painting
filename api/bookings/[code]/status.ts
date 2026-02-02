import { NowRequest, NowResponse } from '@vercel/node';
let createClient: any = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { createClient = null; }
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function loadMockBooking(code: string) {
  try {
    // attempt to find in fixtures (payments/bookings not available by default)
    const fixturePath = path.join(process.cwd(), 'apps/admin/public/fixtures/payments.json');
    if (fs.existsSync(fixturePath)) {
      const arr = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      // pick first payment's booking for demo
      if (arr.length) {
        return {
          code: code,
          code_human: 'MOCK',
          status: 'pending_payment',
          queue_number: null,
          branch: { id: arr[0].bookings?.branch_id || null, code: 'MOCK', name: 'Mock Branch' },
          progress: [{ status: 'pending_payment', note: 'Menunggu pembayaran', created_at: new Date().toISOString() }]
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    const code = (req.query.code as string) || null;
    if (!code) return res.status(400).json({ error: 'code is required' });

    if (!supabase) {
      const mock = loadMockBooking(code);
      if (!mock) return res.status(404).json({ error: 'Booking not found' });
      return res.status(200).json(mock);
    }

    // Try to find by id (uuid) or by code_human
    let { data: bookingById } = await supabase.from('bookings').select('*, branches:branches(id, name)').eq('id', code).single().catch(() => ({ data: null }));
    if (!bookingById) {
      // fallback by code_human stored maybe in booking_token or separate table; try booking_token or code_human column if exists
      const { data } = await supabase.from('bookings').select('*, branches:branches(id, name)').eq('booking_token', code).limit(1);
      bookingById = data && data[0] ? data[0] : null;
    }

    if (!bookingById) return res.status(404).json({ error: 'Booking not found' });

    // build progress from work_progress
    const { data: progress } = await supabase.from('work_progress').select('*').eq('booking_id', bookingById.id).order('created_at', { ascending: true });

    const resp = {
      code: bookingById.id,
      code_human: bookingById.booking_token || null,
      status: bookingById.status,
      queue_number: bookingById.queue_no || null,
      branch: { id: bookingById.branch_id, name: bookingById.branches?.name },
      progress: (progress || []).map((p: any) => ({ status: p.status, note: p.notes, created_at: p.created_at }))
    };

    return res.status(200).json(resp);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
