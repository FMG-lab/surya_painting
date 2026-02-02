import { NowRequest, NowResponse } from '@vercel/node';
let createClient: any = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { createClient = null; }
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PROOF_BUCKET = process.env.SUPABASE_PROOF_BUCKET || 'payment_proofs';

let supabaseAdmin: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function loadBookingMock(code: string) {
  // very small fallback for dev
  try {
    const fixturePath = path.join(process.cwd(), 'apps/admin/public/fixtures/payments.json');
    if (fs.existsSync(fixturePath)) return { booking_id: null, note: 'mock' };
  } catch (e) {
    // ignore
  }
  return null;
}

async function uploadProofFromBase64(base64: string, filename: string) {
  if (!supabaseAdmin) return null;
  // decode base64
  const matches = base64.match(/^data:([\w-+\/]+);base64,(.+)$/);
  let buffer: Buffer;
  let ext = 'bin';
  if (matches) {
    const data = matches[2];
    const mime = matches[1];
    buffer = Buffer.from(data, 'base64');
    ext = mime.split('/')[1] || 'bin';
  } else {
    buffer = Buffer.from(base64, 'base64');
  }

  const pathName = `proofs/${filename}.${ext}`;
  const { data, error } = await supabaseAdmin.storage.from(PROOF_BUCKET).upload(pathName, buffer, { upsert: true });
  if (error) throw error;
  return pathName;
}

async function sendFonnteNotification(message: string) {
  const token = process.env.FONNTE_TOKEN;
  const url = process.env.FONNTE_URL;
  const recipients = process.env.WHATSAPP_ADMIN_RECIPIENTS || '';
  if (!token || !url || !recipients) {
    // in dev just log
    console.log('Fonnte not configured, skip sending notification. Message:', message);
    return;
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipients: recipients.split(','), message })
    });
  } catch (e) {
    console.error('Failed to call Fonnte', e);
  }
}

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Support JSON payloads and multipart/form-data (file uploads)
    let booking_code: any = null;
    let amount: any = null;
    let bank_from: any = null;
    let transfer_time: any = null;
    let reference: any = null;
    let notes: any = null;
    let proof_base64: any = null;
    let proof_url: any = null;
    // If multipart/form-data, parse files and fields
    const contentType = (req.headers && (req.headers['content-type'] || req.headers['Content-Type'])) || '';
    if (contentType.includes('multipart/form-data')) {
      // lazy import to avoid adding runtime requirement for tests that don't need it
      const Busboy = require('busboy');
      const getMultipart = (reqAny: any) => new Promise((resolve, reject) => {
        const fields: any = {};
        const files: any = {};
        const busboy = new Busboy({ headers: reqAny.headers });
        busboy.on('field', (fieldname, val) => { fields[fieldname] = val; });
        busboy.on('file', (fieldname, file, info) => {
          const chunks: Buffer[] = [];
          const { filename, mimeType } = info || ({} as any);
          file.on('data', (d: Buffer) => chunks.push(d));
          file.on('end', () => {
            files[fieldname] = files[fieldname] || [];
            files[fieldname].push({ filename, mimeType, buffer: Buffer.concat(chunks) });
          });
        });
        busboy.on('finish', () => resolve({ fields, files }));
        busboy.on('error', reject);
        // If req is a stream
        if (typeof reqAny.pipe === 'function') {
          reqAny.pipe(busboy);
        } else {
          // No stream available (e.g., tests that pass body directly) try to feed raw body
          if (reqAny._body) {
            busboy.end(reqAny._body);
          } else {
            reject(new Error('Request is not stream and has no raw body'));
          }
        }
      });

      const parsed: any = await getMultipart(req as any).catch((e: any) => { throw e; });
      booking_code = parsed.fields.booking_code;
      amount = parsed.fields.amount;
      bank_from = parsed.fields.bank_from;
      transfer_time = parsed.fields.transfer_time;
      reference = parsed.fields.reference;
      notes = parsed.fields.notes;

      // if file provided, convert to proof_base64-like by storing buffer locally to upload function later
      if (parsed.files && parsed.files.proof && parsed.files.proof[0]) {
        const f = parsed.files.proof[0];
        proof_base64 = `data:${f.mimeType};base64,${f.buffer.toString('base64')}`;
      }
    } else {
      const body = req.body || {};
      booking_code = body.booking_code;
      amount = body.amount;
      bank_from = body.bank_from;
      transfer_time = body.transfer_time;
      reference = body.reference;
      notes = body.notes;
      proof_base64 = body.proof_base64;
      proof_url = body.proof_url;
    }

    if (!booking_code || !amount) return res.status(422).json({ error: 'booking_code and amount are required' });
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) return res.status(422).json({ error: 'amount must be a positive number' });

    // validation min/max
    const globalMin = process.env.PAYMENT_MIN ? Number(process.env.PAYMENT_MIN) : null;
    const globalMax = process.env.PAYMENT_MAX ? Number(process.env.PAYMENT_MAX) : null;

    if (globalMin && amountNum < globalMin) return res.status(422).json({ error: `Minimum payment is ${globalMin}` });
    if (globalMax && amountNum > globalMax) return res.status(422).json({ error: `Maximum payment is ${globalMax}` });

    if (!supabaseAdmin) {
      const mock = loadBookingMock(booking_code);
      const payment = { id: crypto.randomUUID(), status: 'pending_review' };

      // notify (mock)
      const msg = `Konfirmasi pembayaran baru\nBooking: ${booking_code}\nNominal: Rp ${amountNum}\nPelanggan: -\nCabang: -\nBank: ${bank_from || '-'}\nWaktu: ${transfer_time || '-'}\nRef: ${reference || '-'}\nStatus: /app/customer/track?code=${encodeURIComponent(booking_code)}`;
      await sendFonnteNotification(msg);

      return res.status(200).json({ message: 'Payment notified', payment });
    }

    // find booking id by code or token
    let bookingQuery = await supabaseAdmin.from('bookings').select('*').eq('id', booking_code).single().catch(() => ({ data: null }));
    let booking = bookingQuery && bookingQuery.data ? bookingQuery.data : null;
    if (!booking) {
      const { data } = await supabaseAdmin.from('bookings').select('*').eq('booking_token', booking_code).limit(1);
      booking = data && data[0] ? data[0] : null;
    }
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // per-branch min override
    const branchCode = (booking.branch_id && (await supabaseAdmin.from('branches').select('id').eq('id', booking.branch_id).single().then((r: any) => r.data && r.data.id ? r.data.id : null))) || null;
    const branchKey = branchCode ? String(branchCode).replace(/-/g, '_').toUpperCase() : null;
    const branchMin = branchKey && process.env[`PAYMENT_MIN_BRANCH_${branchKey}`] ? Number(process.env[`PAYMENT_MIN_BRANCH_${branchKey}`]) : null;
    const min = branchMin || globalMin;
    if (min && amountNum < min) return res.status(422).json({ error: `Minimum payment is ${min}` });

    // optional upload proof
    let proof_path: string | null = null;
    if (proof_base64) {
      const filename = crypto.randomBytes(6).toString('hex');
      const p = await uploadProofFromBase64(proof_base64, filename);
      proof_path = p;
    }
    if (proof_url) {
      // if proof_url provided, store as external link (we keep in notes)
    }

    const paymentPayload: any = {
      booking_id: booking.id,
      amount: amountNum,
      method: 'manual_transfer',
      proof_path: proof_path,
      status: 'pending_review',
      notes: notes || null
    };

    const { data: created, error: insErr } = await supabaseAdmin.from('payments').insert([paymentPayload]).select('*');
    if (insErr) return res.status(500).json({ error: insErr.message });

    const payment = created && created[0] ? created[0] : null;

    const branchInfo = await supabaseAdmin.from('branches').select('*').eq('id', booking.branch_id).single().then((r: any) => r.data || { name: '-', code: '-' });

    // send notification via Fonnte (if configured)
    const msg = `Konfirmasi pembayaran baru\nBooking: ${booking_code}\nNominal: Rp ${amountNum}\nPelanggan: ${booking.guest_name || '-'}\nCabang: ${branchInfo.name || '-'} [${branchInfo.code || '-'}]\nBank: ${bank_from || '-'}\nWaktu: ${transfer_time || '-'}\nRef: ${reference || '-'}\nStatus: ${process.env.NEXT_PUBLIC_BASE_PATH || ''}/app/customer/track?code=${encodeURIComponent(booking_code)}`;
    await sendFonnteNotification(msg);

    return res.status(200).json({ message: 'Payment notified', payment });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
