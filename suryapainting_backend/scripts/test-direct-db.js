import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// For local testing: use direct database URL without pooler
// Replace pooler URL with direct database
let dbUrl = 'postgres://postgres.nsdidjnstgtcrbedliva:wgTVcTjH82SL9b9c@aws-1-ap-southeast-1.nrt.supabase.co:5432/postgres?sslmode=no-verify';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as time');
    console.log('✅ Connected at:', res.rows[0].time);

    const branchRes = await pool.query('SELECT COUNT(*) as count FROM branches');
    console.log('✅ Branches found:', branchRes.rows[0].count);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
