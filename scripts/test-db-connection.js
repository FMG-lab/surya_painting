import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// For local testing with Vercel serverless (non-pooler)
// Replace pooler.supabase.com with direct database endpoint
let dbUrl = process.env.DATABASE_URL;

// If using pooler, also support direct connection
if (dbUrl && dbUrl.includes('pooler.supabase.com')) {
  console.log('Using Supabase pooler connection (pgBouncer)');
  // Pooler requires specific settings
  dbUrl = dbUrl.replace('sslmode=require&pgbouncer=true', 'sslmode=no-verify');
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  try {
    console.log('\n🔗 Testing database connection...');
    const res = await pool.query('SELECT NOW() as timestamp');
    console.log('✅ Connected! Server time:', res.rows[0].timestamp);

    const branchRes = await pool.query('SELECT COUNT(*) as count FROM branches');
    console.log('✅ Branches found:', branchRes.rows[0].count);

    const usersRes = await pool.query("SELECT COUNT(*) as count FROM private.users");
    console.log('✅ Users found:', usersRes.rows[0].count);

    console.log('\n✨ Database connection successful!\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === '42P01') {
      console.log('   → Table does not exist - run migration: npm run migrate');
    } else if (err.code === '42601' || err.message.includes('SSL')) {
      console.log('   → SSL/Connection issue - check DATABASE_URL');
    }
  } finally {
    await pool.end();
  }
}

testConnection();
