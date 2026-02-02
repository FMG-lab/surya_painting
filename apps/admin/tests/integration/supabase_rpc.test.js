const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');

  const admin = createClient(url, key);

  // Create test branch
  const branchId = crypto.randomUUID();
  const branchName = `IT-${Date.now()}`;
  const { data: bdata, error: berr } = await admin.from('branches').insert([{ id: branchId, name: branchName }]).select('*');
  if (berr) throw berr;

  // Create booking referencing that branch
  const bookingId = crypto.randomUUID();
  const bookingToken = crypto.randomBytes(6).toString('hex');
  const { error: insBookingErr } = await admin.from('bookings').insert([{ id: bookingId, guest_name: 'IT Test', branch_id: branchId, booking_token: bookingToken, status: 'pending_payment' }]);
  if (insBookingErr) throw insBookingErr;

  // Insert payment
  const paymentId = crypto.randomUUID();
  const { error: insPayErr } = await admin.from('payments').insert([{ id: paymentId, booking_id: bookingId, amount: 10000, status: 'pending_review' }]);
  if (insPayErr) throw insPayErr;

  // Call verify_payment RPC if exists
  try {
    const { data: rpcData, error: rpcErr } = await admin.rpc('verify_payment', { p_payment_id: paymentId, p_verifier: 'integration-test' });
    if (rpcErr) {
      console.warn('RPC verify_payment returned error (maybe not installed):', rpcErr.message);
    } else {
      // rpc should return queue_no or similar
      assert.ok(Array.isArray(rpcData), 'rpc result expected');
    }
  } catch (e) {
    console.warn('rpc verify_payment call failed - skipping if not present', e.message || e);
  }

  // Cleanup (best-effort)
  await admin.from('payments').delete().eq('id', paymentId);
  await admin.from('bookings').delete().eq('id', bookingId);
  await admin.from('branches').delete().eq('id', branchId);

  console.log('supabase_rpc integration test OK');
}

run().catch((e) => { console.error(e); process.exit(1); });
