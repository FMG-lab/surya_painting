#!/usr/bin/env node
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('email', { type: 'string', describe: 'email of seeded user to sign for' })
  .option('id', { type: 'string', describe: 'user id (UUID) to sign for' })
  .option('exp', { type: 'string', describe: 'token ttl (eg 1h or 3600s)', default: '1h' })
  .help()
  .argv;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in env');
  process.exit(1);
}

async function main() {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let payload = null;
  if (argv.id) {
    const { data, error } = await admin.from('private.test_jwt_payloads').select('*').eq('sub', argv.id).limit(1).maybeSingle();
    if (error) {
      console.error('Error querying payloads:', error.message || error);
      process.exit(1);
    }
    payload = data;
  } else if (argv.email) {
    const { data, error } = await admin.from('private.test_jwt_payloads').select('*').eq('email', argv.email).limit(1).maybeSingle();
    if (error) {
      console.error('Error querying payloads:', error.message || error);
      process.exit(1);
    }
    payload = data;
  } else {
    // fallback to first row
    const { data, error } = await admin.from('private.test_jwt_payloads').select('*').limit(1).maybeSingle();
    if (error) {
      console.error('Error querying payloads:', error.message || error);
      process.exit(1);
    }
    payload = data;
  }

  if (!payload) {
    console.error('No seeded user found in private.test_jwt_payloads. Did you run migrations?');
    process.exit(1);
  }

  const jwtPayload = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    claims: payload.claims || {}
  };

  const token = jwt.sign(jwtPayload, SUPABASE_SERVICE_ROLE_KEY, { algorithm: 'HS256', expiresIn: argv.exp });
  console.log(token);
}

main().catch((e) => { console.error(e); process.exit(1); });
