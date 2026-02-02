import { NowRequest, NowResponse } from '@vercel/node';
let createClient: any = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { createClient = null; }

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: any = null;
// Prefer service role key for server-side access (bypasses RLS when appropriate), otherwise fall back to anon key
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} else if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not configured' });
    }

    const { data, error } = await supabase.from('branches').select('*').order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase branches query failed', error);
      return res.status(500).json({ error: error.message || 'Database error' });
    }

    return res.status(200).json({ branches: data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
