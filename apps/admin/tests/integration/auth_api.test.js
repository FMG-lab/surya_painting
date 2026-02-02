const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.APP_URL; // Example: http://localhost:3000 or deployed preview URL
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');

  const admin = createClient(url, key);

  // Try to read seeded admin payload from view
  const { data: payloads, error: pErr } = await admin.from('private.test_jwt_payloads').select('*').eq('role', 'admin').limit(1).maybeSingle();
  if (pErr) throw pErr;
  if (!payloads) {
    console.warn('No seeded admin payload found in private.test_jwt_payloads; skipping remote API call.');
    console.log('You can generate a token using the scripts/gen-test-jwt.js script.');
    return;
  }

  const token = jwt.sign({ sub: payloads.sub, email: payloads.email, role: payloads.role }, key, { algorithm: 'HS256', expiresIn: '1h' });

  // If no APP_URL supplied, print token and skip remote calls
  if (!appUrl) {
    console.log('APP_URL not set; skipping remote API call. Example token:');
    console.log(token);
    return;
  }

  // Call admin branches endpoint as authenticated user
  const res = await fetch(`${appUrl}/api/admin/branches`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => null);

  // Expect 200 or 403 depending on seeded role privileges; admin seeded should be allowed
  assert.strictEqual(res.status, 200, `Expected 200 from ${appUrl}/api/admin/branches but got ${res.status}: ${JSON.stringify(body)}`);

  console.log('auth_api integration test OK');
}

run().catch((e) => { console.error(e); process.exit(1); });
