import { Pool } from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let dbUrl = process.env.DATABASE_URL;
dbUrl = dbUrl.replace('sslmode=require', 'sslmode=no-verify');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔧 Running migrations...');
    const sql = fs.readFileSync('./db/migrations/001_init.sql', 'utf8');
    await client.query("SELECT set_config('surya.reset_schema', 'true', false);");
    await client.query(sql);
    console.log('✅ Done! Tables created.');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();