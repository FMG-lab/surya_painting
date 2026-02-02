import { NowRequest, NowResponse } from '@vercel/node';
let createClient: any = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (e) { createClient = null; }
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { loadBranchesFixture } from '../../lib/server/branches';

function loadFixture() {
  return loadBranchesFixture();
}

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!supabase) {
      const data = loadFixture();
      return res.status(200).json({ branches: data });
    }

    const { data, error } = await supabase.from('branches').select('*').order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ branches: data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
