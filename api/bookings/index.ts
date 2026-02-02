import { NowRequest, NowResponse } from '@vercel/node';
let createClient: any = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { createClient = null; }
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { findBranchById } = require('../lib/server/branches');

function loadBranchFixture(id?: string) {
  if (!id) return findBranchById('') ? [findBranchById('')].filter(Boolean) : [];
  return findBranchById(id);
}

function makeHumanCode(branchCode: string) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = crypto.randomBytes(2).toString('hex').slice(0, 4).toUpperCase();
  return `SP-${branchCode}-${yy}${mm}-${rand}`;
}

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = req.body || {};
    const { branch_id, customer_name, phone, vehicle_type, items, color, notes, plateNumber } = body;

    if (!branch_id || !customer_name) return res.status(422).json({ error: 'branch_id and customer_name are required' });

    if (!supabaseAdmin) {
      // fallback: return a mocked booking
      const branch = loadBranchFixture(branch_id) || { id: branch_id, code: 'UNKNOWN', name: 'Unknown' };
      const id = crypto.randomUUID();
      const code = id;
      const code_human = makeHumanCode(branch.code || 'UNK');
      const booking = {
        id,
        code,
        code_human,
        status: 'pending_payment',
        branch: { id: branch.id, code: branch.code, name: branch.name }
      };
      return res.status(201).json({ message: 'Booking dibuat. Silakan lakukan pembayaran.', booking });
    }

    // create booking in DB with service role
    const { data: branchRow, error: branchErr } = await supabaseAdmin.from('branches').select('id').eq('id', branch_id).single();
    if (branchErr || !branchRow) return res.status(404).json({ error: 'Branch not found' });

    const id = crypto.randomUUID();
    const booking_token = crypto.randomBytes(6).toString('hex');
    const code = id;

    // determine branch code for human code
    const { data: branchInfo } = await supabaseAdmin.from('branches').select('*').eq('id', branch_id).single();
    const branchCode = (branchInfo && (branchInfo.code || (branchInfo.name || '').split(' ')[0].toUpperCase())) || 'UNK';
    const code_human = makeHumanCode(branchCode);

    const insert = {
      id,
      guest_name: customer_name,
      guest_phone: phone,
      plate_number: plateNumber || null,
      branch_id,
      total_price: 0,
      status: 'pending_payment',
      booking_token,
    };

    const { error: insErr } = await supabaseAdmin.from('bookings').insert([insert]);
    if (insErr) return res.status(500).json({ error: insErr.message });

    // return response matching README
    const booking = {
      id,
      code,
      code_human,
      status: 'pending_payment',
      branch: { id: branch_id, code: branchCode, name: (branchInfo && branchInfo.name) || '' }
    };

    return res.status(201).json({ message: 'Booking dibuat. Silakan lakukan pembayaran.', booking });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
