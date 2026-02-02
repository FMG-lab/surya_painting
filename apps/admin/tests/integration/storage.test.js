const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_PROOF_BUCKET || 'payment_proofs';
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');

  const admin = createClient(url, key);
  const filename = `integration_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.txt`;
  const content = Buffer.from('hello integration');

  const { data, error } = await admin.storage.from(bucket).upload(`integration/${filename}`, content, { upsert: true });
  if (error) throw error;

  // Generate signed url
  const { data: sdata, error: sErr } = await admin.storage.from(bucket).createSignedUrl(data.path, 60);
  if (sErr) throw sErr;
  assert.ok(sdata.signedUrl);

  // cleanup
  await admin.storage.from(bucket).remove([data.path]);

  console.log('storage integration test OK');
}

run().catch((e) => { console.error(e); process.exit(1); });
