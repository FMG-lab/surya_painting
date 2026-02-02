import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let dbUrl = process.env.DATABASE_URL;
dbUrl = dbUrl.replace('sslmode=require', 'sslmode=no-verify');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkBranches() {
  try {
    const res = await pool.query('SELECT COUNT(*) as count FROM branches');
    console.log('✅ Branches in database:', res.rows[0].count);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P01') {
      console.log('   Table does not exist - need to run migration');
    }
  } finally {
    await pool.end();
  }
}

checkBranches();
